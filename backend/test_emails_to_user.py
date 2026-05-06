import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy.future import select
from app.models.sales import User
from app.services.email_service import send_email, get_promotional_email_html, get_expiry_warning_email_html
from datetime import datetime, timedelta

async def test_emails_to_user():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        for u in users:
            if u.email == "aajay1118@gmail.com":
                print(f"Testing emails for {u.email}...")
                
                # 1. Test Promotional Email
                print("Sending Promotional Email...")
                res1 = send_email(
                    u.email, 
                    "Elevate Your E-Commerce Strategy with SellerIQ Pro", 
                    get_promotional_email_html(u.name)
                )
                print(f"Promotional email sent: {res1}")
                
                # 2. Test Expiry Warning Email
                print("Sending Expiry Warning Email...")
                expiry_date_str = (datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%d")
                res2 = send_email(
                    u.email,
                    "Action Required: 7 Days Left on Your SellerIQ Pro Plan",
                    get_expiry_warning_email_html(u.name, u.plan, expiry_date_str, 7)
                )
                print(f"Expiry Warning email sent: {res2}")

asyncio.run(test_emails_to_user())
