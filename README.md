# SellerIQ Pro — Amazon Sales Intelligence Platform

Enterprise-grade analytics dashboard for Amazon sellers. Transform MTR (Merchant Tax Reports) into actionable business intelligence with AI-powered insights, fraud detection, and predictive forecasting.

## Architecture

```
Frontend (Vercel)          Backend (Render)
React + Vite ──── HTTPS ────▸ FastAPI + PostgreSQL
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Recharts, Framer Motion, Lucide Icons |
| Backend | FastAPI, SQLAlchemy (async), PostgreSQL |
| Auth | Google OAuth 2.0, JWT |
| Payments | Razorpay |
| Hosting | Vercel (frontend) + Render (backend) |

## Quick Start (Local Development)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Fill in your real values
python init_db.py
uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API calls to `http://localhost:5000`.

## Deployment

### Frontend → Vercel
1. Import repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add environment variable: `VITE_API_URL = https://your-backend.onrender.com`
4. Deploy

### Backend → Render
1. Create a new **Web Service** on [render.com](https://render.com)
2. Set **Root Directory** to `backend`
3. **Build Command:** `pip install -r requirements.txt && python init_db.py`
4. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add all env vars from `.env.example`
6. Set `ALLOWED_ORIGINS` to include your Vercel URL

## Project Structure

```
Amazon_Sales_Intelligence/
├── backend/
│   ├── app/
│   │   ├── api/          # API route handlers
│   │   ├── core/         # Config, security
│   │   ├── db/           # Database session & base
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   ├── tasks/        # Background tasks
│   │   ├── utils/        # Helpers
│   │   └── main.py       # FastAPI app entry
│   ├── .env.example
│   ├── build.sh
│   ├── init_db.py
│   └── requirements.txt
├── frontend/
│   ├── public/           # Static assets (videos, images)
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── context/      # App context providers
│   │   ├── api.js        # Axios API client
│   │   ├── utils.js      # Data processing utilities
│   │   ├── Dashboard.jsx # Main dashboard
│   │   └── main.jsx      # React entry point
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## License

Proprietary — SellerIQ Pro © 2026
