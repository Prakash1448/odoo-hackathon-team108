from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerResponse

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.get("", response_model=List[CustomerResponse])
def get_customers(db: Session = Depends(get_db)):
    customers = db.query(Customer).all()
    result = []
    for c in customers:
        tier = c.tier
        limits = {
            "Hardware": float(tier.hardware_discount_limit) if tier else 15.0,
            "Services": float(tier.services_discount_limit) if tier else 10.0,
            "Subscriptions": float(tier.subscriptions_discount_limit) if tier else 20.0
        } if tier else None

        result.append({
            "id": c.id,
            "name": c.name,
            "tier": c.tier_id,
            "contact": f"{c.contact_name} ({c.contact_email})",
            "billing": c.billing_address,
            "shipping": c.shipping_address,
            "discountLimits": limits
        })
    return result

@router.get("/{id}", response_model=CustomerResponse)
def get_customer(id: str, db: Session = Depends(get_db)):
    c = db.query(Customer).filter((Customer.id == id) | (Customer.name == id)).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    tier = c.tier
    limits = {
        "Hardware": float(tier.hardware_discount_limit) if tier else 15.0,
        "Services": float(tier.services_discount_limit) if tier else 10.0,
        "Subscriptions": float(tier.subscriptions_discount_limit) if tier else 20.0
    } if tier else None

    return {
        "id": c.id,
        "name": c.name,
        "tier": c.tier_id,
        "contact": f"{c.contact_name} ({c.contact_email})",
        "billing": c.billing_address,
        "shipping": c.shipping_address,
        "discountLimits": limits
    }
