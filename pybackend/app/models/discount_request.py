from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import uuid

class DiscountRequest(Base):
    __tablename__ = "discount_requests"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quotation_id = Column(String(36), ForeignKey("quotations.id"), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False, index=True)
    salesperson_id = Column(String(36), ForeignKey("salespersons.id"), nullable=False, index=True)
    requested_discount_percent = Column(Numeric(5, 2), nullable=False)
    current_discount_percent = Column(Numeric(5, 2), nullable=True)
    reason = Column(Text, nullable=False)
    customer_message = Column(Text, nullable=True)
    status = Column(String(50), default="Pending Review", nullable=False)
    requires_manager_approval = Column(Boolean, default=False, nullable=False)
    manager_id = Column(String(36), ForeignKey("sales_managers.id"), nullable=True)
    manager_approval_status = Column(String(50), nullable=True)
    manager_response = Column(Text, nullable=True)
    salesperson_response = Column(Text, nullable=True)
    counter_offer_discount_percent = Column(Numeric(5, 2), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    quotation = relationship("Quotation", back_populates="discount_requests")
    customer = relationship("Customer", back_populates="discount_requests")
    salesperson = relationship("Salesperson", back_populates="discount_requests")
    manager = relationship("SalesManager", back_populates="discount_requests")
    
    def __repr__(self):
        return f"<DiscountRequest {self.id}>"
