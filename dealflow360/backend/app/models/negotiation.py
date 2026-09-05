from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class NegotiationLog(Base):
    __tablename__ = "negotiation_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    quote_id = Column(String(50), ForeignKey("quotes.id"), nullable=False)
    sender_type = Column(String(50), nullable=False)  # 'Customer', 'Sales Rep', 'Sales Manager'
    sender_name = Column(String(100), nullable=False)
    message = Column(Text, nullable=True)
    proposed_discount = Column(Numeric(5, 2), nullable=True)
    proposed_amount = Column(Numeric(12, 2), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    quote = relationship("Quote", back_populates="negotiation_logs")
