from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.sales import User
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
async def get_all_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    
    safe_users = []
    now = datetime.utcnow()

    # IDs and emails of hardcoded internal/demo accounts to exclude
    DEMO_USER_IDS = {"GUEST-001"}
    INTERNAL_EMAIL_DOMAINS = {"selleriq.pro"}

    for u in users:
        # Skip internal/demo/guest accounts
        email_domain = u.email.split("@")[-1] if "@" in u.email else ""

        if u.user_id in DEMO_USER_IDS:
            continue
        if email_domain in INTERNAL_EMAIL_DOMAINS:
            continue

        user_dict = {
            "user_id": u.user_id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "plan": u.plan,
            "status": u.status,
            "provider": u.provider or "Email",
            "joined": u.joined.strftime("%Y-%m-%d %H:%M") if u.joined else None,
            "expiry_date": u.expiry_date.strftime("%Y-%m-%d") if u.expiry_date else None,
            "is_admin": u.is_admin
        }

        if u.expiry_date:
            delta = u.expiry_date - now
            user_dict["days_left"] = delta.days

            if delta.total_seconds() <= 0:
                user_dict["sub_status"] = "Expired"
            elif delta.total_seconds() <= 3 * 24 * 3600:
                user_dict["sub_status"] = "Expiring Soon"
            else:
                user_dict["sub_status"] = "Active"
        else:
            user_dict["days_left"] = 0
            user_dict["sub_status"] = "No Plan"

        safe_users.append(user_dict)

    return {"success": True, "users": safe_users}

@router.post("/send-expiry-warnings")
async def send_expiry_warnings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    
    count = 0
    now = datetime.utcnow()
    for u in users:
        if u.expiry_date:
            try:
                delta = u.expiry_date - now
                
                # Check if expiring within 3 days
                if 0 <= delta.total_seconds() <= 3 * 24 * 3600:
                    readable_date = u.expiry_date.strftime("%Y-%m-%d %H:%M")
                    sent = send_email(
                        u.email,
                        "Action Required: Your SellerIQ Pro Plan is Expiring",
                        get_expiry_warning_email_html(u.name, u.plan, readable_date)
                    )
                    if sent: count += 1
            except Exception as e:
                print(f"Failed to send email to {u.email}: {e}")
                continue
    
    return {"success": True, "emails_sent": count}
