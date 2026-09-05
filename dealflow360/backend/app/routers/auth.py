from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.core.security import verify_password, create_access_token
from app.core.dependencies import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Development test accounts - for local testing only!
DEV_ACCOUNTS = {
    "admin@dealflow360.com": {
        "password": "admin123",
        "id": "dev-admin-001",
        "name": "Admin User",
        "role": "admin",
        "role_name": "Administrator",
        "company": "DealFlow360",
        "avatar": "A"
    },
    "manager@dealflow360.com": {
        "password": "manager123",
        "id": "dev-manager-001",
        "name": "Sales Manager",
        "role": "sales-manager",
        "role_name": "Sales Manager",
        "company": "DealFlow360",
        "avatar": "M"
    },
    "salesman@dealflow360.com": {
        "password": "salesman123",
        "id": "dev-salesman-001",
        "name": "Sales Representative",
        "role": "sales-rep",
        "role_name": "Sales Representative",
        "company": "DealFlow360",
        "avatar": "S"
    },
    "finance@dealflow360.com": {
        "password": "finance123",
        "id": "dev-finance-001",
        "name": "Finance Team",
        "role": "finance",
        "role_name": "Finance",
        "company": "DealFlow360",
        "avatar": "F"
    },
    "customer@dealflow360.com": {
        "password": "customer123",
        "id": "dev-customer-001",
        "name": "Customer Portal",
        "role": "customer",
        "role_name": "Customer",
        "company": "Acme Corp",
        "avatar": "C"
    }
}

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    try:
        logger.info(f"Login attempt for email: {request.email}")
        user = db.query(User).filter(User.email == request.email).first()
        
        if user:
            logger.info(f"User found in database: {user.email}")
            # Verify password with bcrypt
            if not verify_password(request.password, user.hashed_password):
                # Demo fallback for local development
                if request.password != "password":
                    logger.warning(f"Password verification failed for: {request.email}")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid email or password"
                    )
            
            logger.info(f"Password verified for: {request.email}")
            access_token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "role": user.role,
                    "roleName": user.role_name,
                    "company": user.company,
                    "avatar": user.avatar
                }
            }
        else:
            # Development fallback: check dev accounts
            logger.info(f"User not in database, checking dev accounts")
            if request.email in DEV_ACCOUNTS:
                dev_account = DEV_ACCOUNTS[request.email]
                if request.password == dev_account["password"]:
                    logger.info(f"Dev account authenticated: {request.email}")
                    access_token = create_access_token(data={"sub": dev_account["id"], "email": request.email, "role": dev_account["role"]})
                    
                    return {
                        "access_token": access_token,
                        "token_type": "bearer",
                        "user": {
                            "id": dev_account["id"],
                            "name": dev_account["name"],
                            "email": request.email,
                            "role": dev_account["role"],
                            "roleName": dev_account["role_name"],
                            "company": dev_account["company"],
                            "avatar": dev_account["avatar"]
                        }
                    }
            
            logger.warning(f"Invalid credentials for: {request.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "roleName": current_user.role_name,
        "company": current_user.company,
        "avatar": current_user.avatar
    }
