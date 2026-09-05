from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import uuid

class Quotation(Base):
    __tablename__ = "quotations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = Column(String(50), ForeignKey("sales_requests.id"), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False, index=True)
    salesperson_id = Column(String(36), ForeignKey("salespersons.id"), nullable=False, index=True)
    quotation_status = Column(String(50), default="Draft", nullable=False)
    quotation_number = Column(String(50), unique=True, nullable=True)
    subtotal = Column(Numeric(15, 2), default=0, nullable=False)
    total_discount = Column(Numeric(15, 2), default=0, nullable=False)
    total_tax = Column(Numeric(15, 2), default=0, nullable=False)
    total_amount = Column(Numeric(15, 2), default=0, nullable=False)
    discount_percent = Column(Numeric(5, 2), default=0, nullable=False)
    final_discount_percent = Column(Numeric(5, 2), nullable=True)
    notes = Column(Text, nullable=True)
    valid_until = Column(String(50), nullable=True)
    accepted = Column(Boolean, default=False, nullable=False)
    accepted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    sales_request = relationship("SalesRequest", back_populates="quotations")
    customer = relationship("Customer", back_populates="quotations")
    salesperson = relationship("Salesperson", back_populates="quotations")
    line_items = relationship("QuotationLineItem", back_populates="quotation", cascade="all, delete-orphan")
    discount_requests = relationship("DiscountRequest", back_populates="quotation")
    
    def __repr__(self):
        return f"<Quotation {self.id}>"
