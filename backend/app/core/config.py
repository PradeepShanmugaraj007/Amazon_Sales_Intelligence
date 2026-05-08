import os
from dotenv import load_dotenv
from pathlib import Path

# Always resolve .env relative to this file: backend/.env
_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)

class Settings:
    PROJECT_NAME: str = "SellerIQ Pro"
    API_V1_STR: str = "/api/v1"
    
    jwt_secret = os.getenv("JWT_SECRET")
    if not jwt_secret:
        raise ValueError("FATAL: JWT_SECRET environment variable is not set. Refusing to start for security reasons.")
    JWT_SECRET: str = jwt_secret
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
    
    # CORS Security
    ALLOWED_ORIGINS: list = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5001,http://127.0.0.1:5173").split(",")

settings = Settings()
