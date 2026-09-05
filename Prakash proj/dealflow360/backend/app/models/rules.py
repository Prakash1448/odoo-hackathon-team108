from sqlalchemy import Column, String, Numeric, Integer, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class ApprovalRule(Base):
    __tablename__ = "approval_rules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    customer_tier = Column(String(50), nullable=True)  # NULL means any tier
    min_discount = Column(Numeric(5, 2), nullable=False, default=0.00)
    max_discount = Column(Numeric(5, 2), nullable=False, default=100.00)
    min_amount = Column(Numeric(12, 2), nullable=False, default=0.00)
    min_margin = Column(Numeric(5, 2), nullable=True)
    required_role = Column(String(50), nullable=False)  # 'sales-manager', 'finance', 'admin'
    priority = Column(Integer, nullable=False, default=1)
    is_active = Column(Boolean, default=True)

class UpsellRule(Base):
    __tablename__ = "upsell_rules"

    id = Column(String(50), primary_key=True)
    trigger_product_id = Column(String(50), ForeignKey("products.id"), nullable=False)
    rec_product_id = Column(String(50), ForeignKey("products.id"), nullable=False)
    type = Column(String(50), nullable=False)  # 'Upsell', 'Cross-sell'
    min_margin = Column(Numeric(5, 2), nullable=False, default=15.00)
    is_promo = Column(Boolean, default=False)
    active = Column(Boolean, default=True)
    title = Column(String(150), nullable=False)
    explanation = Column(Text, nullable=True)
    confidence = Column(Integer, default=85)

    trigger_product = relationship("Product", foreign_keys=[trigger_product_id])
    rec_product = relationship("Product", foreign_keys=[rec_product_id])
