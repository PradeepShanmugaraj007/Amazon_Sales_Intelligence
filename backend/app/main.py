from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.config import settings
from app.db.session import engine
from app.db.base_class import Base
# Import models to ensure they are registered with Base metadata
from app.models.sales import User, Report, Transaction
from sqlalchemy import text

app = FastAPI(title=settings.PROJECT_NAME)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API Router
app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
async def startup():
    # Start background tasks
    import asyncio
    from app.tasks.expiry_scheduler import check_expiries_loop
    asyncio.create_task(check_expiries_loop())
    
    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/health")
async def health():
    try:
        # Attempt to connect and execute a simple query
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": "disconnected", "detail": str(e)}

@app.get("/")
async def root():
    return {"message": "Welcome to SellerIQ Pro API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5001, reload=True)
