from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.config import settings
from app.services.stateless_memory import stateless_service
from app.services.email_service import send_email, get_welcome_email_html
from app.core.security import get_password_hash
from datetime import datetime, timedelta
import os
import razorpay
import string
import random

router = APIRouter()

# Initialize Razorpay
rzp_client = razorpay.Client(auth=(settings.RZP_KEY_ID, settings.RZP_KEY_SECRET)) if settings.RZP_KEY_ID and settings.RZP_KEY_SECRET else None

class PaymentRequest(BaseModel):
    amount: int
    currency: str = "INR"

class CompletePaymentRequest(BaseModel):
    payment_id: str
    plan: str
    name: str
    phone: str
    email: str

def generate_user_id():
    return "SIQ-" + "".join(random.choices(string.digits, k=4))

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

@router.post("/create-payment-order")
async def create_payment_order(req: PaymentRequest):
    if not rzp_client:
        raise HTTPException(status_code=500, detail="Razorpay not configured on server")
    try:
        order_amount = req.amount * 100
        order_receipt = "order_rcptid_" + os.urandom(4).hex()
        razorpay_order = rzp_client.order.create(dict(amount=order_amount, currency=req.currency, receipt=order_receipt))
        return {"success": True, "order_id": razorpay_order['id'], "key_id": settings.RZP_KEY_ID}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/complete-payment")
async def complete_payment(req: CompletePaymentRequest):
    existing = stateless_service.find_user_by_email(req.email)
    expiry_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")

    if existing:
        stateless_service.update_user(existing["id"], {
            "plan": req.plan,
            "status": "Active",
            "expiry_date": expiry_date,
            "payment_id": req.payment_id
        })
        
        send_email(
            req.email,
            f"SellerIQ Pro – Your {req.plan.title()} Plan is Renewed",
            get_welcome_email_html(req.name, existing.get("user_id"), "—", req.plan)
        )
        return {"success": True, "user_id": existing.get("user_id"), "message": "Account renewed successfully"}

    user_id = generate_user_id()
    password = generate_password()
    hashed_password = get_password_hash(password)
    
    user_data = {
        "user_id": user_id,
        "name": req.name,
        "email": req.email,
        "phone": req.phone,
        "plan": req.plan,
        "password": hashed_password,
        "payment_id": req.payment_id,
        "expiry_date": expiry_date,
        "status": "Active",
        "monthly_uploads": 0
    }
    stateless_service.create_user(user_data)

    # Send welcome email
    sent = send_email(
        req.email,
        f"SellerIQ Pro – Welcome! Your {req.plan.title()} Plan Credentials",
        get_welcome_email_html(req.name, user_id, password, req.plan)
    )

    return {
        "success": True,
        "user_id": user_id,
        "email_sent": sent,
        "message": "Account created. Check your email for credentials."
    }
