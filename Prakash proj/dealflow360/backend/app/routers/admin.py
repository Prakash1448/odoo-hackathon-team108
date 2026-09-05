from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database.session import get_db
from app.models.rules import UpsellRule
from app.models.user import User
from app.schemas.admin import UpsellRuleResponse, UpsellRuleCreate
from app.schemas.auth import UserResponse
from app.core.dependencies import require_roles

router = APIRouter(prefix="/api/admin", tags=["Administration"])

@router.get("/rules", response_model=List[UpsellRuleResponse])
def get_upsell_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
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
    current_user: User = Depends(require_roles(["admin"]))
):
    rule = db.query(UpsellRule).filter(UpsellRule.id == id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule.active = not rule.active
    db.commit()
    return {"success": True, "active": rule.active}

@router.get("/users", response_model=List[UserResponse])
def get_admin_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
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
