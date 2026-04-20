from fastapi import APIRouter, Depends, HTTPException
from app.services.stateless_memory import stateless_service
from app.services.email_service import send_email, get_expiry_warning_email_html
from datetime import datetime

router = APIRouter()

@router.get("/users")
async def get_all_users():
    users = stateless_service.get_all_users()
    safe_users = []
    now = datetime.now()
    for u in users:
        user_dict = {
            "user_id": u.get("user_id"),
            "name": u.get("name"),
            "email": u.get("email"),
            "phone": u.get("phone"),
            "plan": u.get("plan"),
            "status": u.get("status"),
            "joined": u.get("joined").strftime("%Y-%m-%d") if u.get("joined") else None,
            "expiry_date": u.get("expiry_date")
        }
        if u.get("expiry_date"):
            try:
                expiry_dt = datetime.strptime(u["expiry_date"], "%Y-%m-%d")
                delta = expiry_dt - now
                user_dict["days_left"] = delta.days
                if delta.days < 0: user_dict["sub_status"] = "Expired"
                elif delta.days < 3: user_dict["sub_status"] = "Expiring Soon"
                else: user_dict["sub_status"] = "Active"
            except:
                user_dict["days_left"] = 0
                user_dict["sub_status"] = "Active"
        else:
            user_dict["days_left"] = 0
            user_dict["sub_status"] = "No Plan"
        safe_users.append(user_dict)
            
    return {"success": True, "users": safe_users}

@router.post("/send-expiry-warnings")
async def send_expiry_warnings():
    users = stateless_service.get_all_users()
    count = 0
    now = datetime.now()
    for u in users:
        expiry_date = u.get("expiry_date")
        if expiry_date:
            try:
                expiry_dt = datetime.strptime(expiry_date, "%Y-%m-%d")
                delta = expiry_dt - now
                if 0 <= delta.days <= 3:
                    sent = send_email(
                        u["email"],
                        "Action Required: Your SellerIQ Pro Plan is Expiring",
                        get_expiry_warning_email_html(u["name"], u["plan"], expiry_date)
                    )
                    if sent: count += 1
            except:
                continue
    
    return {"success": True, "emails_sent": count}
