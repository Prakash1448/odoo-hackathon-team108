from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from datetime import datetime

from app.core.database import get_db
from app.dependencies.auth import get_current_manager
from app.models.discount_request import DiscountRequest
from app.models.quotation import Quotation
from app.models.sales_request import SalesRequest
from app.models.customer import Customer
from app.models.salesperson import Salesperson
from app.schemas.manager import (
    ManagerDashboardResponse, ManagerDiscountRequestResponse, 
    DetailedDiscountRequestResponse, ManagerApprovalRequest,
    ManagerRejectionRequest, ManagerCounterOfferRequest
)
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/manager", tags=["manager"])

# ==================== DASHBOARD ====================

@router.get("/dashboard", response_model=ManagerDashboardResponse)
def get_manager_dashboard(
    current: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Get manager dashboard with approval metrics"""
    
    # Total discount requests requiring manager approval
    total_approval_requests = db.query(DiscountRequest).filter(
        DiscountRequest.requires_manager_approval == True
    ).count()
    
    # Pending approvals
    pending_approvals = db.query(DiscountRequest).filter(
        DiscountRequest.requires_manager_approval == True,
        DiscountRequest.status.in_(["Pending Review", "Requires Manager Approval"])
    ).count()
    
    # Approved today
    today = datetime.utcnow().date()
    approved_today = db.query(DiscountRequest).filter(
        DiscountRequest.manager_approval_status == "APPROVED",
        func.date(DiscountRequest.updated_at) == today
    ).count()
    
    # Rejected today
    rejected_today = db.query(DiscountRequest).filter(
        DiscountRequest.manager_approval_status == "REJECTED",
        func.date(DiscountRequest.updated_at) == today
    ).count()
    
    # Awaiting manager approvals
    awaiting_manager = db.query(DiscountRequest).filter(
        DiscountRequest.requires_manager_approval == True,
        DiscountRequest.manager_approval_status.is_(None)
    ).count()
    
    return ManagerDashboardResponse(
        totalApprovalRequests=total_approval_requests,
        pendingApprovals=pending_approvals,
        approvedToday=approved_today,
        rejectedToday=rejected_today,
        awaitingManagerApprovals=awaiting_manager
    )

# ==================== DISCOUNT REQUESTS ====================

@router.get("/discount-requests", response_model=list)
def get_manager_discount_requests(
    current: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Get all discount requests requiring manager approval"""
    
    discount_requests = db.query(DiscountRequest).filter(
        DiscountRequest.requires_manager_approval == True
    ).all()
    
    result = []
    for dr in discount_requests:
        result.append({
            "id": dr.id,
            "quotationId": dr.quotation_id,
            "quotationNumber": None,
            "customer": None,
            "salesperson": None,
            "requestedDiscount": float(dr.requested_discount_percent),
            "currentDiscount": float(dr.current_discount_percent) if dr.current_discount_percent else 0,
            "reason": dr.reason,
            "status": dr.status,
            "createdAt": dr.created_at.isoformat() if dr.created_at else None
        })
    
    return result

@router.get("/discount-requests/{discount_request_id}", response_model=dict)
def get_manager_discount_request_detail(
    discount_request_id: str,
    current: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Get details of a specific discount request"""
    
    discount_req = db.query(DiscountRequest).filter(
        DiscountRequest.id == discount_request_id,
        DiscountRequest.requires_manager_approval == True
    ).first()
    
    if not discount_req:
        raise HTTPException(status_code=404, detail="Discount request not found")
    
    quotation = db.query(Quotation).filter(Quotation.id == discount_req.quotation_id).first()
    customer = db.query(Customer).filter(Customer.id == discount_req.customer_id).first()
    salesperson = db.query(Salesperson).filter(Salesperson.id == discount_req.salesperson_id).first()
    
    quotation_details = None
    if quotation:
        line_items = []
        for item in quotation.line_items:
            line_items.append({
                "product": item.product_name,
                "quantity": item.quantity,
                "unitPrice": str(item.unit_price),
                "subtotal": str(item.subtotal)
            })
        
        quotation_details = {
            "quotationNumber": quotation.quotation_number,
            "total": str(quotation.total_amount),
            "lineItems": line_items
        }
    
    return {
        "id": discount_req.id,
        "quotationNumber": quotation.quotation_number if quotation else "",
        "customer": customer.full_name if customer else "",
        "customerEmail": customer.email if customer else "",
        "salesperson": salesperson.full_name if salesperson else "",
        "salespersonEmail": salesperson.email if salesperson else "",
        "currentDiscount": float(discount_req.current_discount_percent) if discount_req.current_discount_percent else 0,
        "requestedDiscount": float(discount_req.requested_discount_percent),
        "reason": discount_req.reason,
        "salespersonResponse": discount_req.salesperson_response,
        "quotationDetails": quotation_details,
        "status": discount_req.status,
        "createdAt": discount_req.created_at.isoformat() if discount_req.created_at else None
    }

@router.post("/discount-requests/{discount_request_id}/approve", response_model=MessageResponse)
def approve_discount_request(
    discount_request_id: str,
    request_data: ManagerApprovalRequest,
    current: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Approve a discount request"""
    manager_id = current["manager_id"]
    
    discount_req = db.query(DiscountRequest).filter(
        DiscountRequest.id == discount_request_id,
        DiscountRequest.requires_manager_approval == True
    ).first()
    
    if not discount_req:
        raise HTTPException(status_code=404, detail="Discount request not found")
    
    try:
        discount_req.manager_id = manager_id
        discount_req.manager_approval_status = "APPROVED"
        discount_req.status = "Approved"
        discount_req.manager_response = request_data.response
        
        # Update quotation if needed
        quotation = db.query(Quotation).filter(Quotation.id == discount_req.quotation_id).first()
        if quotation and discount_req.requested_discount_percent > quotation.discount_percent:
            quotation.final_discount_percent = discount_req.requested_discount_percent
            quotation.quotation_status = "Awaiting Customer Response"
        
        db.commit()
        return MessageResponse(message="Discount request approved")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to approve discount request")

@router.post("/discount-requests/{discount_request_id}/reject", response_model=MessageResponse)
def reject_discount_request(
    discount_request_id: str,
    request_data: ManagerRejectionRequest,
    current: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Reject a discount request"""
    manager_id = current["manager_id"]
    
    discount_req = db.query(DiscountRequest).filter(
        DiscountRequest.id == discount_request_id,
        DiscountRequest.requires_manager_approval == True
    ).first()
    
    if not discount_req:
        raise HTTPException(status_code=404, detail="Discount request not found")
    
    try:
        discount_req.manager_id = manager_id
        discount_req.manager_approval_status = "REJECTED"
        discount_req.status = "Rejected"
        discount_req.manager_response = request_data.response
        db.commit()
        return MessageResponse(message="Discount request rejected")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to reject discount request")

@router.post("/discount-requests/{discount_request_id}/counter-offer", response_model=MessageResponse)
def counter_offer_discount_request(
    discount_request_id: str,
    request_data: ManagerCounterOfferRequest,
    current: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Submit counter-offer for a discount request"""
    manager_id = current["manager_id"]
    
    discount_req = db.query(DiscountRequest).filter(
        DiscountRequest.id == discount_request_id,
        DiscountRequest.requires_manager_approval == True
    ).first()
    
    if not discount_req:
        raise HTTPException(status_code=404, detail="Discount request not found")
    
    try:
        discount_req.manager_id = manager_id
        discount_req.counter_offer_discount_percent = Decimal(str(request_data.counterOfferDiscount))
        discount_req.manager_response = request_data.response
        discount_req.status = "Counter Offer"
        db.commit()
        return MessageResponse(message="Counter-offer submitted")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to submit counter-offer")
