import os
from dotenv import load_dotenv
from pathlib import Path

# Always resolve .env relative to this file: backend/.env
_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)

class Settings:
    PROJECT_NAME: str = "SellerIQ Pro"
    API_V1_STR: str = "/api/v1"
    
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-siq-key-2026-amazon-intelligence-secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 Week
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    
    # Razorpay
    RZP_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID")
    RZP_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET")
    
    # SMTP
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASS: str = os.getenv("SMTP_PASS", "")
    SALES_EMAIL: str = os.getenv("SALES_EMAIL", SMTP_USER)
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")

settings = Settings()
