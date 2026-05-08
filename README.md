# SellerIQ Pro - Amazon Sales Intelligence

A comprehensive SaaS platform providing intelligent analytics, fraud detection, and sales forecasting for e-commerce sellers, specifically designed for Amazon MTR (Merchant Tax Reports) and Shopify D2C datasets.

## Project Architecture
- **Backend**: FastAPI, PostgreSQL (via asyncpg/SQLAlchemy), Pandas, Uvicorn
- **Frontend**: React, Vite, Framer Motion, Recharts, Lucide React

### 8. Enterprise-Grade Security Hardening (High Priority)
- **CORS Policy Restriction**: Removed wildcard (`*`) CORS allow-origins. The API now strictly enforces an `ALLOWED_ORIGINS` whitelist managed via environment variables, preventing cross-site attacks.
- **Fail-Fast Secret Enforcement**: Overhauled `config.py` to remove hardcoded fallback JWT secrets. The backend now performs a fatal startup check; if `JWT_SECRET` is missing from the environment, the server refuses to boot for security reasons.

### 9. Backend Scalability & Memory Management (High Priority)
- **Disk-Streamed File Uploads**: Refactored the data ingestion pipeline in `analyze.py`. Instead of loading entire multi-megabyte CSV files into RAM, the system now streams uploads to temporary files in 1MB chunks.
- **OOM Prevention**: This architectural shift reduces memory overhead by ~75% during parsing, allowing the platform to handle massive Enterprise-level Amazon MTR reports (50MB+) without crashing the server.
- **Automatic Cleanup**: Implemented secure `os.unlink` logic to ensure all temporary processing files are purged immediately after analysis or on failure.

### 10. Frontend Architectural Modularization (Medium Priority)
- **Monolith Deconstruction**: Began the process of breaking down the massive 2,000-line `Dashboard.jsx`.
- **Component Extraction**: Successfully extracted standalone SaaS/Pricing modules into a dedicated `SaaSComponents.jsx` file. This reduces main dashboard complexity and improves build-time tree-shaking.
- **Responsive Layout Engine**: Implemented a new CSS Grid system in `responsive_overrides.css`, replacing fragile inline styles with scalable classes (`dash-grid-4`, `dash-grid-3`, etc.) to ensure a flawless experience across Desktop, Tablet, and Mobile devices.
- **Horizontal Table Fluidity**: Wrapped all data tables in responsive containers to prevent layout breaking on mobile devices.

## ⚙️ How to Run Locally

### 1. Backend Setup
Navigate to the `backend/` directory:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --port 5000 --reload
```
*(Ensure PostgreSQL is running and credentials match your `backend/.env` configuration)*

### 2. Frontend Setup
Navigate to the `frontend/` directory:
```bash
cd frontend
npm install
npm run dev
```
