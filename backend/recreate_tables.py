import asyncio
from sqlalchemy import text
from app.db.session import engine
from app.db.base_class import Base
from app.models.sales import User, Report, Transaction

async def recreate():
    print("Dropping existing tables to apply new schema...")
    async with engine.begin() as conn:
        await conn.execute(text("DROP TABLE IF EXISTS transactions CASCADE;"))
        await conn.execute(text("DROP TABLE IF EXISTS reports CASCADE;"))
        await conn.execute(text("DROP TABLE IF EXISTS users CASCADE;"))
        
        print("Recreating tables with updated columns...")
        await conn.run_sync(Base.metadata.create_all)
        
    print("Success! Schema is now up to date.")

if __name__ == "__main__":
    asyncio.run(recreate())
