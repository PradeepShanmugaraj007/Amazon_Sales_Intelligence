import re
from app.utils.helpers import safe_float

def normalize_string(s):
    if not s: return ""
    s = s.lower()
    s = re.sub(r'^(mr|mrs|ms|dr|prof|m/s)\.?\s+', '', s)
    s = re.sub(r'[^a-z0-9\s]', '', s)
    return "".join(s.split())

def generate_fraud_alerts(shipments, returns):
    customers = {}
    
    # Process All Transactions (Shipments + Returns) to build customer profiles
    all_transactions = [
        {"type": "shipment", "data": s} for s in shipments
    ] + [
        {"type": "return", "data": r} for r in returns
    ]

    for item in all_transactions:
        t_type = item["type"]
        r = item["data"]
        
        city = r.get("Ship To City") or r.get("Bill To City") or r.get("City") or "Unknown"
        state = r.get("Ship To State") or r.get("Bill To State") or r.get("State") or "Unknown"
        zip_code = str(r.get("Ship To Zip") or r.get("Bill To Zip") or r.get("Postal Code") or r.get("Pincode") or "").strip()
        buyerName = r.get("Buyer Name") or r.get("Recipient Name") or r.get("Customer Name") or ""
        gstin = (r.get("Gstin") or "").strip().upper()
        
        # Identity Fingerprinting
        norm_name = normalize_string(buyerName)
        norm_city = normalize_string(city)
        norm_zip = re.sub(r'[^0-9]', '', zip_code)
        
        if gstin and gstin != 'N/A' and len(gstin) > 5:
            cid = f"B2B_{gstin}"
        elif norm_name and norm_name not in ['customer', 'amazonbuyer', 'buyer', 'unknown']:
            cid = f"FPR_{norm_name}_{norm_zip}_{norm_city}"
        else:
            cid = f"LOC_{norm_zip}_{norm_city}" if norm_zip else f"CITY_{norm_city}_{state.lower()}"
        
        if cid not in customers:
            customers[cid] = {
                "customer_id": buyerName or (f"{city} ({zip_code})" if zip_code else city),
                "city": city,
                "state": state,
                "postal_code": zip_code,
                "gstin": gstin or 'N/A',
                "order_count": 0,
                "refund_count": 0,
                "refund_quantity": 0,
                "total_order_value": 0,
                "total_refund_amount": 0,
                "skus": set(),
                "sku_breakdown_map": {},
                "transactions": [],
                "first_refund": None,
                "last_refund": None
            }
            
        c = customers[cid]
        
        qty = abs(safe_float(r.get("Quantity"))) or 1.0
        amt = abs(safe_float(r.get("Invoice Amount")))
            
        if t_type == "shipment":
            c["order_count"] += 1
            c["total_order_value"] += amt
        else:
            c["refund_count"] += 1
            c["refund_quantity"] += qty
            c["total_refund_amount"] += amt
            c["skus"].add(r.get("Sku"))
            
            # Track refund dates
            r_date = r.get("Invoice Date")
            if r_date:
                if not c["first_refund"] or r_date < c["first_refund"]: c["first_refund"] = r_date
                if not c["last_refund"] or r_date > c["last_refund"]: c["last_refund"] = r_date

            sku = r.get("Sku") or "Unknown"
            if sku not in c["sku_breakdown_map"]:
                c["sku_breakdown_map"][sku] = {"Sku": sku, "quantity": 0, "count": 0, "amount": 0}
            c["sku_breakdown_map"][sku]["quantity"] += qty
            c["sku_breakdown_map"][sku]["count"] += 1
            c["sku_breakdown_map"][sku]["amount"] += amt
            c["transactions"].append(r)

    allRiskEntities = []
    
    for c in customers.values():
        if c["refund_count"] > 0:
            # Weighted Scoring Engine (40/30/30)
            
            # 1. Frequency Score (40%)
            total_activity = c["order_count"] + c["refund_count"]
            frequency = (c["refund_count"] / total_activity) if total_activity > 0 else 0
            frequency_score = min(100, frequency * 100)
            
            # 2. Volume Score (30%)
            volume_score = min(100, (c["refund_count"] / 5) * 100)
            
            # 3. Value Score (30%)
            value_score = min(100, (c["total_refund_amount"] / 10000) * 100)
            
            risk_score = round(
                (frequency_score * 0.40) + 
                (volume_score * 0.30) + 
                (value_score * 0.30)
            )
            
            # Strict Risk Levels
            if risk_score > 80: risk_label = 'CRITICAL'
            elif risk_score > 60: risk_label = 'HIGH'
            elif risk_score > 40: risk_label = 'MEDIUM'
            else: risk_label = 'LOW'
            
            ent = {**c}
            ent["risk_score"] = risk_score
            ent["risk_label"] = risk_label
            ent["skus"] = list(c["skus"])
            ent["sku_breakdown"] = list(c["sku_breakdown_map"].values())
            del ent["sku_breakdown_map"]
            
            for t in ent["transactions"]:
                if "_isoDate" in t: del t["_isoDate"]
                    
            allRiskEntities.append(ent)

    # Top List Selection Strategy
    allSorted = sorted(allRiskEntities, key=lambda x: x["risk_score"], reverse=True)
    top10 = allSorted[:10]
    topRisk = list(top10)
    top10_ids = {u["customer_id"] for u in top10}
    
    for ent in allSorted[10:]:
        if ent["risk_label"] == 'CRITICAL' and ent["customer_id"] not in top10_ids:
            topRisk.append(ent)
            
    for i, ent in enumerate(topRisk):
        ent["rank"] = i + 1

    # Summaries for output
    allRiskSummaries = []
    for i, ent in enumerate(allSorted):
        allRiskSummaries.append({
            "rank": i + 1,
            "customer_id": ent["customer_id"],
            "city": ent["city"],
            "state": ent["state"],
            "gstin": ent.get("gstin", "N/A"),
            "refund_count": ent["refund_count"],
            "refund_quantity": ent["refund_quantity"],
            "order_count": ent["order_count"],
            "total_refund_amount": ent["total_refund_amount"],
            "risk_score": ent["risk_score"],
            "risk_label": ent["risk_label"],
            "skus": ent.get("skus", []),
        })

    totalRefundValue = sum(c["total_refund_amount"] for c in customers.values())
    
    return {
        "topRisk": topRisk, 
        "allRiskSummaries": allRiskSummaries,
        "allReturnTransactions": returns,
        "moneyAtRisk": totalRefundValue,
        "totalAlerts": len(allRiskEntities),
        "totalRefundTransactions": len(returns)
    }
