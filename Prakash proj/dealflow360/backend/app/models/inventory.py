from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(String(50), primary_key=True)  # 'Warehouse A', 'Warehouse B'
    name = Column(String(100), nullable=False)
    code = Column(String(20), nullable=False)
    location = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)

    inventory_items = relationship("Inventory", back_populates="warehouse")

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, autoincrement=True)
    warehouse_id = Column(String(50), ForeignKey("warehouses.id"), nullable=False)
    product_id = Column(String(50), ForeignKey("products.id"), nullable=False)
    quantity_available = Column(Integer, nullable=False, default=0)
    quantity_reserved = Column(Integer, nullable=False, default=0)

    __table_args__ = (UniqueConstraint('warehouse_id', 'product_id', name='uk_warehouse_product'),)

    warehouse = relationship("Warehouse", back_populates="inventory_items")
    product = relationship("Product")

class InventoryAllocation(Base):
    __tablename__ = "inventory_allocations"

    id = Column(String(50), primary_key=True, index=True)
    order_id = Column(String(50), ForeignKey("orders.id"), nullable=False)
    product_id = Column(String(50), ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(String(50), ForeignKey("warehouses.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    is_manual_override = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="allocations")
    product = relationship("Product")
    warehouse = relationship("Warehouse")
