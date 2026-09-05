from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from sqlalchemy.orm import Session
from typing import Optional

from app.core.security import decode_token
from app.core.database import get_db
from app.models.user import User
from app.models.customer import Customer
from app.models.salesperson import Salesperson
from app.models.sales_manager import SalesManager

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthCredentials = Depends(security)) -> dict:
    """Extract and validate JWT token from Authorization header"""
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload

def get_current_customer(
    payload: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict:
    """Get current authenticated customer"""
    if payload.get("role") != "CUSTOMER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Customer role required."
        )
    
    user_id = payload.get("sub")
    customer_id = payload.get("customer_id")
    
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Customer not found"
        )
    
    return {
        "user_id": user_id,
        "customer_id": customer_id,
        "customer": customer,
        "role": "CUSTOMER"
    }

def get_current_salesperson(
    payload: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict:
    """Get current authenticated salesperson"""
    if payload.get("role") != "SALESPERSON":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Salesperson role required."
        )
    
    user_id = payload.get("sub")
    salesperson_id = payload.get("salesperson_id")
    
    salesperson = db.query(Salesperson).filter(Salesperson.id == salesperson_id).first()
    if not salesperson:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Salesperson not found"
        )
    
    return {
        "user_id": user_id,
        "salesperson_id": salesperson_id,
        "salesperson": salesperson,
        "role": "SALESPERSON"
    }

def get_current_manager(
    payload: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict:
    """Get current authenticated manager"""
    if payload.get("role") != "SALES_MANAGER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Manager role required."
        )
    
    user_id = payload.get("sub")
    manager_id = payload.get("manager_id")
    
    manager = db.query(SalesManager).filter(SalesManager.id == manager_id).first()
    if not manager:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Manager not found"
        )
    
    return {
        "user_id": user_id,
        "manager_id": manager_id,
        "manager": manager,
        "role": "SALES_MANAGER"
    }
