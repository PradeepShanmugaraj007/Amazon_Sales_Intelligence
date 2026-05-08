import asyncio
from sqlalchemy.future import select
from app.db.session import AsyncSessionLocal
from app.models.sales import User

async def check_user():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "aajay1118@gmail.com"))
        user = result.scalars().first()
        if user:
            print(f"User found: {user.email}, Plan: {user.plan}, Provider: {user.provider}")
        else:
            print("User not found")

if __name__ == "__main__":
    asyncio.run(check_user())
