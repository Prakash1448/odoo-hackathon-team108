from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database.session import get_db
from app.models.product import Product
from app.schemas.product import ProductResponse, ProductCreate, ProductUpdate
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User

router = APIRouter(prefix="/api/products", tags=["Products"])

@router.get("", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.status == "Active").all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "price": float(p.price),
            "cost": float(p.cost),
            "maxDiscount": float(p.max_discount),
            "billingFrequency": p.billing_frequency,
            "status": p.status
        }
        for p in products
    ]

@router.get("/{id}", response_model=ProductResponse)
def get_product(id: str, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": p.id,
        "name": p.name,
        "category": p.category,
        "price": float(p.price),
        "cost": float(p.cost),
        "maxDiscount": float(p.max_discount),
        "billingFrequency": p.billing_frequency,
        "status": p.status
    }

@router.post("", response_model=ProductResponse)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    prod_id = f"p-{uuid.uuid4().hex[:4]}"
    p = Product(
        id=prod_id,
        name=product_in.name,
        category=product_in.category,
        price=product_in.price,
        cost=product_in.cost,
        max_discount=product_in.maxDiscount,
        billing_frequency=product_in.billingFrequency,
        status=product_in.status or "Active"
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return {
        "id": p.id,
        "name": p.name,
        "category": p.category,
        "price": float(p.price),
        "cost": float(p.cost),
        "maxDiscount": float(p.max_discount),
        "billingFrequency": p.billing_frequency,
        "status": p.status
    }

@router.put("/{id}", response_model=ProductResponse)
def update_product(
    id: str,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    p = db.query(Product).filter(Product.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_in.dict(exclude_unset=True)
    if "maxDiscount" in update_data:
        p.max_discount = update_data.pop("maxDiscount")
    if "billingFrequency" in update_data:
        p.billing_frequency = update_data.pop("billingFrequency")
    for field, val in update_data.items():
        setattr(p, field, val)

    db.commit()
    db.refresh(p)
    return {
        "id": p.id,
        "name": p.name,
        "category": p.category,
        "price": float(p.price),
        "cost": float(p.cost),
        "maxDiscount": float(p.max_discount),
        "billingFrequency": p.billing_frequency,
        "status": p.status
    }
