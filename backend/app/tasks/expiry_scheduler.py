import asyncio
from datetime import datetime, timedelta
from sqlalchemy.future import select
from app.db.session import AsyncSessionLocal
from app.models.sales import User
from app.services.email_service import send_email, get_expiry_warning_email_html
import logging

logger = logging.getLogger(__name__)

# Track sent warnings to prevent duplicate emails
# Format: {(user_email, days_warning): True}
sent_warnings = {}

async def check_expiries_loop():
    logger.info("Starting background expiry scheduler loop...")
    while True:
        await check_all_expiries()
        # Sleep for 1 hour before checking again
        await asyncio.sleep(3600)

async def check_all_expiries():
    try:
        now = datetime.now()
        
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User))
            users = result.scalars().all()
            
            for u in users:
                if not u.expiry_date:
                    continue
                
                # Calculate days remaining
                delta = u.expiry_date - now
                days_left = delta.days
                
                # For testing, we could also check seconds or minutes if we want to run it instantly, 
                # but per requirements: 7, 3, 1 days exact warning.
                if days_left in [7, 3, 1]:
                    user_email = u.email
                    warning_key = (user_email, days_left)
                    
                    if warning_key not in sent_warnings:
                        logger.info(f"Triggering {days_left}-day expiry warning for {user_email}")
                        html_content = get_expiry_warning_email_html(
                            name=u.name or "User", 
                            plan=u.plan or "Pro", 
                            expiry_date=u.expiry_date.strftime("%d %b %Y")
                        )
                        
                        send_email(
                            to_email=user_email,
                            subject=f"Action Required: Your SellerIQ {str(u.plan).title()} Plan expires in {days_left} days",
                            html_content=html_content
                        )
                        sent_warnings[warning_key] = True
        
    except Exception as e:
        logger.error(f"Error in expiry scheduler: {e}")
