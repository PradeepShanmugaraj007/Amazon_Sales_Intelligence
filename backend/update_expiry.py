import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy.future import select
from app.models.sales import User
from datetime import datetime, timedelta

async def update_expiry():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        for u in users:
            if u.email == "aajay1118@gmail.com":
                u.expiry_date = datetime.utcnow() + timedelta(days=7)
                await db.commit()
                print("Updated aajay1118@gmail.com to 7 days expiry.")

asyncio.run(update_expiry())
