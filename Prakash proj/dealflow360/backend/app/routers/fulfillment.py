from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.order import Order
from app.schemas.fulfillment import OrderResponse, WarehouseSplitRequest
from app.services.fulfillment_service import FulfillmentService
from app.services.billing_service import BillingService
from app.core.dependencies import require_roles
from app.models.user import User

router = APIRouter(prefix="/api/fulfillment", tags=["Fulfillment"])

def format_order_response(o: Order) -> dict:
    items = []
    for oi in o.items:
        items.append({
            "id": oi.id,
            "productId": oi.product_id,
            "productName": oi.product.name if oi.product else oi.product_id,
            "category": oi.product.category if oi.product else "Hardware",
            "quantity": oi.quantity,
            "unitPrice": float(oi.unit_price),
            "lineTotal": float(oi.line_total),
            "isRecurring": oi.is_recurring,
            "billingFrequency": oi.billing_frequency,
            "product": {
                "id": oi.product.id,
                "name": oi.product.name,
                "category": oi.product.category,
                "price": float(oi.product.price),
                "cost": float(oi.product.cost)
            } if oi.product else None
        })

    splits = []
    for alloc in o.allocations:
        splits.append({
            "productId": alloc.product_id,
            "warehouse": alloc.warehouse_id,
            "quantity": alloc.quantity,
            "isManual": alloc.is_manual_override
        })

    return {
        "id": o.id,
        "quoteId": o.quote_id,
        "customer": o.customer.name if o.customer else "Unknown",
        "customerId": o.customer_id,
        "amount": float(o.amount),
        "status": o.status,
        "date": o.created_at.isoformat(),
        "items": items,
        "splits": splits
    }

@router.get("", response_model=List[OrderResponse])
def get_fulfillment_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["sales-rep", "sales-manager", "finance", "admin"]))
):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return [format_order_response(o) for o in orders]

@router.get("/{id}", response_model=OrderResponse)
def get_order_detail(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["sales-rep", "sales-manager", "finance", "admin"]))
):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return format_order_response(order)

@router.get("/{id}/auto-split")
def get_auto_split(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["sales-rep", "sales-manager", "finance", "admin"]))
):
    return FulfillmentService.get_auto_allocation_split(db, id)

@router.post("/{id}/allocate")
def apply_auto_split(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["sales-rep", "sales-manager", "finance", "admin"]))
):
    calc = FulfillmentService.get_auto_allocation_split(db, id)
    splits = []
    for prod_id, wh_map in calc["recommendedSplits"].items():
        for wh, qty in wh_map.items():
            if qty > 0:
                splits.append({"productId": prod_id, "warehouse": wh, "quantity": qty})

    return FulfillmentService.apply_warehouse_split(db, id, splits, is_manual_override=False)

@router.post("/{id}/manual-allocation")
def apply_manual_split(
    id: str,
    request: WarehouseSplitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["sales-rep", "sales-manager", "finance", "admin"]))
):
    splits = [s.dict() for s in request.splits]
    return FulfillmentService.apply_warehouse_split(db, id, splits, is_manual_override=True)

@router.post("/{id}/ship")
def ship_order(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["sales-rep", "sales-manager", "finance", "admin"]))
):
    res = FulfillmentService.ship_order(db, id)
    # Ensure billing & subscriptions are generated
    BillingService.generate_order_invoicing_and_subscriptions(db, id)
    return res
