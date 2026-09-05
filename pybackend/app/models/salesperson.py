from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import uuid

class Salesperson(Base):
    __tablename__ = "salespersons"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    max_discount_percent = Column(Numeric(5, 2), default=10, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="salespersons")
    sales_requests = relationship("SalesRequest", back_populates="salesperson")
    quotations = relationship("Quotation", back_populates="salesperson")
    discount_requests = relationship("DiscountRequest", back_populates="salesperson")
    
    def __repr__(self):
        return f"<Salesperson {self.full_name}>"
