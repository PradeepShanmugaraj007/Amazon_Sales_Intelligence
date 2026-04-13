def generate_fraud_alerts(returns):
    customers = {}
    for r in returns:
        city = r.get("Ship To City") or r.get("Bill To City") or r.get("City") or "Unknown"
        state = r.get("Ship To State") or r.get("Bill To State") or r.get("State") or "Unknown"
        zip_code = r.get("Ship To Zip") or r.get("Bill To Zip") or r.get("Postal Code") or r.get("Pincode") or ""
        buyerName = r.get("Buyer Name") or r.get("Recipient Name") or r.get("Customer Name") or ""
        gstin = r.get("Gstin") or ""
        
        cid = f"{buyerName}__{gstin}" if buyerName else (f"ZIP:{zip_code}__{state}" if zip_code else f"{city}__{state}")
        
        if cid not in customers:
            customers[cid] = {
                "customer_id": buyerName or (f"{city} ({zip_code})" if zip_code else city),
                "city": city,
                "state": state,
                "postal_code": zip_code,
                "gstin": gstin or 'N/A',
                "refund_quantity": 0,
                "refund_count": 0,
                "total_refund_amount": 0,
                "first_refund": r.get("Invoice Date"),
                "last_refund": r.get("Invoice Date"),
                "skus": set(),
                "sku_breakdown_map": {},
                "transactions": []
            }
            
        c = customers[cid]
        rawQty = r.get("Quantity")
        if rawQty is None or rawQty == "":
            qty = 1
        else:
            try:
                qty = abs(float(rawQty)) or 1
            except:
                qty = 1
                
        try:
            amt = abs(float(r.get("Invoice Amount") or 0))
        except:
            amt = 0
            
        c["refund_quantity"] += qty
        c["refund_count"] += 1
        c["total_refund_amount"] += amt
        c["skus"].add(r.get("Sku"))
        
        inv_date = r.get("Invoice Date")
        if inv_date:
            if c["first_refund"] is None or inv_date < c["first_refund"]: c["first_refund"] = inv_date
            if c["last_refund"] is None or inv_date > c["last_refund"]: c["last_refund"] = inv_date
            
        sku = r.get("Sku") or "Unknown"
        if sku not in c["sku_breakdown_map"]:
            c["sku_breakdown_map"][sku] = {"Sku": sku, "Hsn/sac": r.get('Hsn/sac') or r.get('HSN') or '-', "quantity": 0, "count": 0, "amount": 0}
        c["sku_breakdown_map"][sku]["quantity"] += qty
        c["sku_breakdown_map"][sku]["count"] += 1
        c["sku_breakdown_map"][sku]["amount"] += amt
        
        c["transactions"].append(r)
        
    allRiskEntities = []
    for c in customers.values():
        if c["refund_quantity"] >= 3 or c["refund_count"] >= 3:
            volumeScore = min(100, (c["refund_quantity"] / 10) * 100)
            frequencyScore = min(100, (c["refund_count"] / 5) * 100)
            
            baseScore = round(volumeScore * 0.6 + frequencyScore * 0.4)
            
            max_sku_qty = max(list(d["quantity"] for d in c["sku_breakdown_map"].values())) if c["sku_breakdown_map"] else 0
            
            internal_sort = baseScore
            if c["refund_quantity"] >= 3 or max_sku_qty >= 3:
                baseScore = 100
                internal_sort = 2000 + c["refund_quantity"] * 10
            elif c["refund_count"] >= 3:
                baseScore = max(65, baseScore)
                internal_sort = max(internal_sort, baseScore)
                
            risk_label = 'CRITICAL' if baseScore >= 80 else 'HIGH' if baseScore >= 60 else 'MEDIUM'
            
            ent = {**c}
            ent["risk_score"] = baseScore
            ent["sort_score"] = internal_sort
            ent["risk_label"] = risk_label
            ent["skus"] = list(c["skus"])
            ent["sku_breakdown"] = list(c["sku_breakdown_map"].values())
            del ent["sku_breakdown_map"]
            
            for t in ent["transactions"]:
                if "_isoDate" in t:
                    del t["_isoDate"]
                    
            allRiskEntities.append(ent)
            
    topRisk = sorted(allRiskEntities, key=lambda x: x["sort_score"], reverse=True)[:10]
    for i, c in enumerate(topRisk):
        c["rank"] = i + 1
        
    totalRefundQty = sum(float(r.get("Quantity") or 0) for r in returns)
    totalRefundValue = sum(abs(float(r.get("Invoice Amount") or 0)) for r in returns)
    totalRefundTransactions = len(returns)
    
    return {
        "topRisk": topRisk, 
        "moneyAtRisk": totalRefundValue,
        "totalRefundQty": totalRefundQty,
        "totalAlerts": len(allRiskEntities),
        "totalRefundTransactions": totalRefundTransactions
    }
