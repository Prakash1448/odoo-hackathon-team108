from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import uuid

class SalesRequest(Base):
    __tablename__ = "sales_requests"
    
    id = Column(String(50), primary_key=True, default=lambda: f"REQ-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:8]}")
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False, index=True)
    salesperson_id = Column(String(36), ForeignKey("salespersons.id"), nullable=True, index=True)
    request_title = Column(String(255), nullable=False)
    product_requirement = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    specifications = Column(Text, nullable=True)
    additional_notes = Column(Text, nullable=True)
    expected_delivery_date = Column(String(50), nullable=True)
    status = Column(String(50), default="Submitted", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    customer = relationship("Customer", back_populates="sales_requests")
    salesperson = relationship("Salesperson", back_populates="sales_requests")
    quotations = relationship("Quotation", back_populates="sales_request")
    
    def __repr__(self):
        return f"<SalesRequest {self.id}>"
