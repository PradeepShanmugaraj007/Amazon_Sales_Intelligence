from app.services.stateless_memory import stateless_service
from datetime import datetime

users = stateless_service.get_all_users()
now = datetime.utcnow()
for u in users:
    expiry_str = u.get("plan_expiry") or u.get("expiry_date")
    if expiry_str:
        try:
            try:
                expiry_dt = datetime.fromisoformat(expiry_str)
            except ValueError:
                expiry_dt = datetime.strptime(expiry_str, "%Y-%m-%d")
            delta = expiry_dt - now
            print(f"User: {u['email']}, Expiry: {expiry_dt}, Now: {now}, Delta: {delta.total_seconds()}")
            if 0 <= delta.total_seconds() <= 3 * 24 * 3600:
                print(f"-> WILL SEND EMAIL to {u['email']}")
        except Exception as e:
            print("ERROR", e)
