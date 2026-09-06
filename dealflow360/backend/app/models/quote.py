from sqlalchemy import Column, String, Numeric, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey, Text
from datetime import datetime
from app.database.session import Base

class Quote(Base):
    __tablename__ = "quotes"

    id = Column(String(50), primary_key=True, index=True)
    customer_id = Column(String(50), ForeignKey("customers.id"), nullable=False)
    owner_user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False, default=0.00)
    discount = Column(Numeric(5, 2), nullable=False, default=0.00)  # average discount percent
    discount_amount = Column(Numeric(12, 2), nullable=False, default=0.00)
    amount = Column(Numeric(12, 2), nullable=False, default=0.00)  # final total
    cost = Column(Numeric(12, 2), nullable=False, default=0.00)
    margin = Column(Numeric(5, 2), nullable=False, default=0.00)
    risk = Column(String(20), nullable=False, default="Low")  # 'Low', 'Moderate', 'High', 'Critical'
    risk_score = Column(Integer, nullable=False, default=10)
    status = Column(String(50), nullable=False, default="Draft")  # 'Draft', 'Pending Approval', 'Approved', 'Sent', 'Under Negotiation', 'Confirmed', 'Rejected', 'Fulfillment'
    rejection_reason = Column(Text, nullable=True)
    customer_proposed_discount = Column(Numeric(5, 2), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="quotes")
    owner = relationship("User", foreign_keys=[owner_user_id])
    items = relationship("QuoteItem", back_populates="quote", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="quote", cascade="all, delete-orphan")
    negotiation_logs = relationship("NegotiationLog", back_populates="quote", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="quote")

class QuoteItem(Base):
    __tablename__ = "quote_items"

    id = Column(String(50), primary_key=True, index=True)
    quote_id = Column(String(50), ForeignKey("quotes.id"), nullable=False)
    product_id = Column(String(50), ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(12, 2), nullable=False)
    unit_cost = Column(Numeric(12, 2), nullable=False)
    discount = Column(Numeric(5, 2), nullable=False, default=0.00)
    line_subtotal = Column(Numeric(12, 2), nullable=False)
    line_discount_amount = Column(Numeric(12, 2), nullable=False)
    line_total = Column(Numeric(12, 2), nullable=False)
    line_cost = Column(Numeric(12, 2), nullable=False)
    line_margin = Column(Numeric(5, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    quote = relationship("Quote", back_populates="items")
    product = relationship("Product")
