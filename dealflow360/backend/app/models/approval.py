from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(String(50), primary_key=True, index=True)
    quote_id = Column(String(50), ForeignKey("quotes.id"), nullable=False)
    requested_by_user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    required_role = Column(String(50), nullable=False)  # 'sales-manager', 'finance', 'admin'
    status = Column(String(50), nullable=False, default="Pending Approval")  # 'Pending Approval', 'Approved', 'Rejected', 'Returned'
    reason = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)
    decided_by_user_id = Column(String(50), ForeignKey("users.id"), nullable=True)
    decided_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    quote = relationship("Quote", back_populates="approvals")
    requested_by = relationship("User", foreign_keys=[requested_by_user_id])
    decided_by = relationship("User", foreign_keys=[decided_by_user_id])
