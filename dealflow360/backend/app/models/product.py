from sqlalchemy import Column, String, Numeric, DateTime
from datetime import datetime
from app.database.session import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False, index=True)  # 'Hardware', 'Services', 'Subscriptions'
    price = Column(Numeric(12, 2), nullable=False)
    cost = Column(Numeric(12, 2), nullable=False)
    max_discount = Column(Numeric(5, 2), nullable=False, default=15.00)
    billing_frequency = Column(String(20), nullable=False, default="one_time")  # 'one_time', 'monthly', 'quarterly', 'yearly'
    status = Column(String(20), nullable=False, default="Active")  # 'Active', 'Inactive'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
