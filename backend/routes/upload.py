from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import uuid
import pandas as pd
import io

from services.processor import parse_uploaded_data, process_data, process_dataframe_data
from utils.store import session_db

router = APIRouter()

@router.post("/analyze")
async def analyze(file: Optional[UploadFile] = File(None), csvData: Optional[str] = Form(None)):
    try:
        content = ""
        if file is not None:
            raw_bytes = await file.read()
            content = raw_bytes.decode("utf-8")
        elif csvData is not None:
            content = csvData
        else:
            raise HTTPException(status_code=400, detail="No data provided. Please upload a file or send csvData string.")

        parsed_data = parse_uploaded_data(content)
        result = process_data(parsed_data)
        
        session_id = str(uuid.uuid4())
        session_db[session_id] = {
            "rawData": parse_uploaded_data(content),
            "analysis": result["analysis"]
        }

        return {
            "success": True,
            "session_id": session_id,
            "filename": file.filename if file else 'raw_input.csv',
            "rawData": result["rawData"],
            **result["analysis"]
        }
    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# TODO: Later migrate frontend to /upload and remove /analyze
@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file format")
        
    required_cols = [
        "Order Id", "Invoice Date", "Sku", "Quantity", 
        "Invoice Amount", "Ship To State", "Transaction Type", 
        "Fulfillment Channel"
    ]
    
    try:
        chunks = []
        for chunk in pd.read_csv(file.file, chunksize=10000):
            if not chunks:
                missing = [col for col in required_cols if col not in chunk.columns]
                if missing:
                    raise HTTPException(status_code=400, detail=f"Missing required columns: {missing}")
            chunks.append(chunk)
            
        if not chunks:
            raise HTTPException(status_code=400, detail="Empty file")
            
        df = pd.concat(chunks, ignore_index=True)
        
        df = df.rename(columns={
            "Order Id": "order_id",
            "Invoice Date": "date",
            "Sku": "sku",
            "Quantity": "quantity",
            "Invoice Amount": "revenue",
            "Ship To State": "state",
            "Transaction Type": "transaction_type",
            "Fulfillment Channel": "fulfillment"
        })
        
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df['revenue'] = pd.to_numeric(df['revenue'], errors='coerce').fillna(0)
        df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce').fillna(0)
        
        df['sku'] = df['sku'].fillna('UNKNOWN')
        df['state'] = df['state'].fillna('Unknown')
        df['transaction_type'] = df['transaction_type'].fillna('')
        df['fulfillment'] = df['fulfillment'].fillna('')
        
        df['is_return'] = df['transaction_type'].str.contains('Return', case=False, na=False)
        
        result = process_dataframe_data(df)
        
        session_id = str(uuid.uuid4())
        session_db[session_id] = {
            "rawData": result["rawData"],
            "analysis": result["analysis"]
        }
        
        return {
            "success": True,
            "session_id": session_id,
            "filename": file.filename,
            "rawData": result["rawData"],
            **result["analysis"]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
