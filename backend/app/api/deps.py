from fastapi import Depends, HTTPException
from app.core.security import oauth2_scheme, decode_access_token
from app.db.session import AsyncSessionLocal
from app.models.sales import User
from sqlalchemy import select

GUEST_USER = {
    "id": "guest_anonymous",
    "email": "guest@selleriq.pro",
    "name": "Guest Analyst",
    "plan": "enterprise",
    "monthly_uploads": 0,
    "is_active": True
}

async def get_current_user(token: str = Depends(oauth2_scheme)):
    if not token or token == "undefined" or token == "null":
        return GUEST_USER
    
    try:
        payload = decode_access_token(token)
        if not payload:
            return GUEST_USER
        
        email = payload.get("sub")
        if email is None:
            return GUEST_USER
        
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            
            if user is None:
                return GUEST_USER
            
            # Simple conversion to dict for compat with rest of app
            return {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "plan": user.plan,
                "monthly_uploads": user.monthly_uploads
            }
    except Exception:
        return GUEST_USER
