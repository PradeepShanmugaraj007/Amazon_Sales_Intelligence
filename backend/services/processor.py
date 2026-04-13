import csv
import io
import math
import pandas as pd
from datetime import datetime
from utils.helpers import is_float
from services.forecast import calculate_forecasts
from services.fraud_engine import generate_fraud_alerts

def parse_uploaded_data(content: str):
    f = io.StringIO(content.strip())
    reader = csv.reader(f)
    try:
        headers_raw = next(reader)
    except StopIteration:
        return []
    
    headers = [h.strip() for h in headers_raw]
    
    parsed_rows = []
    for row in reader:
        # pad row to match headers if needed
        while len(row) < len(headers):
            row.append("")
        
        obj = {}
        for h, val in zip(headers, row):
            val = val.strip()
            mapped_key = h
            lower_h = h.lower().replace("-", "").replace("_", "").replace(" ", "")
            
            if lower_h in ['city','shipcity','shiptocity','shippingcity','billcity','billtocity']: mapped_key = 'Ship To City'
            if lower_h in ['state','shipstate','shiptostate','shippingstate','billstate','billtostate','region']: mapped_key = 'Ship To State'
            if lower_h in ['postalcode','zip','zipcode','shipzip','shiptopincode','shippostalcode','pincode','billpostalcode','billtopincode']: mapped_key = 'Ship To Zip'
            if lower_h in ['orderid','ordernumber','amazonorderid','orderno','id']: mapped_key = 'Order Id'
            if lower_h in ['sku','itemsku','sellersku','asin','fnsku','productid','itemid']: mapped_key = 'Sku'
            if lower_h in ['quantity','qty','quantityshipped','unitsshipped','units','count']: mapped_key = 'Quantity'
            if lower_h in ['transactiontype','type','settlementaction','action','status']: mapped_key = 'Transaction Type'
            if lower_h in ['itemprice','amount','principal','invoiceamount','totalprice','itemtotal','taxablevalue','totalvalue','price','revenue','total','value','cost']: mapped_key = 'Invoice Amount'
            if lower_h in ['invoicedate','date','posteddate','orderdate','settlementdate','createdat','timestamp','time']: mapped_key = 'Invoice Date'
            if lower_h in ['buyername','recipientname','customername','shiptoname','billtoname','customer','client']: mapped_key = 'Buyer Name'
            if lower_h in ['gstin','gstinnumber','buyergstin','taxid']: mapped_key = 'Gstin'
            if lower_h in ['returnreason','reason','defecttype','defect']: mapped_key = 'Return Reason'
            
            if not val:
                obj[mapped_key] = None
            elif is_float(val) and lower_h not in ['orderid','ordernumber','amazonorderid','shipzip','postalcode','zipcode','pincode']:
                obj[mapped_key] = float(val)
            else:
                obj[mapped_key] = val
        
        iso_date = None
        if obj.get("Invoice Date"):
            date_str = str(obj["Invoice Date"])
            parts = date_str.replace('/', '-').split('-')
            try:
                if len(parts) == 3:
                    if len(parts[0]) == 4:
                        iso_date = datetime(int(parts[0]), int(parts[1]), int(parts[2]))
                    else:
                        iso_date = datetime(int(parts[2]), int(parts[1]), int(parts[0]))
                else:
                    iso_date = datetime.strptime(date_str, "%Y-%m-%d")
            except:
                pass
        obj["_isoDate"] = iso_date
        parsed_rows.append(obj)
    return parsed_rows

def process_data(rows):
    shipments = []
    returns = []
    for r in rows:
        ttype = str(r.get("Transaction Type", "") or "").lower()
        desc = str(r.get("Item Description", "") or "").lower()
        
        if ttype == "shipment" or ttype == "sale" or "order" in ttype:
            shipments.append(r)
            
        if "return" in ttype or "refund" in ttype or "adjustment" in ttype or "refund" in desc or "returned" in desc:
            returns.append(r)
            
    byDate = {}
    for r in shipments:
        d = r.get("Invoice Date")
        if not d: continue
        if d not in byDate:
            byDate[d] = {"date": d, "revenue": 0, "orders": 0, "units": 0}
        byDate[d]["revenue"] += r.get("Invoice Amount") or 0
        byDate[d]["orders"] += 1
        byDate[d]["units"] += r.get("Quantity") or 0
        
    dailySales = sorted(list(byDate.values()), key=lambda x: x["date"])
    
    byWeek = {}
    for d in dailySales:
        try:
            parts = d["date"].replace('/', '-').split('-')
            if len(parts[0]) == 4:
                dt = datetime(int(parts[0]), int(parts[1]), int(parts[2]))
            else:
                dt = datetime(int(parts[2]), int(parts[1]), int(parts[0]))
            month_str = dt.strftime("%b")
            week = f"W{math.ceil(dt.day / 7)}-{month_str}"
        except:
            week = "W-Unknown"
        if week not in byWeek:
            byWeek[week] = {"week": week, "revenue": 0, "orders": 0, "units": 0}
        byWeek[week]["revenue"] += d["revenue"]
        byWeek[week]["orders"] += d["orders"]
        byWeek[week]["units"] += d["units"]
        
    weeklySales = list(byWeek.values())[-12:]
    
    byMonth = {}
    for d in dailySales:
        try:
            parts = d["date"].replace('/', '-').split('-')
            if len(parts[0]) == 4:
                dt = datetime(int(parts[0]), int(parts[1]), int(parts[2]))
            else:
                dt = datetime(int(parts[2]), int(parts[1]), int(parts[0]))
            month = dt.strftime("%b '%y")
        except:
            month = "Unknown"
        if month not in byMonth:
            byMonth[month] = {"month": month, "revenue": 0, "orders": 0, "units": 0}
        byMonth[month]["revenue"] += d["revenue"]
        byMonth[month]["orders"] += d["orders"]
        byMonth[month]["units"] += d["units"]
        
    monthlySales = list(byMonth.values())
    
    bySku = {}
    for r in shipments:
        sku = r.get("Sku") or "UNKNOWN"
        if sku not in bySku:
            bySku[sku] = {"sku": sku, "desc": r.get("Item Description") or sku, "revenue": 0, "units": 0, "orders": 0, "principal": 0}
        bySku[sku]["revenue"] += r.get("Invoice Amount") or 0
        bySku[sku]["units"] += r.get("Quantity") or 0
        bySku[sku]["orders"] += 1
        bySku[sku]["principal"] += r.get("Principal Amount") or 0
        
    skuList = sorted(list(bySku.values()), key=lambda x: x["revenue"], reverse=True)
    
    byState = {}
    for r in shipments:
        st = r.get("Ship To State") or "Unknown"
        if st not in byState:
            byState[st] = {"state": st, "revenue": 0, "orders": 0, "units": 0, "igst": 0}
        byState[st]["revenue"] += r.get("Invoice Amount") or 0
        byState[st]["orders"] += 1
        byState[st]["units"] += r.get("Quantity") or 0
        byState[st]["igst"] += r.get("Igst Tax") or 0
        
    stateList = sorted(list(byState.values()), key=lambda x: x["revenue"], reverse=True)
    
    tax = {
        "cgst": sum((r.get("Cgst Tax") or 0) for r in shipments),
        "sgst": sum((r.get("Sgst Tax") or 0) for r in shipments),
        "igst": sum((r.get("Igst Tax") or 0) for r in shipments),
    }
    tax["total"] = tax["cgst"] + tax["sgst"] + tax["igst"]
    taxPie = [{"name": "IGST", "value": tax["igst"]}, {"name": "CGST", "value": tax["cgst"]}, {"name": "SGST", "value": tax["sgst"]}]
    taxPie = [t for t in taxPie if t["value"] > 0]
    
    totalRevenue = sum((r.get("Invoice Amount") or 0) for r in shipments)
    totalOrders = len(shipments)
    totalDiscount = abs(sum((r.get("Item Promo Discount") or 0) for r in shipments))
    returnCount = len(returns)
    returnRate = f"{(returnCount / totalOrders * 100):.1f}" if totalOrders else "0"
    avgOrderValue = totalRevenue / totalOrders if totalOrders else 0
    fba = len([r for r in shipments if r.get("Fulfillment Channel") == "FBA"])
    mfn = len([r for r in shipments if r.get("Fulfillment Channel") == "MFN"])
    channelData = [{"name": "FBA", "value": fba}, {"name": "MFN", "value": mfn}]
    
    forecast7, forecast30, forecast90 = calculate_forecasts(dailySales)
    
    days = len(dailySales) or 1
    skuVelocity = [{**s, "dailyVelocity": s["units"] / days} for s in skuList]
    
    fraud_alerts = generate_fraud_alerts(returns)
            
    for r in rows:
        if "_isoDate" in r:
            del r["_isoDate"] 
            
    return {
        "rawData": rows,
        "analysis": {
            "totalRevenue": totalRevenue, "totalOrders": totalOrders, "totalDiscount": totalDiscount, 
            "returnCount": returnCount, "returnRate": returnRate, "avgOrderValue": avgOrderValue, 
            "dailySales": dailySales, "weeklySales": weeklySales, "monthlySales": monthlySales, 
            "skuList": skuList, "stateList": stateList, "tax": tax, "taxPie": taxPie,
            "forecast7": forecast7, "forecast30": forecast30, "forecast90": forecast90, 
            "skuVelocity": skuVelocity, "channelData": channelData, "days": days,
            "fraud": fraud_alerts
        }
    }

def process_dataframe_data(df):
    # To keep exact backward compatibility with the React dashboard without replacing existing logic,
    # we remap the cleaned dataframe back to the expected legacy dictionary keys, then pass to process_data.
    
    # Format date as 'YYYY-MM-DD' for process_data to parse correctly
    df['date_str'] = df['date'].dt.strftime('%Y-%m-%d')
    
    # Reverse map for process_data compatibility
    legacy_df = df.rename(columns={
        "order_id": "Order Id",
        "date_str": "Invoice Date", # Use formatted string date
        "sku": "Sku",
        "quantity": "Quantity",
        "revenue": "Invoice Amount",
        "state": "Ship To State",
        "transaction_type": "Transaction Type",
        "fulfillment": "Fulfillment Channel"
    })
    
    # Drop the internal is_return or date objects avoiding JSON issues
    if 'date' in legacy_df.columns: legacy_df = legacy_df.drop('date', axis=1)
    if 'is_return' in legacy_df.columns: legacy_df = legacy_df.drop('is_return', axis=1)
    
    records = legacy_df.to_dict('records')
    
    # Fix dict items
    for r in records:
        for k, v in r.items():
            if pd.isna(v):
                r[k] = None
        
        # Inject standard required keys if missing to prevent KeyError in fraud engine
        if "Buyer Name" not in r: r["Buyer Name"] = ""
        if "Gstin" not in r: r["Gstin"] = ""
        if "Ship To City" not in r: r["Ship To City"] = ""
        if "Ship To Zip" not in r: r["Ship To Zip"] = ""
        
    return process_data(records)
