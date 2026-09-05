from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import uuid

class QuotationLineItem(Base):
    __tablename__ = "quotation_line_items"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quotation_id = Column(String(36), ForeignKey("quotations.id"), nullable=False, index=True)
    product_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False)
    discount_percent = Column(Numeric(5, 2), default=0, nullable=False)
    discount_amount = Column(Numeric(12, 2), default=0, nullable=False)
    tax_percent = Column(Numeric(5, 2), default=10, nullable=False)
    tax_amount = Column(Numeric(12, 2), default=0, nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    
    # Relationships
    quotation = relationship("Quotation", back_populates="line_items")
    
    def __repr__(self):
        return f"<QuotationLineItem {self.product_name}>"
