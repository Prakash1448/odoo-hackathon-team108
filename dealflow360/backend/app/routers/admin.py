from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime

from app.database.session import get_db
from app.models.rules import UpsellRule
from app.models.user import User
from app.schemas.admin import UpsellRuleResponse, UpsellRuleCreate
from app.schemas.auth import UserResponse
from app.core.dependencies import require_roles, get_current_user
from app.core.security import get_password_hash
from pydantic import BaseModel, EmailStr
from typing import Optional

router = APIRouter(prefix="/api/admin", tags=["Administration"])

# Schemas for user management
class UserCreateRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str  # 'sales-rep', 'sales-manager', 'finance', 'admin', 'customer'
    company: Optional[str] = None

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    company: Optional[str] = None
    password: Optional[str] = None

@router.get("/rules", response_model=List[UpsellRuleResponse])
def get_upsell_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "sales-manager"]))
):
    rules = db.query(UpsellRule).all()
    return [
        {
            "id": r.id,
            "triggerProduct": r.trigger_product.name if r.trigger_product else r.trigger_product_id,
            "recProduct": r.rec_product.name if r.rec_product else r.rec_product_id,
            "triggerProductId": r.trigger_product_id,
            "recProductId": r.rec_product_id,
            "type": r.type,
            "minMargin": float(r.min_margin),
            "isPromo": r.is_promo,
            "active": r.active,
            "title": r.title,
            "confidence": r.confidence
        }
        for r in rules
    ]

@router.put("/rules/{id}/toggle")
def toggle_rule(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "sales-manager"]))
):
    rule = db.query(UpsellRule).filter(UpsellRule.id == id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule.active = not rule.active
    db.commit()
    return {"success": True, "active": rule.active}

@router.post("/rules", response_model=UpsellRuleResponse)
def create_upsell_rule(
    rule_data: UpsellRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "sales-manager"]))
):
    new_rule = UpsellRule(
        id=str(uuid.uuid4()),
        trigger_product_id=rule_data.trigger_product_id,
        rec_product_id=rule_data.rec_product_id,
        type=rule_data.type or "Upsell",
        min_margin=rule_data.min_margin or 15.0,
        is_promo=rule_data.is_promo or False,
        active=True,
        title=rule_data.title,
        confidence=rule_data.confidence or 50
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    return {
        "id": new_rule.id,
        "triggerProduct": new_rule.trigger_product.name if new_rule.trigger_product else new_rule.trigger_product_id,
        "recProduct": new_rule.rec_product.name if new_rule.rec_product else new_rule.rec_product_id,
        "triggerProductId": new_rule.trigger_product_id,
        "recProductId": new_rule.rec_product_id,
        "type": new_rule.type,
        "minMargin": float(new_rule.min_margin),
        "isPromo": new_rule.is_promo,
        "active": new_rule.active,
        "title": new_rule.title,
        "confidence": new_rule.confidence
    }

@router.delete("/rules/{id}")
def delete_upsell_rule(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "sales-manager"]))
):
    rule = db.query(UpsellRule).filter(UpsellRule.id == id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return {"success": True, "message": "Rule deleted"}

@router.get("/users", response_model=List[UserResponse])
def get_admin_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "sales-manager"]))
):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "roleName": u.role_name,
            "company": u.company,
            "avatar": u.avatar
        }
        for u in users
    ]

@router.post("/users", response_model=UserResponse)
def create_user(
    user_data: UserCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "sales-manager"]))
):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate role
    valid_roles = ['sales-rep', 'sales-manager', 'finance', 'admin', 'customer']
    if user_data.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")
    
    # Create new user
    new_user = User(
        id=str(uuid.uuid4()),
        name=user_data.name,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role,
        role_name=user_data.role.replace('-', ' ').title(),
        company=user_data.company,
        avatar=user_data.name[0].upper() if user_data.name else "U",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "role": new_user.role,
        "roleName": new_user.role_name,
        "company": new_user.company,
        "avatar": new_user.avatar
    }

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    user_data: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "sales-manager"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields if provided
    if user_data.name:
        user.name = user_data.name
    if user_data.email:
        # Check if new email is already taken
        existing = db.query(User).filter(User.email == user_data.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = user_data.email
    if user_data.role:
        valid_roles = ['sales-rep', 'sales-manager', 'finance', 'admin', 'customer']
        if user_data.role not in valid_roles:
            raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")
        user.role = user_data.role
        user.role_name = user_data.role.replace('-', ' ').title()
    if user_data.company:
        user.company = user_data.company
    if user_data.password:
        user.hashed_password = get_password_hash(user_data.password)
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "roleName": user.role_name,
        "company": user.company,
        "avatar": user.avatar
    }

@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "sales-manager"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deleting yourself
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    db.delete(user)
    db.commit()
    return {"success": True, "message": "User deleted"}
