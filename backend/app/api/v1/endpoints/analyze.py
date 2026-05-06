import io
import pandas as pd
from datetime import datetime
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from app.api.deps import get_current_user
from app.db.session import AsyncSessionLocal
from app.models.sales import User, Report, Transaction
from app.services.processor import process_data as advanced_process_data
from app.services.forecast import generate_detailed_forecast
from app.services.insights_engine import generate_business_insights
from app.utils.helpers import safe_float
from sqlalchemy import select

router = APIRouter()

@router.post("")
async def analyze_report(
    files: List[UploadFile] = File(...),
    user_data: dict = Depends(get_current_user)
):
    max_bytes = 500 * 1024 * 1024
    all_parsed_rows = []
    
    async with AsyncSessionLocal() as db:
        # 1. Sync User to DB if they don't exist
        user_id = user_data.get("id", "guest_anonymous")
        result = await db.execute(select(User).where(User.id == user_id))
        db_user = result.scalar_one_or_none()
        
        if not db_user:
            db_user = User(
                id=user_id,
                email=user_data.get("email", "guest@selleriq.pro"),
                name=user_data.get("name", "Guest"),
                plan=user_data.get("plan", "starter")
            )
            db.add(db_user)
            await db.commit()
            await db.refresh(db_user)

        for file in files:
            contents = await file.read()
            if len(contents) > max_bytes:
                raise HTTPException(status_code=413, detail="File too large")
            
            # 2. Parse using Pandas
            try:
                if file.filename.endswith(('.xlsx', '.xls')):
                    df = pd.read_excel(io.BytesIO(contents))
                else:
                    decoded = None
                    for enc in ['utf-8', 'latin-1', 'cp1252']:
                        try:
                            decoded = contents.decode(enc)
                            break
                        except: continue
                    if not decoded:
                         raise Exception("Could not decode CSV file. Please use UTF-8.")
                    df = pd.read_csv(io.StringIO(decoded))
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Parse Error: {str(e)}")

            df = df.fillna("")
            headers = df.columns.tolist()
            
            # 3. Transform & Normalize
            for _, row in df.iterrows():
                obj = {}
                for h in headers:
                    val = str(row[h]).strip()
                    if not val or val.lower() == "nan": continue
                    
                    lower_h = h.lower().replace("-", "").replace("_", "").replace(" ", "")
                    mapped_key = h
                    if lower_h in ['city','shipcity','shiptocity']: mapped_key = 'Ship To City'
                    if lower_h in ['state','shipstate','shiptostate']: mapped_key = 'Ship To State'
                    if lower_h in ['postalcode','zip','pincode']: mapped_key = 'Ship To Zip'
                    if lower_h in ['orderid','ordernumber']: mapped_key = 'Order Id'
                    if lower_h in ['sku','asin']: mapped_key = 'Sku'
                    if lower_h in ['quantity','units']: mapped_key = 'Quantity'
                    if lower_h in ['itemprice','amount','revenue']: mapped_key = 'Invoice Amount'
                    if lower_h in ['invoicedate','date']: mapped_key = 'Invoice Date'
                    if lower_h in ['gstin','buyerregistration']: mapped_key = 'Gstin'
                    
                    obj[mapped_key] = val
                all_parsed_rows.append(obj)

        if not all_parsed_rows:
            raise HTTPException(status_code=400, detail="No readable data found.")

        # 4. Analysis
        analysis_results = advanced_process_data(all_parsed_rows)
        intelligence_payload = analysis_results.get("analysis", {})
        intelligence_payload["forecast"] = generate_detailed_forecast(intelligence_payload.get("dailySales", []))
        intelligence_payload["insights"] = generate_business_insights(intelligence_payload)

        # 5. Persist to Database
        report_id = str(uuid.uuid4())
        new_report = Report(
            id=report_id,
            user_id=db_user.id,
            filename=", ".join([f.filename for f in files]),
            source="amazon_mtr_merged",
            record_count=len(all_parsed_rows),
            analysis_results=intelligence_payload
        )
        db.add(new_report)

        # Bulk save individual transactions safely using safe_float formatting
        for row_data in all_parsed_rows:
            txn = Transaction(
                report_id=report_id,
                order_id=str(row_data.get('Order Id', '')),
                sku=str(row_data.get('Sku', '')),
                revenue=safe_float(row_data.get('Invoice Amount')),
                quantity=safe_float(row_data.get('Quantity')),
                tax_cgst=safe_float(row_data.get('Cgst Tax')),
                tax_sgst=safe_float(row_data.get('Sgst Tax')),
                tax_igst=safe_float(row_data.get('Igst Tax')),
                ship_city=row_data.get('Ship To City'),
                ship_state=row_data.get('Ship To State'),
                ship_zip=row_data.get('Ship To Zip'),
                gstin=row_data.get('Gstin'),
                fulfillment_channel=row_data.get('Fulfillment Channel'),
                raw_payload=row_data
            )
            # Try parse date
            try:
                dt_str = row_data.get('Invoice Date')
                if dt_str:
                    for fmt_str in ["%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d", "%d-%m-%Y"]:
                        try:
                            txn.invoice_date = datetime.strptime(dt_str.split(' ')[0], fmt_str)
                            break
                        except: continue
            except: pass
            db.add(txn)

        db_user.monthly_uploads += 1
        await db.commit()

        return {
            "success": True,
            "filename": files[0].filename if files else "report.csv",
            "session_id": report_id,
            "rawData": all_parsed_rows,
            "analysis": intelligence_payload,
            "usageStats": {
                "used": db_user.monthly_uploads,
                "limit": 999999,
                "plan": db_user.plan
            }
        }

@router.get("/")
async def list_reports(
    user_data: dict = Depends(get_current_user)
):
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Report).where(Report.user_id == user_data["id"]).order_by(Report.upload_date.desc())
        )
        reports = result.scalars().all()
        return {
            "success": True,
            "reports": [
                {
                    "id": r.id,
                    "filename": r.filename,
                    "upload_date": r.upload_date,
                    "record_count": r.record_count,
                    "source": r.source
                } for r in reports
            ]
        }

@router.get("/{report_id}")
async def get_report_details(
    report_id: str,
    user_data: dict = Depends(get_current_user)
):
    async with AsyncSessionLocal() as db:
        # Verify report belongs to user
        result = await db.execute(
            select(Report).where(Report.id == report_id, Report.user_id == user_data["id"])
        )
        report = result.scalar_one_or_none()
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
            
        # Fetch transactions
        txn_result = await db.execute(
            select(Transaction).where(Transaction.report_id == report_id)
        )
        transactions = txn_result.scalars().all()
        
        return {
            "success": True,
            "report": {
                "id": report.id,
                "filename": report.filename,
                "upload_date": report.upload_date,
                "record_count": report.record_count,
                "analysis": report.analysis_results
            },
            "rawData": [t.raw_payload for t in transactions]
        }
