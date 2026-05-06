import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

async def check_connection():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    
    print(f"--- Database Connection Test ---")
    print(f"Target URL: {db_url}")
    
    if not db_url:
        print("ERROR: DATABASE_URL not found in .env")
        return

    try:
        engine = create_async_engine(db_url)
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            print("SUCCESS: Established asynchronous connection to PostgreSQL.")
        await engine.dispose()
    except Exception as e:
        print(f"FAILURE: Could not connect to database.")
        print(f"Detail: {e}")

if __name__ == "__main__":
    asyncio.run(check_connection())
