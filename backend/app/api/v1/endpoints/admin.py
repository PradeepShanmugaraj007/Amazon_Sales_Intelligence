from fastapi import APIRouter, Depends, HTTPException
from app.services.stateless_memory import stateless_service
from app.services.email_service import send_email, get_expiry_warning_email_html
from datetime import datetime

router = APIRouter()

@router.post("/trigger-expiry")
async def trigger_expiry_checks():
    try:
        from app.tasks.expiry_scheduler import check_all_expiries
        await check_all_expiries()
        return {"success": True, "message": "Triggered manual expiry check."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users")
async def get_all_users():
    users = stateless_service.get_all_users()
    safe_users = []
    now = datetime.utcnow()
    for u in users:
        # Map plan_expiry or expiry_date to a unified string
        expiry_str = u.get("plan_expiry") or u.get("expiry_date")
        
        user_dict = {
            "user_id": u.get("user_id"),
            "name": u.get("name"),
            "email": u.get("email"),
            "phone": u.get("phone"),
            "plan": u.get("plan"),
            "status": u.get("status"),
            "joined": u.get("joined").strftime("%Y-%m-%d") if u.get("joined") and isinstance(u.get("joined"), datetime) else str(u.get("joined")) if u.get("joined") else None,
            "expiry_date": expiry_str
        }
        
        if expiry_str:
            try:
                # Handle ISO format from demo users, fallback to YYYY-MM-DD
                try:
                    expiry_dt = datetime.fromisoformat(expiry_str)
                except ValueError:
                    expiry_dt = datetime.strptime(expiry_str, "%Y-%m-%d")
                
                delta = expiry_dt - now
                user_dict["days_left"] = delta.days
                
                # Format nicely for the admin panel table
                user_dict["expiry_date"] = expiry_dt.strftime("%Y-%m-%d %H:%M")
                
                if delta.total_seconds() <= 0:
                    user_dict["sub_status"] = "Expired"
                elif delta.total_seconds() <= 3 * 24 * 3600:
                    user_dict["sub_status"] = "Expiring Soon"
                else:
                    user_dict["sub_status"] = "Active"
            except Exception as e:
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
    now = datetime.utcnow()
    for u in users:
        expiry_str = u.get("plan_expiry") or u.get("expiry_date")
        if expiry_str:
            try:
                # Handle ISO format from demo users, fallback to YYYY-MM-DD
                try:
                    expiry_dt = datetime.fromisoformat(expiry_str)
                except ValueError:
                    expiry_dt = datetime.strptime(expiry_str, "%Y-%m-%d")
                
                delta = expiry_dt - now
                
                # Check if expiring within 3 days
                if 0 <= delta.total_seconds() <= 3 * 24 * 3600:
                    readable_date = expiry_dt.strftime("%Y-%m-%d %H:%M")
                    sent = send_email(
                        u["email"],
                        "Action Required: Your SellerIQ Pro Plan is Expiring",
                        get_expiry_warning_email_html(u["name"], u["plan"], readable_date)
                    )
                    if sent: count += 1
            except Exception as e:
                print(f"Failed to send email to {u.get('email')}: {e}")
                continue
    
    return {"success": True, "emails_sent": count}
