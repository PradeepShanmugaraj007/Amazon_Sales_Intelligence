from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True) # UUID
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    plan = Column(String, default="starter")
    monthly_uploads = Column(Integer, default=0)
    last_reset_month = Column(String)
    joined = Column(DateTime, default=datetime.utcnow)
    
    reports = relationship("Report", back_populates="owner")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(String, primary_key=True, index=True) # UUID
    user_id = Column(String, ForeignKey("users.id"))
    filename = Column(String, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    record_count = Column(Integer, default=0)
    source = Column(String) # e.g., 'amazon_mtr', 'shopify'
    analysis_results = Column(JSON) # Summary of the analysis
    
    owner = relationship("User", back_populates="reports")
    transactions = relationship("Transaction", back_populates="report", cascade="all, delete-orphan")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String, ForeignKey("reports.id"))
    
    # Normalized Amazon MTR Fields
    order_id = Column(String, index=True)
    sku = Column(String, index=True)
    quantity = Column(Float)
    revenue = Column(Float)
    tax_cgst = Column(Float, default=0)
    tax_sgst = Column(Float, default=0)
    tax_igst = Column(Float, default=0)
    invoice_date = Column(DateTime)
    ship_city = Column(String)
    ship_state = Column(String)
    ship_zip = Column(String)
    gstin = Column(String)
    fulfillment_channel = Column(String) # FBA / MFN
    
    # Custom / Raw Metadata
    raw_payload = Column(JSON)
    
    report = relationship("Report", back_populates="transactions")
