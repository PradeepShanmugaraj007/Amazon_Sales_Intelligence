from fastapi import APIRouter
from app.api.v1.endpoints import auth, analyze, admin, payments

api_router = APIRouter()

@api_router.get("/health")
async def health_check():
    return {"status": "ok", "version": "v1"}

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
