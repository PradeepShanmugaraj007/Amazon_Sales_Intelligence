import uvicorn
import csv
import io
import math
import json
import os
import random
import string
import smtplib
import pandas as pd
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
import razorpay
from dotenv import load_dotenv

from services.fraud_engine import generate_fraud_alerts

load_dotenv()

# ── Razorpay ──────────────────────────────────────────────────────────────────
RZP_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RZP_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
rzp_client = razorpay.Client(auth=(RZP_KEY_ID, RZP_KEY_SECRET)) if RZP_KEY_ID and RZP_KEY_SECRET else None

# ── SMTP ──────────────────────────────────────────────────────────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SALES_EMAIL = os.getenv("SALES_EMAIL", SMTP_USER)

# ── Users Database (local JSON) ────────────────────────────────────────────────
USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")

def load_users():
    if not os.path.exists(USERS_FILE):
        return []
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

def find_user_by_email(email: str):
    users = load_users()
    return next((u for u in users if u["email"].lower() == email.lower()), None)

# ── Helpers ───────────────────────────────────────────────────────────────────
def generate_user_id():
    return "SIQ-" + "".join(random.choices(string.digits, k=4))

def generate_password(length=10):
    chars = string.ascii_letters + string.digits + "!@#$"
    pwd = [
        random.choice(string.ascii_uppercase),
        random.choice(string.ascii_lowercase),
        random.choice(string.digits),
        random.choice("!@#$"),
    ]
    pwd += random.choices(chars, k=length - 4)
    random.shuffle(pwd)
    return "".join(pwd)

def send_email(to_email: str, subject: str, html_body: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_USER
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False

def credentials_email_html(name, user_id, password, plan):
    plan_colors = {"starter": "#64748b", "pro": "#a855f7", "enterprise": "#f59e0b"}
    color = plan_colors.get(plan.lower(), "#3b82f6")
    return f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Inter',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:900;letter-spacing:-1px;">SellerIQ <span style="color:#60a5fa;">Pro</span></h1>
      <p style="color:rgba(255,255,255,0.6);margin:8px 0 0;font-size:14px;">Enterprise Intelligence Platform</p>
    </div>
    <div style="padding:40px;">
      <h2 style="color:#0f172a;font-size:22px;margin:0 0 8px;">Welcome, {name}! 🎉</h2>
      <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 32px;">
        Your subscription is confirmed. Below are your workspace credentials. Keep them safe.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;">
        <div style="margin-bottom:16px;">
          <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">PLAN ACTIVATED</div>
          <div style="display:inline-block;padding:4px 12px;background:{color}20;color:{color};border-radius:100px;font-size:13px;font-weight:800;border:1px solid {color}40;">{plan.upper()}</div>
        </div>
        <div style="margin-bottom:16px;">
          <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">YOUR USER ID</div>
          <div style="font-size:22px;font-weight:900;color:#0f172a;font-family:monospace;">{user_id}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">TEMPORARY PASSWORD</div>
          <div style="font-size:22px;font-weight:900;color:#3b82f6;font-family:monospace;">{password}</div>
        </div>
      </div>
      <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0 0 24px;">
        ⚠️ Please change your password after your first login using the Forgot Password option.
      </p>
      <a href="http://localhost:5173" style="display:block;text-align:center;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;padding:16px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
        🚀 Access Your Dashboard
      </a>
    </div>
    <div style="padding:24px 40px;text-align:center;border-top:1px solid #f1f5f9;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">© 2026 SellerIQ Pro · support@selleriq.pro</p>
    </div>
  </div>
</body>
</html>
"""

def reset_password_email_html(name, new_password):
    return f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Inter',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:900;letter-spacing:-1px;">SellerIQ <span style="color:#60a5fa;">Pro</span></h1>
    </div>
    <div style="padding:40px;">
      <h2 style="color:#0f172a;font-size:22px;margin:0 0 8px;">Password Reset, {name}</h2>
      <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 32px;">
        Your password has been reset. Use the temporary password below to log in.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;">
        <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">NEW TEMPORARY PASSWORD</div>
        <div style="font-size:28px;font-weight:900;color:#3b82f6;font-family:monospace;">{new_password}</div>
      </div>
      <p style="color:#64748b;font-size:13px;">If you did not request this, please contact support immediately.</p>
    </div>
  </div>
</body>
</html>
"""

# ── Pydantic Models ────────────────────────────────────────────────────────────
class PaymentRequest(BaseModel):
    amount: int
    currency: str = "INR"

class CompletePaymentRequest(BaseModel):
    payment_id: str
    plan: str
    name: str
    phone: str
    email: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

# ── Data helpers ───────────────────────────────────────────────────────────────
def is_float(value):
    try:
        float(value)
        return True
    except ValueError:
        return False

def calculate_forecasts(daily_sales):
    if not daily_sales: return 0, 0, 0
    df = pd.DataFrame(daily_sales)
    avg_daily = df['revenue'].mean()
    return round(avg_daily * 7, 2), round(avg_daily * 30, 2), round(avg_daily * 90, 2)

def process_data(rows):
    shipments = []
    returns = []
    for r in rows:
        ttype = str(r.get("Transaction Type", "") or "").lower()
        desc = str(r.get("Item Description", "") or "").lower()
        if ttype == "shipment" or ttype == "sale" or "order" in ttype:
            shipments.append(r)
        if "return" in ttype or "refund" in ttype or "adjustment" in ttype or "refund" in desc or "returned" in desc:
            returns.append(r)

    byDate = {}
    for r in shipments:
        d = r.get("Invoice Date")
        if not d: continue
        if d not in byDate:
            byDate[d] = {"date": d, "revenue": 0, "orders": 0, "units": 0}
        byDate[d]["revenue"] += r.get("Invoice Amount") or 0
        byDate[d]["orders"] += 1
        byDate[d]["units"] += r.get("Quantity") or 0

    dailySales = sorted(list(byDate.values()), key=lambda x: x["date"])

    byWeek = {}
    for d in dailySales:
        try:
            parts = d["date"].replace('/', '-').split('-')
            dt = datetime(int(parts[0]), int(parts[1]), int(parts[2])) if len(parts[0]) == 4 else datetime(int(parts[2]), int(parts[1]), int(parts[0]))
            week = f"W{math.ceil(dt.day / 7)}-{dt.strftime('%b')}"
        except:
            week = "W-Unknown"
        if week not in byWeek:
            byWeek[week] = {"week": week, "revenue": 0, "orders": 0, "units": 0}
        byWeek[week]["revenue"] += d["revenue"]
        byWeek[week]["orders"] += d["orders"]
        byWeek[week]["units"] += d["units"]
    weeklySales = list(byWeek.values())[-12:]

    byMonth = {}
    for d in dailySales:
        try:
            parts = d["date"].replace('/', '-').split('-')
            dt = datetime(int(parts[0]), int(parts[1]), int(parts[2])) if len(parts[0]) == 4 else datetime(int(parts[2]), int(parts[1]), int(parts[0]))
            month = dt.strftime("%b '%y")
        except:
            month = "Unknown"
        if month not in byMonth:
            byMonth[month] = {"month": month, "revenue": 0, "orders": 0, "units": 0}
        byMonth[month]["revenue"] += d["revenue"]
        byMonth[month]["orders"] += d["orders"]
        byMonth[month]["units"] += d["units"]
    monthlySales = list(byMonth.values())

    bySku = {}
    for r in shipments:
        sku = r.get("Sku") or "UNKNOWN"
        if sku not in bySku:
            bySku[sku] = {"sku": sku, "desc": r.get("Item Description") or sku, "revenue": 0, "units": 0, "orders": 0, "principal": 0}
        bySku[sku]["revenue"] += r.get("Invoice Amount") or 0
        bySku[sku]["units"] += r.get("Quantity") or 0
        bySku[sku]["orders"] += 1
    skuList = sorted(list(bySku.values()), key=lambda x: x["revenue"], reverse=True)

    byState = {}
    for r in shipments:
        st = r.get("Ship To State") or "Unknown"
        if st not in byState:
            byState[st] = {"state": st, "revenue": 0, "orders": 0, "units": 0, "igst": 0}
        byState[st]["revenue"] += r.get("Invoice Amount") or 0
        byState[st]["orders"] += 1
    stateList = sorted(list(byState.values()), key=lambda x: x["revenue"], reverse=True)

    tax = {
        "cgst": sum((r.get("Cgst Tax") or 0) for r in shipments),
        "sgst": sum((r.get("Sgst Tax") or 0) for r in shipments),
        "igst": sum((r.get("Igst Tax") or 0) for r in shipments),
    }
    tax["total"] = tax["cgst"] + tax["sgst"] + tax["igst"]
    taxPie = [{"name": "IGST", "value": tax["igst"]}, {"name": "CGST", "value": tax["cgst"]}, {"name": "SGST", "value": tax["sgst"]}]

    totalRevenue = sum((r.get("Invoice Amount") or 0) for r in shipments)
    totalOrders = len(shipments)
    returnCount = len(returns)
    returnRate = f"{(returnCount / totalOrders * 100):.1f}" if totalOrders else "0"
    avgOrderValue = totalRevenue / totalOrders if totalOrders else 0
    fba = len([r for r in shipments if r.get("Fulfillment Channel") == "FBA"])
    mfn = len([r for r in shipments if r.get("Fulfillment Channel") == "MFN"])
    channelData = [{"name": "FBA", "value": fba}, {"name": "MFN", "value": mfn}]

    forecast7, forecast30, forecast90 = calculate_forecasts(dailySales)
    days = len(dailySales) or 1
    skuVelocity = [{**s, "dailyVelocity": s["units"] / days} for s in skuList]
    fraud_alerts = generate_fraud_alerts(returns)

    return {
        "totalRevenue": totalRevenue, "totalOrders": totalOrders, "returnCount": returnCount,
        "returnRate": returnRate, "avgOrderValue": avgOrderValue,
        "dailySales": dailySales, "weeklySales": weeklySales, "monthlySales": monthlySales,
        "skuList": skuList, "stateList": stateList, "tax": tax, "taxPie": taxPie,
        "forecast7": forecast7, "forecast30": forecast30, "forecast90": forecast90,
        "skuVelocity": skuVelocity, "channelData": channelData, "days": days,
        "fraud": fraud_alerts
    }

# ── FastAPI App ────────────────────────────────────────────────────────────────
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Payment: create order ──────────────────────────────────────────────────────
@app.post("/api/create-payment-order")
async def create_payment_order(req: PaymentRequest):
    if not rzp_client:
        raise HTTPException(status_code=500, detail="Razorpay not configured on server")
    try:
        order_amount = req.amount * 100
        order_receipt = "order_rcptid_" + os.urandom(4).hex()
        razorpay_order = rzp_client.order.create(dict(amount=order_amount, currency=req.currency, receipt=order_receipt))
        return {"success": True, "order_id": razorpay_order['id'], "key_id": RZP_KEY_ID}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Payment: complete + create user + send email ───────────────────────────────
@app.post("/api/complete-payment")
async def complete_payment(req: CompletePaymentRequest):
    existing = find_user_by_email(req.email)
    if existing:
        # Resend credentials for existing user (plan upgrade case)
        send_email(
            req.email,
            f"SellerIQ Pro – Your {req.plan.title()} Plan is Active",
            credentials_email_html(req.name, existing["user_id"], existing["password"], req.plan)
        )
        return {"success": True, "user_id": existing["user_id"], "message": "Existing account updated"}

    # Create new user
    users = load_users()
    user_id = generate_user_id()
    # Ensure user_id is unique
    existing_ids = {u["user_id"] for u in users}
    while user_id in existing_ids:
        user_id = generate_user_id()

    password = generate_password()
    new_user = {
        "user_id": user_id,
        "name": req.name,
        "email": req.email,
        "phone": req.phone,
        "plan": req.plan,
        "password": password,
        "payment_id": req.payment_id,
        "status": "Active",
        "joined": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "lastLogin": "Never"
    }
    users.append(new_user)
    save_users(users)

    # Send welcome email
    sent = send_email(
        req.email,
        f"SellerIQ Pro – Welcome! Your {req.plan.title()} Plan Credentials",
        credentials_email_html(req.name, user_id, password, req.plan)
    )

    return {
        "success": True,
        "user_id": user_id,
        "email_sent": sent,
        "message": "Account created. Check your email for credentials."
    }

# ── Login ──────────────────────────────────────────────────────────────────────
@app.post("/api/login")
async def login(req: LoginRequest):
    user = find_user_by_email(req.email)
    if not user:
        raise HTTPException(status_code=401, detail="No account found with this email.")
    if user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Incorrect password. Use Forgot Password if needed.")
    # Update last login
    users = load_users()
    for u in users:
        if u["email"].lower() == req.email.lower():
            u["lastLogin"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    save_users(users)
    return {
        "success": True,
        "user_id": user["user_id"],
        "name": user["name"],
        "plan": user["plan"],
        "email": user["email"]
    }

# ── Forgot Password ────────────────────────────────────────────────────────────
@app.post("/api/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    users = load_users()
    user = None
    for u in users:
        if u["email"].lower() == req.email.lower():
            user = u
            break
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address.")

    new_password = generate_password()
    user["password"] = new_password
    save_users(users)

    sent = send_email(
        req.email,
        "SellerIQ Pro – Password Reset",
        reset_password_email_html(user["name"], new_password)
    )
    return {"success": True, "email_sent": sent, "message": "Reset email sent successfully."}

# ── Admin: list all users ──────────────────────────────────────────────────────
@app.get("/api/admin/users")
async def get_all_users():
    users = load_users()
    # Never expose passwords to the admin panel
    safe_users = [{k: v for k, v in u.items() if k != "password"} for u in users]
    return {"success": True, "users": safe_users}

# ── Analyze CSV ────────────────────────────────────────────────────────────────
@app.post("/api/analyze")
async def analyze_report(file: UploadFile = File(...)):
    contents = await file.read()
    f = io.StringIO(contents.decode('utf-8'))
    reader = csv.reader(f)
    try:
        headers_raw = next(reader)
    except StopIteration:
        raise HTTPException(status_code=400, detail="Empty File")

    headers = [h.strip() for h in headers_raw]
    parsed_rows = []
    for row in reader:
        while len(row) < len(headers): row.append("")
        obj = {}
        for h, val in zip(headers, row):
            val = val.strip()
            lower_h = h.lower().replace("-", "").replace("_", "").replace(" ", "")
            mapped_key = h
            if lower_h in ['city','shipcity','shiptocity','shippingcity','billcity','billtocity']: mapped_key = 'Ship To City'
            if lower_h in ['state','shipstate','shiptostate','shippingstate','billstate','billtostate','region']: mapped_key = 'Ship To State'
            if lower_h in ['postalcode','zip','zipcode','shipzip','shiptopincode','shippostalcode','pincode','billpostalcode','billtopincode']: mapped_key = 'Ship To Zip'
            if lower_h in ['orderid','ordernumber', 'id']: mapped_key = 'Order Id'
            if lower_h in ['sku','asin']: mapped_key = 'Sku'
            if lower_h in ['quantity','units']: mapped_key = 'Quantity'
            if lower_h in ['itemprice','amount', 'revenue']: mapped_key = 'Invoice Amount'
            if lower_h in ['invoicedate','date','orderdate']: mapped_key = 'Invoice Date'
            if not val: obj[mapped_key] = None
            elif is_float(val) and lower_h not in ['orderid','shipzip','pincode']: obj[mapped_key] = float(val)
            else: obj[mapped_key] = val
        parsed_rows.append(obj)

    analysis = process_data(parsed_rows)
    return {"success": True, "rawData": parsed_rows, "analysis": analysis}

@app.get("/api/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
