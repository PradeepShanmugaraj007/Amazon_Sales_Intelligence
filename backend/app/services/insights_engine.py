import pandas as pd

def generate_business_insights(results):
    """
    Derives actionable natural language insights from processed analytics.
    Args:
        results (dict): The dictionary returned by process_data in main.py
    Returns:
        list: A list of strings containing business intelligence insights.
    """
    insights = []
    
    # 1. Revenue & Return Performance (Weekly Trends)
    weekly = results.get("weeklySales", [])
    if len(weekly) >= 2:
        curr = weekly[-1]
        prev = weekly[-2]
        
        # Revenue Momentum
        rev_change = ((curr["revenue"] - prev["revenue"]) / prev["revenue"] * 100) if prev["revenue"] > 0 else 0
        if abs(rev_change) > 5:
            direction = "increased" if rev_change > 0 else "softened"
            insights.append(f"Weekly revenue {direction} by {abs(rev_change):.1f}% compared to last week.")
        
        # Order Momentum
        ord_change = ((curr["orders"] - prev["orders"]) / prev["orders"] * 100) if prev["orders"] > 0 else 0
        if abs(ord_change) > 10:
            direction = "up" if ord_change > 0 else "down"
            insights.append(f"Order volume is {direction} {abs(ord_change):.1f}% week-over-week.")

    # 2. SKU Concentration (Dominance)
    skus = results.get("skuList", [])
    total_rev = results.get("totalRevenue", 0)
    if skus and total_rev > 0:
        top_sku = skus[0]
        share = (top_sku["revenue"] / total_rev) * 100
        if share > 25:
            sku_name = top_sku["sku"]
            if len(sku_name) > 15: sku_name = sku_name[:12] + "..."
            insights.append(f"Major Revenue Driver: SKU '{sku_name}' generates {share:.1f}% of total sales.")

    # 3. Geographic Risk Hotspots (Fraud/Returns)
    fraud_data = results.get("fraud", {})
    all_risks = fraud_data.get("allRiskSummaries", [])
    if all_risks:
        state_risks = {}
        for r in all_risks:
            st = r.get("state")
            if not st or st == "Unknown": continue
            state_risks[st] = state_risks.get(st, 0) + 1
            
        if state_risks:
            hotspot = max(state_risks.items(), key=lambda x: x[1])
            if hotspot[1] >= 2:
                insights.append(f"Risk Hotspot: {hotspot[0]} shows a high concentration of refund-prone customers.")

    # 4. Fulfillment Channel Analysis
    channel_data = results.get("channelData", [])
    fba = next((c["value"] for c in channel_data if c["name"] == "FBA"), 0)
    mfn = next((c["value"] for c in channel_data if c["name"] == "MFN"), 0)
    total_ch = fba + mfn
    if total_ch > 0:
        fba_share = (fba / total_ch) * 100
        if fba_share > 70:
            insights.append("Prime Dominance: 70%+ of your orders are being fulfilled via FBA.")
        elif fba_share < 30 and total_ch > 50:
            insights.append("High Self-Fulfillment: Bulk of sales are MFN—consider FBA for Prime badges.")

    # 5. Profitability & Returns
    ret_rate = float(results.get("returnRate", 0))
    if ret_rate > 15:
        insights.append(f"Critical Return Alert: Current return rate ({ret_rate}%) is significantly above the 8% industry average.")
    elif ret_rate < 3:
        insights.append(f"Healthy Operations: Your return rate is exceptional at {ret_rate}%. Keep it up!")

    # Fallback if no specific trends found
    if not insights:
        insights.append("Market Stability: No significant shifts detected in revenue or order patterns this period.")

    return insights
