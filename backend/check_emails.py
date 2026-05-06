import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy.future import select
from app.models.sales import User
from datetime import datetime

async def run():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        now = datetime.utcnow()
        for u in users:
            if u.expiry_date:
                days = round((u.expiry_date - now).total_seconds() / 86400)
                print(f"{u.email} -> {days} days")
            else:
                print(f"{u.email} -> No expiry")

asyncio.run(run())
