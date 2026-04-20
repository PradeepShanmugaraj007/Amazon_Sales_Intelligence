import asyncio
from app.db.base_class import Base
from app.db.session import engine
# Import all models to ensure they are registered with Base metadata
from app.models.sales import User, Report, Transaction

async def init_models():
    print("--- Database Schema Initialization ---")
    try:
        async with engine.begin() as conn:
            # Drop all tables first if you want a clean slate (uncomment if needed)
            # await conn.run_sync(Base.metadata.drop_all)
            
            print("Creating tables for: User, Report, Transaction...")
            await conn.run_sync(Base.metadata.create_all)
            print("SUCCESS: Tables created successfully in 'sellerdb'.")
    except Exception as e:
        print(f"FAILURE: Could not initialize schema.")
        print(f"Detail: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_models())
