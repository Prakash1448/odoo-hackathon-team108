from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.subscription import Subscription
from app.models.invoice import Invoice
from app.schemas.billing import (
    SubscriptionResponse, SubscriptionModifyRequest,
    InvoiceResponse, InvoiceItemResponse
)
from app.services.billing_service import BillingService
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User
from datetime import datetime

router = APIRouter(prefix="/api", tags=["Billing & Subscriptions"])

def format_sub_response(s: Subscription) -> dict:
    return {
        "id": s.id,
        "orderId": s.order_id,
        "customer": s.customer.name if s.customer else "Unknown",
        "customerId": s.customer_id,
        "plan": s.plan_name,
        "quantity": s.quantity,
        "amount": float(s.amount),
        "billingFrequency": s.billing_frequency,
        "startDate": s.start_date.isoformat(),
        "nextBillingDate": s.next_billing_date.isoformat(),
        "status": s.status
    }

def format_inv_response(inv: Invoice) -> dict:
    items = []
    for ii in inv.items:
        items.append({
            "id": ii.id,
            "description": ii.description,
            "quantity": ii.quantity,
            "unitPrice": float(ii.unit_price),
            "amount": float(ii.amount),
            "isProrated": ii.is_prorated
        })
    return {
        "id": inv.id,
        "orderId": inv.order_id,
        "quoteId": inv.quote_id,
        "customer": inv.customer.name if inv.customer else "Unknown",
        "customerId": inv.customer_id,
        "subtotal": float(inv.subtotal),
        "tax": float(inv.tax),
        "amount": float(inv.amount),
        "status": inv.status,
        "issueDate": inv.issue_date.isoformat(),
        "dueDate": inv.due_date.isoformat(),
        "items": items
    }

# ==================== SUBSCRIPTIONS ====================
@router.get("/subscriptions", response_model=List[SubscriptionResponse])
def get_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["sales-rep", "finance", "admin", "customer"]))
):
    query = db.query(Subscription)
    if current_user.role == "customer":
        query = query.filter(
            (Subscription.customer_id == current_user.id) |
            (Subscription.customer.has(name=current_user.company))
        )
    return [format_sub_response(s) for s in query.order_by(Subscription.created_at.desc()).all()]

@router.post("/subscriptions/{id}/modify", response_model=SubscriptionResponse)
def modify_subscription(
    id: str,
    request: SubscriptionModifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["sales-rep", "finance", "admin"]))
):
    sub = BillingService.modify_subscription_with_proration(db, id, request.quantity)
    return format_sub_response(sub)

@router.post("/subscriptions/{id}/cancel", response_model=SubscriptionResponse)
def cancel_subscription(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["sales-rep", "finance", "admin"]))
):
    sub = db.query(Subscription).filter(Subscription.id == id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    sub.status = "Cancelled"
    db.commit()
    return format_sub_response(sub)

# ==================== INVOICES ====================
@router.get("/invoices", response_model=List[InvoiceResponse])
def get_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["sales-rep", "finance", "admin", "customer"]))
):
    query = db.query(Invoice)
    if current_user.role == "customer":
        query = query.filter(
            (Invoice.customer_id == current_user.id) |
            (Invoice.customer.has(name=current_user.company))
        )
    return [format_inv_response(inv) for inv in query.order_by(Invoice.issue_date.desc()).all()]

@router.get("/invoices/{id}", response_model=InvoiceResponse)
def get_invoice(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Invoice).filter(Invoice.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if current_user.role == "customer":
        if inv.customer and inv.customer.name != current_user.company and inv.customer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized")
    return format_inv_response(inv)

@router.post("/invoices/{id}/pay")
def pay_invoice(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Invoice).filter(Invoice.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv.status = "Paid"
    inv.paid_at = datetime.utcnow()
    db.commit()
    return {"success": True, "message": f"Invoice {inv.id} paid successfully", "status": "Paid"}
