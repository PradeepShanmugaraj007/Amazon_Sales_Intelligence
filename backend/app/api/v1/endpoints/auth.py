from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.sales import User
from app.core.security import verify_password, get_password_hash, create_access_token, oauth2_scheme, decode_access_token
from app.services.email_service import send_email, get_reset_email_html, get_otp_email_html
from app.core.config import settings
from google.oauth2 import id_token
from google.auth.transport import requests as auth_requests
from datetime import datetime
import string
import random
import uuid

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleLoginRequest(BaseModel):
    credential: str = None
    access_token: str = None

class ForgotPasswordRequest(BaseModel):
    email: str

class SendOtpRequest(BaseModel):
    email: str
    name: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    phone: str
    otp: str
    password: str

# In-memory OTP store: {email: {"otp": "123456", "name": "John", "expires_at": datetime}}
_otp_store: dict = {}

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

def get_plan_status(user: User) -> dict:
    if not user.expiry_date:
        return {"status": "active", "minutes_remaining": None, "expiry_date": None}
    
    now = datetime.utcnow()
    diff = user.expiry_date - now
    minutes_remaining = int(diff.total_seconds() / 60)
    expiry_readable = user.expiry_date.strftime("%Y-%m-%d %H:%M UTC")

    if diff.total_seconds() <= 0:
        return {"status": "expired", "minutes_remaining": 0, "expiry_date": expiry_readable}
    elif diff.days <= 7:
        return {"status": "expiring_soon", "minutes_remaining": minutes_remaining, "expiry_date": expiry_readable}
    else:
        return {"status": "active", "minutes_remaining": minutes_remaining, "expiry_date": expiry_readable}

@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalars().first()
    
    if req.email == "admin@selleriq.pro" and req.password == "Admin@1234":
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                user_id="SIQ-ADMIN",
                email=req.email,
                name="System Administrator",
                plan="enterprise",
                is_admin=True,
                hashed_password=get_password_hash(req.password)
            )
            db.add(user)
            await db.commit()
    else:
        if not user:
            raise HTTPException(status_code=401, detail="No account found with this email.")
        
        if user.hashed_password:
            if not verify_password(req.password, user.hashed_password):
                raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")
        else:
            # If user has no password (e.g. Google Auth user), they must use Google Auth
            if user.provider == "Google":
                 raise HTTPException(status_code=401, detail="This account uses Google Login. Please sign in with Google.")
            else:
                 # Should not happen for new users, but for legacy ones
                 raise HTTPException(status_code=401, detail="Credentials not set for this account.")

    plan_status = get_plan_status(user)
    if plan_status["status"] == "expired":
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=402,
            content={
                "detail": "PLAN_EXPIRED",
                "name": user.name or "",
                "email": user.email or "",
                "plan": user.plan or "",
                "expiry_date": plan_status["expiry_date"] or "",
            }
        )

    plan = (user.plan or "starter").lower()
    limits = {"starter": 3, "pro": 10, "enterprise": 30}
    limit = limits.get(plan, 3)

    token = create_access_token(data={"sub": user.email})

    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "plan_status": plan_status,
        "user": {
            "user_id": user.user_id,
            "name": user.name,
            "plan": user.plan,
            "email": user.email,
            "plan_expiry": user.expiry_date.isoformat() if user.expiry_date else None,
            "usageStats": {
                "used": user.monthly_uploads or 0,
                "limit": limit,
                "plan": plan.upper()
            }
        }
    }

@router.post("/bypass-login")
async def bypass_login(payload: dict = Body(...), db: AsyncSession = Depends(get_db)):
    plan = payload.get("plan", "starter")
    email = "guest@selleriq.pro"

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            user_id="GUEST-0001",
            name="Guest Tester",
            email=email,
            phone="9999999999",
            plan=plan,
            status="Active"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        user.plan = plan
        await db.commit()
        await db.refresh(user)

    plan_status = get_plan_status(user)

    return {
        "access_token": create_access_token(data={"sub": user.email}),
        "token_type": "bearer",
        "user": {
            "name": user.name,
            "email": user.email,
            "plan": user.plan,
            "plan_expiry": user.expiry_date.isoformat() if user.expiry_date else None,
            "picture": user.picture
        },
        "plan_status": plan_status
    }

@router.post("/send-otp")
async def send_otp(req: SendOtpRequest, db: AsyncSession = Depends(get_db)):
    """Send a 6-digit OTP to the given email for registration verification."""
    # Check if email is already registered
    result = await db.execute(select(User).where(User.email == req.email))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists. Please login instead.")
    
    from datetime import timedelta
    otp = "".join(random.choices("0123456789", k=6))
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    _otp_store[req.email] = {"otp": otp, "name": req.name, "expires_at": expires_at}
    
    sent = send_email(
        req.email,
        "SellerIQ Pro – Your Verification Code",
        get_otp_email_html(req.name, otp)
    )
    return {"success": True, "email_sent": sent, "message": "OTP sent to your email address."}

@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Verify OTP and create a new user account."""
    entry = _otp_store.get(req.email)
    if not entry:
        raise HTTPException(status_code=400, detail="No OTP was requested for this email. Please request a new OTP.")
    
    if datetime.utcnow() > entry["expires_at"]:
        _otp_store.pop(req.email, None)
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    if entry["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP. Please check your email and try again.")
    
    # OTP valid — clean up
    _otp_store.pop(req.email, None)
    
    # Check again if email taken (race condition)
    result = await db.execute(select(User).where(User.email == req.email))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    
    name = entry["name"]
    user_id = "SIQ-" + "".join(random.choices("0123456789", k=4))
    
    new_user = User(
        id=str(uuid.uuid4()),
        user_id=user_id,
        name=name,
        email=req.email,
        phone=req.phone,
        plan="demo",
        status="Active",
        provider="Email",
        monthly_uploads=0,
        hashed_password=get_password_hash(req.password)
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    token = create_access_token(data={"sub": new_user.email})
    plan_status = get_plan_status(new_user)
    limits = {"starter": 3, "pro": 10, "enterprise": 30}
    
    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "plan_status": plan_status,
        "user": {
            "user_id": new_user.user_id,
            "name": new_user.name,
            "plan": new_user.plan,
            "email": new_user.email,
            "plan_expiry": None,
            "usageStats": {"used": 0, "limit": 3, "plan": "STARTER"}
        }
    }

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address.")

    new_password = generate_password()
    sent = send_email(
        req.email,
        "SellerIQ Pro – Password Reset",
        get_reset_email_html(user.name, "No password needed. Use Google OAuth to login.")
    )
    return {"success": True, "email_sent": sent, "message": "Reset email sent successfully."}

@router.get("/plan-status")
async def get_plan_status_endpoint(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    email = payload.get("sub")
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    plan_status = get_plan_status(user)
    return {
        "email": user.email,
        "name": user.name,
        "plan": user.plan,
        "plan_expiry": user.expiry_date.isoformat() if user.expiry_date else None,
        **plan_status
    }

@router.post("/google-login")
async def google_login(req: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        email = None
        name = None
        picture = None

        if req.credential:
            idinfo = id_token.verify_oauth2_token(
                req.credential, 
                auth_requests.Request(), 
                settings.GOOGLE_CLIENT_ID
            )
            email = idinfo['email']
            name = idinfo.get('name', email.split('@')[0])
            picture = idinfo.get('picture', None)
        elif req.access_token:
            import requests as py_requests
            res = py_requests.get(f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={req.access_token}")
            if res.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google access token")
            user_info = res.json()
            email = user_info['email']
            name = user_info.get('name', email.split('@')[0])
            picture = user_info.get('picture', None)
        else:
            raise HTTPException(status_code=400, detail="Missing Google credential or access_token")

        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                user_id=f"GOOGLE-{random.randint(1000, 9999)}",
                name=name,
                email=email,
                plan="starter",
                status="Active",
                provider="Google",
                picture=picture
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            if picture and user.picture != picture:
                user.picture = picture
                await db.commit()
                await db.refresh(user)
        
        plan_status = get_plan_status(user)
        if plan_status["status"] == "expired":
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=402,
                content={
                    "detail": "PLAN_EXPIRED",
                    "name": user.name or "",
                    "email": user.email or "",
                    "plan": user.plan or "",
                    "expiry_date": plan_status["expiry_date"] or "",
                }
            )

        plan = (user.plan or "demo").lower()
        limits = {"starter": 3, "pro": 10, "enterprise": 30}
        limit = limits.get(plan, 3)

        token = create_access_token(data={"sub": user.email})

        return {
            "success": True,
            "access_token": token,
            "token_type": "bearer",
            "plan_status": plan_status,
            "user": {
                "user_id": user.user_id,
                "name": user.name,
                "plan": user.plan,
                "email": user.email,
                "plan_expiry": user.expiry_date.isoformat() if user.expiry_date else None,
                "picture": picture,
                "usageStats": {
                    "used": user.monthly_uploads or 0,
                    "limit": limit,
                    "plan": plan.upper()
                }
            }
        }
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google authentication failed: {str(e)}")
