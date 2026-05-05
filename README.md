# SellerIQ Pro - Amazon Sales Intelligence

A comprehensive SaaS platform providing intelligent analytics, fraud detection, and sales forecasting for e-commerce sellers, specifically designed for Amazon MTR (Merchant Tax Reports) and Shopify D2C datasets.

## Project Architecture
- **Backend**: FastAPI, PostgreSQL (via asyncpg/SQLAlchemy), Pandas, Uvicorn
- **Frontend**: React, Vite, Framer Motion, Recharts, Lucide React

## 🚀 Recent Updates (Latest Pulls & Merges)

The following major features, refactors, and stabilization fixes have been implemented over the last two days. **Please review these changes when pulling to avoid merge conflicts:**

### 1. Amazon MTR Data Parity & Accuracy Fixes
- Removed overly aggressive `(Order Id, Sku)` deduplication logic in the `analyze.py` backend API. This critical fix ensures that valid split shipments and multi-component Amazon MTR records are no longer falsely deleted, restoring perfect 100% parity with raw CSV financial values.
- Rewrote the global transaction mapping algorithms in `processor.py` (backend) and `utils.js` (frontend) to treat all unmapped or unclassified rows as valid `Shipments`, precisely matching expected Gross Revenue figures.
- Explicitly integrated the `Total Tax Amount` column from the raw 89-column CSV for absolute precision in the frontend KPI cards.

### 2. Multi-CSV Upload & Dataset Merging
- Completely overhauled `UploadSection.jsx` to allow selecting and drag-and-dropping multiple CSV/XLSX files simultaneously.
- Introduced intelligent dataset merging in `processor.py` that seamlessly combines datasets.
- Implemented automatic data deduplication to remove exact duplicate rows based on identical `Order Id` and `Sku` pairs before analysis, ensuring reporting integrity.

### 2. AI Intelligence Insights Engine
- Built a sophisticated natural-language `insights_engine.py` using over 30 dynamic business rules.
- Automatically generates intelligent, categorized insights around **Revenue Trends**, **SKU Concentration**, **Fraud Hotspots**, **Returns Health**, and **Logistics**.
- Deployed a premium frontend component, `InsightsPanel.jsx`, to cleanly display categorized severity metrics (Critical, Warning, Positive, Neutral) in a new dedicated dashboard tab and inline overview.

### 3. Authentication & Security Layer
- Fully stabilized JSON Web Token (JWT) based authentication.
- Configured user registration, secure password hashing (via `passlib` & `bcrypt`), and Google OAuth integration endpoints (`backend/app/api/v1/endpoints/auth.py`).
- Enhanced Admin Panel access security, replacing legacy hardcoded frontend checks with a secure `/api/v1/auth/login` server-side validation that responds with proper `is_admin` flags.

### 4. Database & Schema Synchronization
- Updated `SQLAlchemy` models (`User`, `Report`, `Transaction`) and ensured synchronization with the local PostgreSQL `sellerdb` database.
- Created robust script tools (`recreate_tables.py`) to keep the development database schema aligned with codebase changes.
- Fixed a critical initialization bug where `user_id` constraints were blocking new user creation.

### 5. Environment & Proxy Resolution
- Solved an ongoing `ECONNREFUSED` issue between the Vite frontend proxy and the Uvicorn backend by syncing port targets to `5000` (`vite.config.js` and `main.py`).
- Rectified an Excel generation error (`Cannot read properties of undefined (reading 'book_new')`) by properly configuring Vite to include `xlsx-js-style` in its optimization array.

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
