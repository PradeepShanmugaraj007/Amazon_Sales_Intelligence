import asyncio
from sqlalchemy import text
from app.db.session import engine

async def list_tables():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        rows = result.fetchall()
        print(f"Tables: {[row[0] for row in rows]}")

if __name__ == "__main__":
    asyncio.run(list_tables())
