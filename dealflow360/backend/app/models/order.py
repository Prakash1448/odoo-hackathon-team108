from sqlalchemy import Column, String, Numeric, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(50), primary_key=True, index=True)
    quote_id = Column(String(50), ForeignKey("quotes.id"), nullable=False)
    customer_id = Column(String(50), ForeignKey("customers.id"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String(50), nullable=False, default="Processing")  # 'Processing', 'Warehouse Allocation', 'Partially Fulfilled', 'Shipped', 'Delivered'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    quote = relationship("Quote", back_populates="orders")
    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    allocations = relationship("InventoryAllocation", back_populates="order", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="order")
    invoices = relationship("Invoice", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String(50), primary_key=True, index=True)
    order_id = Column(String(50), ForeignKey("orders.id"), nullable=False)
    product_id = Column(String(50), ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(12, 2), nullable=False)
    line_total = Column(Numeric(12, 2), nullable=False)
    is_recurring = Column(Boolean, default=False)
    billing_frequency = Column(String(20), default="one_time")

    order = relationship("Order", back_populates="items")
    product = relationship("Product")
