from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.quote import Quote
from app.schemas.quote import QuoteResponse
from app.schemas.portal import CounterOfferRequest
from app.services.negotiation_service import NegotiationService
from app.routers.quotes import format_quote_response
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/portal", tags=["Customer Portal"])

@router.get("/quotes", response_model=List[QuoteResponse])
def get_customer_quotes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Quote)
    if current_user.role == "customer":
        # Strict backend authorization: filter by company name or customer email or ID
        query = query.filter(
            (Quote.customer_id == current_user.id) |
            (Quote.customer.has(name=current_user.company)) |
            (Quote.customer.has(contact_email=current_user.email))
        )
    return [format_quote_response(q) for q in query.order_by(Quote.updated_at.desc()).all()]

@router.get("/quotes/{id}", response_model=QuoteResponse)
def get_customer_quote(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quote = db.query(Quote).filter(Quote.id == id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found")
    NegotiationService.verify_customer_access(quote, current_user)
    return format_quote_response(quote)

@router.post("/quotes/{id}/negotiate")
def submit_negotiation_counter(
    id: str,
    request: CounterOfferRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return NegotiationService.submit_counter_offer(
        db=db,
        quote_id=id,
        proposed_discount=request.proposedDiscount,
        comment=request.comment,
        current_user=current_user
    )

@router.post("/quotes/{id}/confirm")
def confirm_and_accept_quote(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return NegotiationService.accept_and_confirm_quote(
        db=db,
        quote_id=id,
        current_user=current_user
    )
