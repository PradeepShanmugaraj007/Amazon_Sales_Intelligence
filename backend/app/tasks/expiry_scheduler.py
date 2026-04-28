import asyncio
from datetime import datetime, timedelta
from app.services.stateless_memory import stateless_service
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
        users = stateless_service.get_all_users()
        for u in users:
            expiry_str = u.get("plan_expiry") or u.get("expiry_date")
            if not expiry_str:
                continue
            
            # Parse expiry date
            try:
                if "T" in expiry_str:
                    expiry_dt = datetime.fromisoformat(expiry_str)
                else:
                    try:
                        expiry_dt = datetime.strptime(expiry_str, "%Y-%m-%d")
                    except ValueError:
                        expiry_dt = datetime.strptime(expiry_str, "%Y-%m-%d %H:%M")
            except Exception as e:
                logger.warning(f"Failed to parse expiry date {expiry_str} for user {u.get('email')}: {e}")
                continue
            
            # Calculate days remaining
            delta = expiry_dt - now
            days_left = delta.days
            
            # For testing, we could also check seconds or minutes if we want to run it instantly, 
            # but per requirements: 7, 3, 1 days exact warning.
            # To handle edge cases where the loop runs at different times, we'll check if days_left is EXACTLY 7, 3, or 1.
            # Since delta.days rounds down to the integer number of days, if it's 7.5 days away, delta.days is 7.
            if days_left in [7, 3, 1]:
                user_email = u.get("email")
                warning_key = (user_email, days_left)
                
                if warning_key not in sent_warnings:
                    logger.info(f"Triggering {days_left}-day expiry warning for {user_email}")
                    html_content = get_expiry_warning_email_html(
                        name=u.get("name") or "User", 
                        plan=u.get("plan") or "Pro", 
                        expiry_date=expiry_dt.strftime("%d %b %Y")
                    )
                    
                    send_email(
                        to_email=user_email,
                        subject=f"Action Required: Your SellerIQ {str(u.get('plan')).title()} Plan expires in {days_left} days",
                        html_content=html_content
                    )
                    sent_warnings[warning_key] = True
        
    except Exception as e:
        logger.error(f"Error in expiry scheduler: {e}")
