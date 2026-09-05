from sqlalchemy import Column, String, DateTime, func, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    user_role = Column(String(50), nullable=False)  # CUSTOMER, SALESPERSON, SALES_MANAGER, ADMIN
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    customers = relationship("Customer", back_populates="user")
    salespersons = relationship("Salesperson", back_populates="user")
    sales_managers = relationship("SalesManager", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.email}>"
