from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import re

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.models.customer import Customer
from app.models.salesperson import Salesperson
from app.models.sales_manager import SalesManager
from app.schemas.auth import (
    CustomerRegisterRequest, LoginRequest, TokenResponse,
    CustomerLoginResponse, CustomerResponse, UserResponse,
    SalespersonRegisterRequest, SalespersonLoginResponse, SalespersonResponse,
    ManagerRegisterRequest, ManagerLoginResponse, ManagerResponse,
    MessageResponse
)

router = APIRouter(prefix="/auth", tags=["auth"])

# ==================== CUSTOMER AUTH ====================

def validate_password(password: str):
    """Validate password requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number"""
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
    if not re.search(r"[0-9]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number")

def validate_email_format(email: str):
    """Validate email format"""
    if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", email):
        raise HTTPException(status_code=400, detail="Invalid email format")

@router.post("/register", response_model=CustomerLoginResponse, status_code=201)
def register_customer(request: CustomerRegisterRequest, db: Session = Depends(get_db)):
    """Register a new customer"""
    
    # Validation
    if not request.fullName or not request.companyName or not request.email or not request.phoneNumber:
        raise HTTPException(status_code=400, detail="All fields are required")
    
    if request.password != request.confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    validate_password(request.password)
    validate_email_format(request.email)
    
    # Check if email already exists in users table
    existing_user = db.query(User).filter(func.lower(User.email) == func.lower(request.email)).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    # Check if email exists in customers table
    existing_customer = db.query(Customer).filter(func.lower(Customer.email) == func.lower(request.email)).first()
    if existing_customer:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    try:
        # Create user record
        password_hash = hash_password(request.password)
        user = User(
            email=request.email,
            password_hash=password_hash,
            user_role="CUSTOMER"
        )
        db.add(user)
        db.flush()  # Get the ID
        
        # Create customer record
        customer = Customer(
            user_id=user.id,
            full_name=request.fullName,
            company_name=request.companyName,
            email=request.email,
            phone_number=request.phoneNumber,
            password_hash=password_hash
        )
        db.add(customer)
        db.commit()
        
        # Generate token
        token = create_access_token({"sub": user.id, "role": "CUSTOMER", "customer_id": customer.id})
        
        return CustomerLoginResponse(
            token=token,
            access_token=token,
            token_type="bearer",
            customer=CustomerResponse(
                id=customer.id,
                fullName=customer.full_name,
                companyName=customer.company_name,
                email=customer.email,
                phoneNumber=customer.phone_number,
                role="CUSTOMER"
            ),
            user=UserResponse(
                id=user.id,
                email=user.email,
                role=user.user_role
            )
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/login", response_model=CustomerLoginResponse)
def login_customer(request: LoginRequest, db: Session = Depends(get_db)):
    """Customer login"""
    
    if not request.email or not request.password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    
    validate_email_format(request.email)
    
    # Find user with CUSTOMER role
    user = db.query(User).filter(
        func.lower(User.email) == func.lower(request.email),
        User.user_role == "CUSTOMER"
    ).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Get customer details
    customer = db.query(Customer).filter(Customer.user_id == user.id).first()
    
    if not customer:
        raise HTTPException(status_code=401, detail="Customer profile not found")
    
    token = create_access_token({"sub": user.id, "role": "CUSTOMER", "customer_id": customer.id})
    
    return CustomerLoginResponse(
        token=token,
        access_token=token,
        token_type="bearer",
        customer=CustomerResponse(
            id=customer.id,
            fullName=customer.full_name,
            companyName=customer.company_name,
            email=customer.email,
            phoneNumber=customer.phone_number
        ),
        user=UserResponse(
            id=user.id,
            email=user.email,
            role=user.user_role
        )
    )

@router.post("/logout", response_model=MessageResponse)
def logout_customer():
    """Customer logout"""
    return MessageResponse(message="Logout successful")

# ==================== SALESPERSON AUTH ====================

@router.post("/salesperson/register", response_model=SalespersonLoginResponse, status_code=201)
def register_salesperson(request: SalespersonRegisterRequest, db: Session = Depends(get_db)):
    """Register a new salesperson"""
    
    if not request.fullName or not request.email or not request.password:
        raise HTTPException(status_code=400, detail="All fields are required")
    
    if request.password != request.confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    validate_password(request.password)
    validate_email_format(request.email)
    
    # Check if email already exists
    existing_user = db.query(User).filter(func.lower(User.email) == func.lower(request.email)).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    existing_salesperson = db.query(Salesperson).filter(
        func.lower(Salesperson.email) == func.lower(request.email)
    ).first()
    if existing_salesperson:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    try:
        # Create user record
        password_hash = hash_password(request.password)
        user = User(
            email=request.email,
            password_hash=password_hash,
            user_role="SALESPERSON"
        )
        db.add(user)
        db.flush()
        
        # Create salesperson record
        salesperson = Salesperson(
            user_id=user.id,
            full_name=request.fullName,
            email=request.email,
            password_hash=password_hash,
            max_discount_percent=10
        )
        db.add(salesperson)
        db.commit()
        
        token = create_access_token({"sub": user.id, "role": "SALESPERSON", "salesperson_id": salesperson.id})
        
        return SalespersonLoginResponse(
            token=token,
            access_token=token,
            token_type="bearer",
            salesperson=SalespersonResponse(
                id=salesperson.id,
                fullName=salesperson.full_name,
                email=salesperson.email,
                role="SALESPERSON",
                maxDiscountPercent=float(salesperson.max_discount_percent)
            )
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/salesperson/login", response_model=SalespersonLoginResponse)
def login_salesperson(request: LoginRequest, db: Session = Depends(get_db)):
    """Salesperson login"""
    
    if not request.email or not request.password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    
    validate_email_format(request.email)
    
    user = db.query(User).filter(
        func.lower(User.email) == func.lower(request.email),
        User.user_role == "SALESPERSON"
    ).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    salesperson = db.query(Salesperson).filter(Salesperson.user_id == user.id).first()
    
    if not salesperson:
        raise HTTPException(status_code=401, detail="Salesperson profile not found")
    
    token = create_access_token({"sub": user.id, "role": "SALESPERSON", "salesperson_id": salesperson.id})
    
    return SalespersonLoginResponse(
        token=token,
        access_token=token,
        token_type="bearer",
        salesperson=SalespersonResponse(
            id=salesperson.id,
            fullName=salesperson.full_name,
            email=salesperson.email,
            role="SALESPERSON",
            maxDiscountPercent=float(salesperson.max_discount_percent)
        )
    )

@router.post("/salesperson/logout", response_model=MessageResponse)
def logout_salesperson():
    """Salesperson logout"""
    return MessageResponse(message="Logout successful")

# ==================== MANAGER AUTH ====================

@router.post("/manager/register", response_model=ManagerLoginResponse, status_code=201)
def register_manager(request: ManagerRegisterRequest, db: Session = Depends(get_db)):
    """Register a new manager"""
    
    if not request.fullName or not request.email or not request.password:
        raise HTTPException(status_code=400, detail="All fields are required")
    
    validate_password(request.password)
    validate_email_format(request.email)
    
    existing_user = db.query(User).filter(func.lower(User.email) == func.lower(request.email)).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    existing_manager = db.query(SalesManager).filter(
        func.lower(SalesManager.email) == func.lower(request.email)
    ).first()
    if existing_manager:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    try:
        password_hash = hash_password(request.password)
        user = User(
            email=request.email,
            password_hash=password_hash,
            user_role="SALES_MANAGER"
        )
        db.add(user)
        db.flush()
        
        manager = SalesManager(
            user_id=user.id,
            full_name=request.fullName,
            email=request.email,
            password_hash=password_hash
        )
        db.add(manager)
        db.commit()
        
        token = create_access_token({"sub": user.id, "role": "SALES_MANAGER", "manager_id": manager.id})
        
        return ManagerLoginResponse(
            token=token,
            access_token=token,
            token_type="bearer",
            manager=ManagerResponse(
                id=manager.id,
                fullName=manager.full_name,
                email=manager.email,
                role="SALES_MANAGER"
            ),
            user=UserResponse(
                id=user.id,
                email=user.email,
                role=user.user_role
            )
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/manager/login", response_model=ManagerLoginResponse)
def login_manager(request: LoginRequest, db: Session = Depends(get_db)):
    """Manager login"""
    
    if not request.email or not request.password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    
    validate_email_format(request.email)
    
    user = db.query(User).filter(
        func.lower(User.email) == func.lower(request.email),
        User.user_role == "SALES_MANAGER"
    ).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    manager = db.query(SalesManager).filter(SalesManager.user_id == user.id).first()
    
    if not manager:
        raise HTTPException(status_code=401, detail="Manager profile not found")
    
    token = create_access_token({"sub": user.id, "role": "SALES_MANAGER", "manager_id": manager.id})
    
    return ManagerLoginResponse(
        token=token,
        access_token=token,
        token_type="bearer",
        manager=ManagerResponse(
            id=manager.id,
            fullName=manager.full_name,
            email=manager.email,
            role="SALES_MANAGER"
        ),
        user=UserResponse(
            id=user.id,
            email=user.email,
            role=user.user_role
        )
    )

@router.post("/manager/logout", response_model=MessageResponse)
def logout_manager():
    """Manager logout"""
    return MessageResponse(message="Logout successful")
