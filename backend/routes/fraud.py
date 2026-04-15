from fastapi import APIRouter
from typing import Optional
from datetime import datetime

from utils.store import session_db
from services.processor import process_data

router = APIRouter()

@router.get("/refunds/fraud")
def get_refunds_fraud(session_id: str = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    if not session_id or session_id not in session_db:
        return []

    data_store = session_db[session_id]
    fraud_obj = process_data(data_store["rawData"])["analysis"]["fraud"]

    if start_date or end_date:
        try:
            sd = datetime.strptime(start_date, "%Y-%m-%dT%H:%M:%S.%fZ") if start_date else None
        except:
            sd = datetime.fromisoformat(start_date.replace("Z", "+00:00")) if start_date else None
            
        try:
            ed = datetime.strptime(end_date, "%Y-%m-%dT%H:%M:%S.%fZ") if end_date else None
        except:
            ed = datetime.fromisoformat(end_date.replace("Z", "+00:00")) if end_date else None

        filtered_rows = []
        for r in data_store["rawData"]:
            iso_date = r.get("_isoDate")
            if not iso_date: continue
            if sd and iso_date < sd.replace(tzinfo=None): continue
            if ed and iso_date > ed.replace(tzinfo=None): continue
            filtered_rows.append(r)

        re_processed = process_data(filtered_rows)
        fraud_obj = re_processed["analysis"]["fraud"]

    return fraud_obj
