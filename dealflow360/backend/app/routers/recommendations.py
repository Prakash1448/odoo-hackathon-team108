from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database.session import get_db
from app.services.recommendation_service import RecommendationService
from app.models.quote import Quote
from app.schemas.recommendation import RecommendationPreviewRequest, RecommendationItem

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

@router.post("/preview", response_model=List[RecommendationItem])
def preview_recommendations(
    request: RecommendationPreviewRequest,
    db: Session = Depends(get_db)
):
    """
    Outcome 2: Accepts unsaved cart items while the rep is building the quote.
    Returns live upsell & cross-sell recommendations with margin impact.
    """
    recs = RecommendationService.get_live_recommendations(
        db=db,
        cart_items=request.items,
        current_discount=request.discount or 0.0
    )
    return recs

@router.get("/quotes/{quote_id}", response_model=List[RecommendationItem])
def get_quote_saved_recommendations(quote_id: str, db: Session = Depends(get_db)):
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    items = [
        {"productId": item.product_id, "quantity": item.quantity, "discount": float(item.discount)}
        for item in quote.items
    ]
    return RecommendationService.get_live_recommendations(db, items, float(quote.discount or 0.0))

@router.get("/quotes/{quote_id}/approved", response_model=List[RecommendationItem])
def get_upsell_recommendations_for_approved_quote(quote_id: str, db: Session = Depends(get_db)):
    """
    Get upsell recommendations specifically for an APPROVED quote.
    This is part of the post-approval workflow:
    1. Manager approves negotiated discount
    2. System generates upsell recommendations
    3. Manager/Sales Rep can review and add products

    This endpoint is called after manager approval to show recommended upsells.
    """
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    # Only show recommendations for approved quotes (approved, confirmed, or pending negotiation)
    if quote.status not in ["Approved", "Under Negotiation", "Confirmed"]:
        raise HTTPException(status_code=400, detail="Recommendations only available for approved/negotiation quotes")

    items = [
        {"productId": item.product_id, "quantity": item.quantity, "discount": float(item.discount)}
        for item in quote.items
    ]
    return RecommendationService.get_live_recommendations(db, items, float(quote.discount or 0.0))

