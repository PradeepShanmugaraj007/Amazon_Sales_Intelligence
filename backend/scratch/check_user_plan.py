import asyncio
from sqlalchemy import text
from app.db.session import engine

async def check_user():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT email, plan, status, expiry_date FROM users WHERE email = 'aajay1118@gmail.com'"))
        row = result.fetchone()
        if row:
            print(f"User found: {row}")
        else:
            print("User not found.")

if __name__ == "__main__":
    asyncio.run(check_user())
