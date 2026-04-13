def calculate_forecasts(dailySales):
    lastN = dailySales[-30:]
    avgDaily = sum(d["revenue"] for d in lastN) / len(lastN) if lastN else 0
    trend = 0
    if len(lastN) > 7:
        trend = (sum(d["revenue"] for d in lastN[-7:]) / 7) - (sum(d["revenue"] for d in lastN[:7]) / 7)
        
    forecast7 = max(0, (avgDaily + trend * 0.5) * 7)
    forecast30 = max(0, (avgDaily + trend * 1.2) * 30)
    forecast90 = max(0, (avgDaily + trend * 1.5) * 90)
    return forecast7, forecast30, forecast90
