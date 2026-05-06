from datetime import datetime

# ── Helpers ──────────────────────────────────────────────────────────────────
def _fmt(amount):
    if amount >= 10_00_000:
        return f"₹{amount / 10_00_000:.1f}L"
    if amount >= 1_000:
        return f"₹{amount / 1_000:.1f}K"
    return f"₹{amount:.0f}"


def _pct(a, b):
    """Safe percentage change from b → a."""
    if not b:
        return 0.0
    return ((a - b) / b) * 100


def generate_business_insights(results: dict) -> list:
    """
    Derives 30+ natural-language intelligence insights from processed analytics.

    Each insight is a dict:
        {
            "text":     str,          # human-readable sentence
            "category": str,          # revenue | returns | fraud | logistics | tax | growth | sku | geo
            "severity": str,          # positive | warning | critical | neutral
            "icon":     str,          # emoji
            "metric":   str | None    # short headline value shown in badge
        }
    """
    insights = []
    total_rev   = float(results.get("totalRevenue", 0) or 0)
    total_orders= int(results.get("totalOrders", 0) or 0)
    return_rate = float(results.get("returnRate", 0) or 0)
    return_count= int(results.get("returnCount", 0) or 0)
    avg_order   = float(results.get("avgOrderValue", 0) or 0)
    total_disc  = float(results.get("totalDiscount", 0) or 0)
    skus        = results.get("skuList", []) or []
    daily       = results.get("dailySales", []) or []
    weekly      = results.get("weeklySales", []) or []
    monthly     = results.get("monthlySales", []) or []
    state_list  = results.get("stateList", []) or []
    channel     = results.get("channelData", []) or []
    tax         = results.get("tax", {}) or {}
    fraud       = results.get("fraud", {}) or {}
    forecast    = results.get("forecast", {}) or {}

    # ── 1. REVENUE TREND (week-over-week) ────────────────────────────────────
    if len(weekly) >= 2:
        curr_w, prev_w = weekly[-1], weekly[-2]
        rev_chg = _pct(curr_w["revenue"], prev_w["revenue"])
        if rev_chg >= 20:
            insights.append({"text": f"Revenue surged {rev_chg:.0f}% this week vs last week — strong momentum detected.", "category": "growth", "severity": "positive", "icon": "🚀", "metric": f"+{rev_chg:.0f}%"})
        elif rev_chg >= 5:
            insights.append({"text": f"Weekly revenue grew by {rev_chg:.1f}%, showing steady upward movement.", "category": "revenue", "severity": "positive", "icon": "📈", "metric": f"+{rev_chg:.1f}%"})
        elif rev_chg <= -20:
            insights.append({"text": f"Revenue dropped {abs(rev_chg):.0f}% this week — investigate possible stockouts or demand dip.", "category": "revenue", "severity": "critical", "icon": "🔻", "metric": f"{rev_chg:.0f}%"})
        elif rev_chg <= -5:
            insights.append({"text": f"Weekly revenue softened by {abs(rev_chg):.1f}% compared to last week.", "category": "revenue", "severity": "warning", "icon": "📉", "metric": f"{rev_chg:.1f}%"})

        # Order velocity
        ord_chg = _pct(curr_w["orders"], prev_w["orders"])
        if abs(ord_chg) >= 15:
            direction = "accelerated" if ord_chg > 0 else "declined"
            insights.append({"text": f"Order volume {direction} {abs(ord_chg):.0f}% week-over-week.", "category": "revenue", "severity": "positive" if ord_chg > 0 else "warning", "icon": "📦", "metric": f"{'+'if ord_chg>0 else ''}{ord_chg:.0f}%"})

    # ── 2. MONTHLY TREND ─────────────────────────────────────────────────────
    if len(monthly) >= 2:
        curr_m, prev_m = monthly[-1], monthly[-2]
        m_chg = _pct(curr_m["revenue"], prev_m["revenue"])
        if m_chg >= 10:
            insights.append({"text": f"Month-over-month revenue is up {m_chg:.1f}% — growth trajectory intact.", "category": "growth", "severity": "positive", "icon": "📅", "metric": f"+{m_chg:.1f}%"})
        elif m_chg <= -10:
            insights.append({"text": f"Revenue declined {abs(m_chg):.1f}% month-over-month — consider running promotions.", "category": "revenue", "severity": "warning", "icon": "⚠️", "metric": f"{m_chg:.1f}%"})

    # ── 3. RETURNS ───────────────────────────────────────────────────────────
    if return_rate > 20:
        insights.append({"text": f"Critical: {return_rate:.1f}% return rate is over 2× the industry benchmark of 8%. Immediate product review recommended.", "category": "returns", "severity": "critical", "icon": "🚨", "metric": f"{return_rate:.1f}%"})
    elif return_rate > 10:
        insights.append({"text": f"Return rate of {return_rate:.1f}% is above the healthy 8% threshold — monitor top-returning SKUs.", "category": "returns", "severity": "warning", "icon": "↩️", "metric": f"{return_rate:.1f}%"})
    elif return_rate <= 3 and total_orders > 10:
        insights.append({"text": f"Exceptional return rate of {return_rate:.1f}% — well below industry average. Great product-market fit.", "category": "returns", "severity": "positive", "icon": "✅", "metric": f"{return_rate:.1f}%"})

    # Returns week-over-week (using weekly order units as proxy)
    if len(weekly) >= 2 and return_count > 0:
        curr_w, prev_w = weekly[-1], weekly[-2]
        prev_units = prev_w.get("units", 0)
        curr_units = curr_w.get("units", 0)
        ret_chg = _pct(curr_units, prev_units) if prev_units > 0 else 0
        if ret_chg > 10 and return_rate > 8:
            insights.append({"text": f"Returns trend correlates with {ret_chg:.0f}% spike in unit volume this week — watch closely.", "category": "returns", "severity": "warning", "icon": "🔁", "metric": f"+{ret_chg:.0f}% units"})

    # ── 4. SKU CONCENTRATION ─────────────────────────────────────────────────
    if skus and total_rev > 0:
        top_sku = skus[0]
        share = (top_sku["revenue"] / total_rev) * 100
        sku_label = (top_sku["sku"][:14] + "…") if len(top_sku["sku"]) > 15 else top_sku["sku"]

        if share > 50:
            insights.append({"text": f"Concentration risk: SKU '{sku_label}' alone drives {share:.0f}% of total revenue. Diversify your portfolio.", "category": "sku", "severity": "critical", "icon": "⚠️", "metric": f"{share:.0f}% revenue"})
        elif share > 30:
            insights.append({"text": f"Top SKU '{sku_label}' contributes {share:.0f}% of revenue — strong performer but portfolio diversification advised.", "category": "sku", "severity": "warning", "icon": "🏆", "metric": f"{share:.0f}% revenue"})
        elif share > 20:
            insights.append({"text": f"Leading SKU '{sku_label}' generates {share:.0f}% of total sales.", "category": "sku", "severity": "positive", "icon": "🥇", "metric": f"{share:.0f}%"})

        # Bottom performer
        if len(skus) > 3:
            bottom = skus[-1]
            b_share = (bottom["revenue"] / total_rev) * 100
            b_label = (bottom["sku"][:14] + "…") if len(bottom["sku"]) > 15 else bottom["sku"]
            if b_share < 0.5 and bottom["orders"] > 2:
                insights.append({"text": f"SKU '{b_label}' accounts for only {b_share:.1f}% of revenue despite {bottom['orders']} orders — consider pricing review.", "category": "sku", "severity": "neutral", "icon": "📊", "metric": f"{b_share:.1f}%"})

        # Top-3 SKU concentration
        top3_rev = sum(s["revenue"] for s in skus[:3])
        top3_pct = (top3_rev / total_rev * 100) if total_rev else 0
        if len(skus) > 5 and top3_pct > 70:
            insights.append({"text": f"Top 3 SKUs account for {top3_pct:.0f}% of all revenue — a concentrated product dependency.", "category": "sku", "severity": "warning", "icon": "📦", "metric": f"Top-3 = {top3_pct:.0f}%"})

    # ── 5. GEO / STATE PERFORMANCE ───────────────────────────────────────────
    if state_list and total_rev > 0:
        top_state = state_list[0]
        geo_share = (top_state["revenue"] / total_rev) * 100
        if geo_share > 40:
            insights.append({"text": f"{top_state['state']} dominates with {geo_share:.0f}% of revenue — geographic concentration risk.", "category": "geo", "severity": "warning", "icon": "🗺️", "metric": f"{geo_share:.0f}%"})
        elif geo_share > 25:
            insights.append({"text": f"Top market: {top_state['state']} generates {geo_share:.0f}% of total revenue.", "category": "geo", "severity": "positive", "icon": "📍", "metric": top_state["state"]})

        # Untapped potential
        if len(state_list) > 5:
            bottom_states = [s for s in state_list[-3:] if s.get("revenue", 0) > 0]
            if bottom_states:
                names = ", ".join(s["state"] for s in bottom_states[:2])
                insights.append({"text": f"Low penetration in {names} — potential expansion markets worth activating.", "category": "geo", "severity": "neutral", "icon": "🌏", "metric": "Expand"})

    # ── 6. FRAUD / RISK HOTSPOTS ─────────────────────────────────────────────
    total_alerts    = int(fraud.get("totalAlerts", 0) or 0)
    money_at_risk   = float(fraud.get("moneyAtRisk", 0) or 0)
    all_risk        = fraud.get("allRiskSummaries", []) or []

    if money_at_risk > 0:
        if money_at_risk >= 50_000:
            insights.append({"text": f"High fraud exposure: {_fmt(money_at_risk)} worth of refunds from high-risk customers. Immediate review required.", "category": "fraud", "severity": "critical", "icon": "🚨", "metric": _fmt(money_at_risk)})
        elif money_at_risk >= 10_000:
            insights.append({"text": f"Moderate fraud risk: {_fmt(money_at_risk)} at risk from {total_alerts} flagged accounts.", "category": "fraud", "severity": "warning", "icon": "🛡️", "metric": _fmt(money_at_risk)})

    # State-level fraud concentration
    if all_risk:
        state_risk_count = {}
        state_risk_value = {}
        for r in all_risk:
            st = r.get("state") or "Unknown"
            if st == "Unknown":
                continue
            state_risk_count[st] = state_risk_count.get(st, 0) + 1
            state_risk_value[st] = state_risk_value.get(st, 0) + float(r.get("total_refund_amount", 0) or 0)

        if state_risk_count:
            hotspot_state = max(state_risk_count, key=state_risk_count.get)
            hs_count = state_risk_count[hotspot_state]
            hs_value = state_risk_value.get(hotspot_state, 0)
            if hs_count >= 2:
                insights.append({"text": f"Fraud hotspot: {hotspot_state} has {hs_count} high-risk customers with {_fmt(hs_value)} in refund exposure.", "category": "fraud", "severity": "critical" if hs_count >= 5 else "warning", "icon": "⚡", "metric": hotspot_state})

    # Critical-level accounts
    critical_accounts = [r for r in all_risk if r.get("risk_label") == "CRITICAL"]
    if critical_accounts:
        insights.append({"text": f"{len(critical_accounts)} customer account{'s' if len(critical_accounts) > 1 else ''} classified as CRITICAL risk — blacklist review recommended.", "category": "fraud", "severity": "critical", "icon": "🔴", "metric": f"{len(critical_accounts)} critical"})

    # ── 7. FULFILLMENT CHANNEL ───────────────────────────────────────────────
    fba = next((c["value"] for c in channel if c["name"] == "FBA"), 0)
    mfn = next((c["value"] for c in channel if c["name"] == "MFN"), 0)
    total_ch = fba + mfn
    if total_ch > 0:
        fba_pct = fba / total_ch * 100
        if fba_pct >= 80:
            insights.append({"text": f"{fba_pct:.0f}% of orders fulfilled via FBA — Prime eligibility maximised.", "category": "logistics", "severity": "positive", "icon": "✅", "metric": f"FBA {fba_pct:.0f}%"})
        elif fba_pct >= 50:
            insights.append({"text": f"FBA covers {fba_pct:.0f}% of fulfillment — shifting remaining MFN orders to FBA could boost Buy Box win rate.", "category": "logistics", "severity": "neutral", "icon": "🔄", "metric": f"FBA {fba_pct:.0f}%"})
        elif fba_pct < 30 and total_ch > 20:
            insights.append({"text": f"Only {fba_pct:.0f}% FBA. Heavy MFN reliance risks losing Prime customers and Buy Box ranking.", "category": "logistics", "severity": "warning", "icon": "⚠️", "metric": f"FBA {fba_pct:.0f}%"})

    # ── 8. TAX EXPOSURE ──────────────────────────────────────────────────────
    igst = float(tax.get("igst", 0) or 0)
    cgst = float(tax.get("cgst", 0) or 0)
    sgst = float(tax.get("sgst", 0) or 0)
    total_tax = igst + cgst + sgst
    if total_tax > 0 and total_rev > 0:
        tax_burden = (total_tax / total_rev) * 100
        if igst > (cgst + sgst) * 2:
            insights.append({"text": f"IGST ({_fmt(igst)}) dominates tax outflow — most sales are inter-state. Ensure GSTIN compliance on B2B invoices.", "category": "tax", "severity": "neutral", "icon": "🧾", "metric": _fmt(igst)})
        if tax_burden > 18:
            insights.append({"text": f"Tax burden is {tax_burden:.1f}% of revenue ({_fmt(total_tax)}) — higher than expected. Audit HSN codes.", "category": "tax", "severity": "warning", "icon": "💸", "metric": f"{tax_burden:.1f}%"})

    # ── 9. AOV & DISCOUNT ────────────────────────────────────────────────────
    if avg_order > 0:
        if avg_order > 5000:
            insights.append({"text": f"High AOV of {_fmt(avg_order)} indicates a premium product mix — protect pricing to maintain margin.", "category": "revenue", "severity": "positive", "icon": "💎", "metric": _fmt(avg_order)})
        elif avg_order < 300 and total_orders > 50:
            insights.append({"text": f"Low AOV of {_fmt(avg_order)} — consider bundling strategies to increase basket size.", "category": "revenue", "severity": "neutral", "icon": "🛒", "metric": _fmt(avg_order)})

    if total_disc > 0 and total_rev > 0:
        disc_pct = (total_disc / total_rev) * 100
        if disc_pct > 15:
            insights.append({"text": f"Promotions are absorbing {disc_pct:.1f}% of gross revenue ({_fmt(total_disc)}) — evaluate ROI of current discount strategy.", "category": "revenue", "severity": "warning", "icon": "🎟️", "metric": f"{disc_pct:.1f}% discounted"})

    # ── 10. VELOCITY & FORECAST ──────────────────────────────────────────────
    if forecast and "summary" in forecast:
        f30 = float(forecast["summary"].get("next_30_days", 0) or 0)
        if f30 > 0 and total_rev > 0:
            days_span = len(daily) or 1
            current_run_rate = total_rev / days_span * 30
            forecast_delta = _pct(f30, current_run_rate)
            if forecast_delta >= 15:
                insights.append({"text": f"AI forecast projects {_fmt(f30)} in the next 30 days — {forecast_delta:.0f}% above current run rate.", "category": "growth", "severity": "positive", "icon": "🔮", "metric": _fmt(f30)})
            elif forecast_delta <= -15:
                insights.append({"text": f"Forecast signals {abs(forecast_delta):.0f}% revenue deceleration next 30 days — investigate demand drivers.", "category": "growth", "severity": "warning", "icon": "📉", "metric": _fmt(f30)})

    # ── 11. DATA SCALE INSIGHTS ──────────────────────────────────────────────
    days_span = len(daily)
    if days_span > 0 and total_orders > 0:
        daily_rate = total_orders / days_span
        if daily_rate >= 100:
            insights.append({"text": f"High-velocity store: averaging {daily_rate:.0f} orders/day across {days_span} days of data.", "category": "revenue", "severity": "positive", "icon": "⚡", "metric": f"{daily_rate:.0f}/day"})
        elif daily_rate < 2 and days_span > 30:
            insights.append({"text": f"Low order velocity ({daily_rate:.1f}/day over {days_span} days) — marketing activation may help.", "category": "growth", "severity": "neutral", "icon": "📣", "metric": f"{daily_rate:.1f}/day"})

    # ── 12. MERGE STATS ──────────────────────────────────────────────────────
    merge = results.get("merge_stats")
    if merge and merge.get("files_count", 1) > 1:
        dup = merge["duplicates_removed"]
        final = merge["final_rows"]
        if dup > 0:
            insights.append({"text": f"Multi-file merge: {dup} duplicate rows removed across {merge['files_count']} files. Analysis based on {final:,} clean records.", "category": "neutral", "severity": "neutral", "icon": "🔗", "metric": f"{dup} deduped"})

    # ── Fallback ──────────────────────────────────────────────────────────────
    if not insights:
        insights.append({
            "text": "Stable operations detected — no significant anomalies in revenue, returns, or risk patterns this period.",
            "category": "revenue",
            "severity": "positive",
            "icon": "✅",
            "metric": "All Clear"
        })

    # Sort: critical first, then warning, then positive, then neutral
    order = {"critical": 0, "warning": 1, "positive": 2, "neutral": 3}
    insights.sort(key=lambda x: order.get(x.get("severity", "neutral"), 3))

    return insights
