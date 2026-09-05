from sqlalchemy import Column, String, Boolean, DateTime
from datetime import datetime
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, index=True)  # 'sales-rep', 'sales-manager', 'finance', 'admin', 'customer'
    role_name = Column(String(100), nullable=False)
    company = Column(String(100), nullable=True)
    avatar = Column(String(10), default="U")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
