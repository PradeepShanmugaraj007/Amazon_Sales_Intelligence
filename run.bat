@echo off
echo Starting FastAPI Backend...
start "SellerIQ Backend" cmd /k "cd backend && python -m uvicorn main:app --port 5000 --reload"

echo Starting React Frontend...
start "SellerIQ Frontend" cmd /k "cd frontend && npm run dev"

echo Both services are starting up in separate windows!
