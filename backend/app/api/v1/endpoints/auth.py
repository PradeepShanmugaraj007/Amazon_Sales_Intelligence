from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from app.core.security import verify_password, get_password_hash, create_access_token
from app.services.stateless_memory import stateless_service
from app.services.email_service import send_email, get_reset_email_html
from datetime import datetime
import string
import random

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

def generate_password(length=10):
    chars = string.ascii_letters + string.digits + "!@#$"
    pwd = [
        random.choice(string.ascii_uppercase),
        random.choice(string.ascii_lowercase),
        random.choice(string.digits),
        random.choice("!@#$"),
    ]
    pwd += random.choices(chars, k=length - 4)
    random.shuffle(pwd)
    return "".join(pwd)

@router.post("/login")
async def login(req: LoginRequest):
    # Standard Admin Bypass for Stateless mode
    if req.email == "admin@selleriq.pro" and req.password == "password":
        user = stateless_service.find_user_by_email(req.email)
    else:
        user = stateless_service.find_user_by_email(req.email)
        if not user or not verify_password(req.password, user.get("password", "")):
            raise HTTPException(status_code=401, detail="Invalid credentials for stateless mode.")
    
    # Update last login (in memory)

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    stateless_service.update_user(user["id"], {"last_login": now_str})
    
    plan = (user.get("plan", "starter")).lower()
    limits = {"starter": 3, "pro": 10, "enterprise": 30}
    limit = limits.get(plan, 3)
    
    token = create_access_token(data={"sub": user["email"]})

    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": user.get("user_id"),
            "name": user.get("name"),
            "plan": user.get("plan"),
            "email": user.get("email"),
            "usageStats": {
                "used": user.get("monthly_uploads", 0),
                "limit": limit,
                "plan": plan.upper()
            }
        }
    }

@router.post("/bypass-login")
async def bypass_login(payload: dict = Body(...)):
    plan = payload.get("plan", "starter")
    email = "guest@selleriq.pro"
    
    user = stateless_service.find_user_by_email(email)
    if not user:
        user_data = {
            "user_id": "GUEST-0001",
            "name": "Guest Tester",
            "email": email,
            "phone": "9999999999",
            "plan": plan,
            "password": get_password_hash("guest-bypass-2026"),
            "status": "Active",
            "monthly_uploads": 0
        }
        user_id = stateless_service.create_user(user_data)
        user = user_data
        user["id"] = user_id
    
    token = create_access_token(data={"sub": user["email"]})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "name": user["name"],
            "email": user["email"],
            "plan": user["plan"],
            "usageStats": {"used": user.get("monthly_uploads", 0), "limit": 30}
        }
    }

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    user = stateless_service.find_user_by_email(req.email)
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address.")

    new_password = generate_password()
    stateless_service.update_user(user["id"], {"password": get_password_hash(new_password)})

    sent = send_email(
        req.email,
        "SellerIQ Pro – Password Reset",
        get_reset_email_html(user["name"], new_password)
    )
    return {"success": True, "email_sent": sent, "message": "Reset email sent successfully."}
