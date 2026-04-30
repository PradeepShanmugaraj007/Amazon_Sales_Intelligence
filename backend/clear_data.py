import asyncio
from sqlalchemy import text
from app.db.session import engine

async def clear_data():
    print("--- Clearing All Database Data ---")
    try:
        async with engine.begin() as conn:
            # Disable foreign key checks for clean deletion if needed
            # For PostgreSQL, we just truncate
            print("Truncating tables: users, reports, transactions...")
            await conn.execute(text("TRUNCATE TABLE transactions, reports, users RESTART IDENTITY CASCADE;"))
            print("SUCCESS: All data cleared. Tables are now empty.")
    except Exception as e:
        print(f"FAILURE: Could not clear data.")
        print(f"Detail: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(clear_data())
