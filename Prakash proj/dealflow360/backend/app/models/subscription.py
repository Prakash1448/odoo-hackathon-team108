from sqlalchemy import Column, String, Numeric, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(50), primary_key=True, index=True)
    order_id = Column(String(50), ForeignKey("orders.id"), nullable=True)
    customer_id = Column(String(50), ForeignKey("customers.id"), nullable=False)
    product_id = Column(String(50), ForeignKey("products.id"), nullable=True)
    plan_name = Column(String(150), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    amount = Column(Numeric(12, 2), nullable=False)
    billing_frequency = Column(String(50), nullable=False, default="Monthly")  # 'Monthly', 'Quarterly', 'Yearly'
    start_date = Column(DateTime, nullable=False)
    next_billing_date = Column(DateTime, nullable=False)
    status = Column(String(50), nullable=False, default="Active")  # 'Active', 'Modified', 'Cancelled'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    order = relationship("Order", back_populates="subscriptions")
    customer = relationship("Customer")
    product = relationship("Product")
