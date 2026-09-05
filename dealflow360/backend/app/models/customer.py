from sqlalchemy import Column, String, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class CustomerTier(Base):
    __tablename__ = "customer_tiers"

    id = Column(String(50), primary_key=True)  # Enterprise, Mid-Market, SMB
    name = Column(String(100), nullable=False)
    hardware_discount_limit = Column(Numeric(5, 2), nullable=False, default=15.00)
    services_discount_limit = Column(Numeric(5, 2), nullable=False, default=10.00)
    subscriptions_discount_limit = Column(Numeric(5, 2), nullable=False, default=20.00)
    max_auto_approval_discount = Column(Numeric(5, 2), nullable=False, default=15.00)

    customers = relationship("Customer", back_populates="tier")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    tier_id = Column(String(50), ForeignKey("customer_tiers.id"), nullable=False)
    contact_name = Column(String(100), nullable=False)
    contact_email = Column(String(150), nullable=False)
    billing_address = Column(Text, nullable=True)
    shipping_address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tier = relationship("CustomerTier", back_populates="customers")
    quotes = relationship("Quote", back_populates="customer")
    orders = relationship("Order", back_populates="customer")
