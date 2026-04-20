from datetime import datetime, timedelta

def calculate_forecasts(dailySales):
    """
    Maintains backward compatibility with main.py and other services.
    Returns: (forecast7, forecast30, forecast90)
    """
    res = generate_detailed_forecast(dailySales)
    summary = res["summary"]
    return summary["next_7_days"], summary["next_30_days"], summary["next_90_days"]

def generate_detailed_forecast(daily_sales):
    """
    Implements forecasting using a Simple Moving Average (SMA).
    Returns a dictionary structured for JSON response and charts.
    """
    if not daily_sales or len(daily_sales) == 0:
        return {
            "summary": {"next_7_days": 0, "next_30_days": 0, "next_90_days": 0},
            "chart_data": []
        }

    # Ensure data is sorted by date
    try:
        sorted_sales = sorted(daily_sales, key=lambda x: str(x["date"]))
    except Exception:
        sorted_sales = daily_sales

    revenues = [float(s.get("revenue", 0)) for s in sorted_sales]
    
    # Calculate 30-day baseline and trend momentum
    window = min(30, len(revenues))
    recent_revenue = revenues[-window:]
    avg_daily_revenue = sum(recent_revenue) / window if window > 0 else 0
    
    # Simple Momentum: Compare last 7 days vs previous 7-14 days
    if window >= 14:
        last_7_avg = sum(recent_revenue[-7:]) / 7
        prev_7_avg = sum(recent_revenue[-14:-7]) / 7
        # Limit daily growth factor to +/- 1% to keep projections realistic
        if prev_7_avg > 0:
            growth_factor = (last_7_avg - prev_7_avg) / prev_7_avg
            daily_increment = (avg_daily_revenue * growth_factor) / 30
            daily_increment = max(-avg_daily_revenue * 0.01, min(avg_daily_revenue * 0.01, daily_increment))
        else:
            daily_increment = 0
    else:
        daily_increment = 0
    
    # Determine reference date (last known sales date)
    last_date_str = str(sorted_sales[-1].get("date", datetime.now().strftime("%Y-%m-%d")))
    try:
        if '-' in last_date_str:
            parts = last_date_str.split('-')
            if len(parts[0]) == 4: # YYYY-MM-DD
                last_date = datetime(int(parts[0]), int(parts[1]), int(parts[2]))
            else: # DD-MM-YYYY
                last_date = datetime(int(parts[2]), int(parts[1]), int(parts[0]))
        else:
            last_date = datetime.strptime(last_date_str.split(' ')[0], "%Y/%m/%d")
    except Exception:
        last_date = datetime.now()

    chart_data = []
    for i in range(1, 91):
        future_date = (last_date + timedelta(days=i)).strftime("%Y-%m-%d")
        
        # Apply trend momentum: Forecast(t) = Baseline + (t * daily_increment)
        projected_daily = avg_daily_revenue + (i * daily_increment)
        
        # Stabilizer: Don't let revenue drop below 20% of baseline
        projected_daily = max(avg_daily_revenue * 0.2, projected_daily)
        
        chart_data.append({
            "date": future_date,
            "revenue": round(projected_daily, 2)
        })
    
    # Calculate Forecast Summaries
    forecast7 = round(sum(d["revenue"] for d in chart_data[:7]), 2)
    forecast30 = round(sum(d["revenue"] for d in chart_data[:30]), 2)
    forecast90 = round(sum(d["revenue"] for d in chart_data[:90]), 2)
    
    return {
        "summary": {
            "next_7_days": forecast7,
            "next_30_days": forecast30,
            "next_90_days": forecast90
        },
        "chart_data": chart_data
    }

