from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from decimal import Decimal

from app.database.session import get_db
from app.models.quote import Quote
from app.models.customer import Customer
from app.schemas.quote import QuoteResponse, QuoteCreateRequest
from app.services.quote_service import QuoteService
from app.core.dependencies import get_current_user, get_optional_current_user
from app.models.user import User

router = APIRouter(prefix="/api/quotes", tags=["Quotations"])

def format_quote_response(q: Quote) -> dict:
    lines = []
    for item in q.items:
        lines.append({
            "id": item.id,
            "productId": item.product_id,
            "productName": item.product.name if item.product else item.product_id,
            "category": item.product.category if item.product else "Hardware",
            "quantity": item.quantity,
            "unitPrice": float(item.unit_price),
            "unitCost": float(item.unit_cost),
            "discount": float(item.discount),
            "lineTotal": float(item.line_total),
            "lineMargin": float(item.line_margin),
            "product": {
                "id": item.product.id,
                "name": item.product.name,
                "category": item.product.category,
                "price": float(item.product.price),
                "cost": float(item.product.cost),
                "maxDiscount": float(item.product.max_discount)
            } if item.product else None
        })

    negotiation_logs = []
    for n in q.negotiation_logs:
        negotiation_logs.append({
            "sender": n.sender_name,
            "message": n.message,
            "proposedDiscount": float(n.proposed_discount) if n.proposed_discount else None,
            "proposedAmount": float(n.proposed_amount) if n.proposed_amount else None,
            "date": n.created_at.isoformat()
        })

    return {
        "id": q.id,
        "customerId": q.customer_id,
        "customer": q.customer.name if q.customer else "Unknown",
        "owner": q.owner.name if q.owner else "Sales Rep",
        "subtotal": float(q.subtotal),
        "discount": float(q.discount),
        "discountAmount": float(q.discount_amount),
        "amount": float(q.amount),
        "cost": float(q.cost),
        "margin": float(q.margin),
        "risk": q.risk,
        "riskScore": q.risk_score,
        "status": q.status,
        "rejectionReason": q.rejection_reason,
        "customerProposedDiscount": float(q.customer_proposed_discount) if q.customer_proposed_discount else None,
        "lines": lines,
        "createdAt": q.created_at.isoformat(),
        "updatedAt": q.updated_at.isoformat(),
        "negotiationLog": negotiation_logs
    }

@router.get("", response_model=List[QuoteResponse])
def get_quotes(db: Session = Depends(get_db)):
    quotes = db.query(Quote).order_by(Quote.created_at.desc()).all()
    return [format_quote_response(q) for q in quotes]

@router.get("/{id}", response_model=QuoteResponse)
def get_quote(id: str, db: Session = Depends(get_db)):
    q = db.query(Quote).filter(Quote.id == id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return format_quote_response(q)

@router.post("", response_model=QuoteResponse)
def create_or_update_quote(
    request: QuoteCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quote = QuoteService.create_or_update_quote(db, request.dict(), current_user)
    return format_quote_response(quote)

@router.post("/risk-preview")
def evaluate_risk_preview(
    payload: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Evaluates discount risk live for frontend QuotationBuilder.
    Authoritative evaluation in backend.
    """
    amount = Decimal(str(payload.get("amount", 0.0)))
    discount_pct = Decimal(str(payload.get("discount", 0.0)))
    customer_id = payload.get("customerId") or payload.get("customer")

    customer = None
    if customer_id:
        customer = db.query(Customer).filter((Customer.id == customer_id) | (Customer.name == customer_id)).first()

    if not customer:
        customer = db.query(Customer).first()

    eval_result = QuoteService.evaluate_approval_rules(
        db, customer, discount_pct, Decimal("25.00"), amount
    )

    action = "Managerial Approval Required" if eval_result["is_approval_required"] else ("Proceed with caution" if eval_result["risk_score"] > 20 else "Safe to proceed")

    return {
        "type": "DiscountRisk",
        "score": eval_result["risk_score"],
        "level": eval_result["risk_level"],
        "isApprovalRequired": eval_result["is_approval_required"],
        "reasons": eval_result["reasons"] or ["Standard pricing rules applied."],
        "action": action
    }

@router.post("/{quote_id}/add-upsell")
def add_upsell_product_to_quote(
    quote_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a recommended upsell product to an approved/negotiated quote.
    Recalculates totals and re-evaluates approval if threshold exceeded.
    Used after manager approves negotiation and upsell recommendations appear.
    """
    product_id = payload.get("productId") or payload.get("product_id")
    quantity = payload.get("quantity", 1)

    if not product_id:
        raise HTTPException(status_code=400, detail="productId is required")

    result = QuoteService.add_upsell_product_to_quote(db, quote_id, product_id, quantity)
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    
    return {
        "success": result["success"],
        "message": result["message"],
        "quote": format_quote_response(quote)
    }
