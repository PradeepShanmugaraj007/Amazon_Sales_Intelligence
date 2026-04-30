from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.sales import User
from app.core.config import settings
from app.services.email_service import send_email, get_welcome_email_html
from app.core.security import get_password_hash
from datetime import datetime, timedelta
import os
import razorpay
import string
import random
import uuid

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
    billing_cycle: int = 12

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
    # Dev/test fallback: if Razorpay not configured, return a mock order
    if not rzp_client:
        return {
            "success": True,
            "order_id": "order_test_" + os.urandom(4).hex(),
            "key_id": "rzp_test_placeholder",
            "dev_mode": True
        }
    try:
        order_amount = req.amount * 100
        order_receipt = "order_rcptid_" + os.urandom(4).hex()
        razorpay_order = rzp_client.order.create(dict(amount=order_amount, currency=req.currency, receipt=order_receipt))
        return {"success": True, "order_id": razorpay_order['id'], "key_id": settings.RZP_KEY_ID}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Razorpay error: {str(e)}")

@router.post("/complete-payment")
async def complete_payment(req: CompletePaymentRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    existing = result.scalars().first()
    
    days_to_add = req.billing_cycle * 30
    expiry_date = datetime.now() + timedelta(days=days_to_add)

    if existing:
        existing.plan = req.plan
        existing.status = "Active"
        existing.expiry_date = expiry_date
        existing.payment_id = req.payment_id
        await db.commit()
        await db.refresh(existing)
        
        send_email(
            req.email,
            f"SellerIQ Pro – Your {req.plan.title()} Plan is Renewed",
            get_welcome_email_html(req.name, existing.user_id, "—", req.plan)
        )
        return {"success": True, "user_id": existing.user_id, "message": "Account renewed successfully"}

    user_id = generate_user_id()
    
    new_user = User(
        id=str(uuid.uuid4()),
        user_id=user_id,
        name=req.name,
        email=req.email,
        phone=req.phone,
        plan=req.plan,
        payment_id=req.payment_id,
        expiry_date=expiry_date,
        status="Active",
        monthly_uploads=0,
        provider="Email"
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Send welcome email (dummy password removed)
    sent = send_email(
        req.email,
        f"SellerIQ Pro – Welcome! Your {req.plan.title()} Plan Credentials",
        get_welcome_email_html(req.name, user_id, "Use Google OAuth to Login", req.plan)
    )

    return {
        "success": True,
        "user_id": user_id,
        "email_sent": sent,
        "message": "Account created. Check your email for credentials."
    }
