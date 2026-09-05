from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from decimal import Decimal
from datetime import datetime

from app.core.database import get_db
from app.dependencies.auth import get_current_customer
from app.models.customer import Customer
from app.models.sales_request import SalesRequest
from app.models.quotation import Quotation
from app.models.quotation_line import QuotationLineItem
from app.models.discount_request import DiscountRequest
from app.schemas.customer import (
    CreateSalesRequestRequest, SalesRequestResponse, CustomerDashboardResponse,
    CustomerProfileResponse, QuotationResponse, QuotationLineItemResponse,
    RequestDiscountRequest, QuotationSummaryResponse
)
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/customer", tags=["customer"])

# ==================== DASHBOARD ====================

@router.get("/dashboard", response_model=CustomerDashboardResponse)
def get_customer_dashboard(
    current: dict = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get customer dashboard with summary metrics"""
    customer_id = current["customer_id"]
    
    total_requests = db.query(SalesRequest).filter(SalesRequest.customer_id == customer_id).count()
    pending_requests = db.query(SalesRequest).filter(
        SalesRequest.customer_id == customer_id,
        SalesRequest.status.in_(["Submitted", "Under Review"])
    ).count()
    
    quotations = db.query(Quotation).filter(Quotation.customer_id == customer_id).all()
    quotations_received = len(quotations)
    quotations_awaiting = len([q for q in quotations if q.quotation_status == "Awaiting Customer Response" and not q.accepted])
    accepted_quotations = len([q for q in quotations if q.accepted])
    
    discount_requests = db.query(DiscountRequest).filter(
        DiscountRequest.customer_id == customer_id,
        DiscountRequest.status.in_(["Pending Review", "Requires Manager Approval"])
    ).count()
    
    return CustomerDashboardResponse(
        totalRequests=total_requests,
        pendingRequests=pending_requests,
        quotationsReceived=quotations_received,
        quotationsAwaitingAction=quotations_awaiting,
        discountRequests=discount_requests,
        acceptedQuotations=accepted_quotations
    )

# ==================== PROFILE ====================

@router.get("/profile", response_model=CustomerProfileResponse)
def get_customer_profile(
    current: dict = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get customer profile information"""
    customer = current["customer"]
    
    return CustomerProfileResponse(
        id=customer.id,
        fullName=customer.full_name,
        companyName=customer.company_name,
        email=customer.email,
        phoneNumber=customer.phone_number,
        createdAt=customer.created_at.isoformat() if customer.created_at else None,
        created_at=customer.created_at.isoformat() if customer.created_at else None
    )

# ==================== SALES REQUESTS ====================

@router.post("/requests", response_model=dict, status_code=201)
def create_sales_request(
    request_data: CreateSalesRequestRequest,
    current: dict = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Create a new sales request"""
    customer_id = current["customer_id"]
    
    try:
        sales_request = SalesRequest(
            customer_id=customer_id,
            request_title=request_data.requestTitle,
            product_requirement=request_data.productRequirement,
            quantity=request_data.quantity,
            specifications=request_data.specifications,
            additional_notes=request_data.additionalNotes,
            expected_delivery_date=request_data.expectedDeliveryDate,
            status="Submitted"
        )
        
        db.add(sales_request)
        db.commit()
        db.refresh(sales_request)
        
        return {
            "request": {
                "id": sales_request.id,
                "request_title": sales_request.request_title,
                "product_requirement": sales_request.product_requirement,
                "quantity": sales_request.quantity,
                "specifications": sales_request.specifications,
                "additional_notes": sales_request.additional_notes,
                "expected_delivery_date": sales_request.expected_delivery_date,
                "status": sales_request.status,
                "created_at": sales_request.created_at.isoformat() if sales_request.created_at else None
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create request")

@router.get("/requests", response_model=list)
def get_customer_requests(
    current: dict = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get all sales requests for customer"""
    customer_id = current["customer_id"]
    
    requests = db.query(SalesRequest).filter(SalesRequest.customer_id == customer_id).all()
    
    result = []
    for req in requests:
        result.append({
            "id": req.id,
            "request_title": req.request_title,
            "product_requirement": req.product_requirement,
            "quantity": req.quantity,
            "specifications": req.specifications,
            "additional_notes": req.additional_notes,
            "expected_delivery_date": req.expected_delivery_date,
            "status": req.status,
            "created_at": req.created_at.isoformat() if req.created_at else None,
            "createdAt": req.created_at.isoformat() if req.created_at else None
        })
    
    return result

@router.get("/requests/{request_id}", response_model=dict)
def get_customer_request_detail(
    request_id: str,
    current: dict = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get details of a specific sales request"""
    customer_id = current["customer_id"]
    
    sales_request = db.query(SalesRequest).filter(
        SalesRequest.id == request_id,
        SalesRequest.customer_id == customer_id
    ).first()
    
    if not sales_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    quotation = db.query(Quotation).filter(Quotation.request_id == request_id).first()
    
    response = {
        "id": sales_request.id,
        "request_title": sales_request.request_title,
        "product_requirement": sales_request.product_requirement,
        "quantity": sales_request.quantity,
        "specifications": sales_request.specifications,
        "additional_notes": sales_request.additional_notes,
        "expected_delivery_date": sales_request.expected_delivery_date,
        "status": sales_request.status,
        "created_at": sales_request.created_at.isoformat() if sales_request.created_at else None,
        "createdAt": sales_request.created_at.isoformat() if sales_request.created_at else None
    }
    
    if quotation:
        response["quotation"] = {
            "id": quotation.id,
            "status": quotation.quotation_status,
            "total": str(quotation.total_amount),
            "validUntil": quotation.valid_until,
            "createdAt": quotation.created_at.isoformat() if quotation.created_at else None,
            "accepted": quotation.accepted,
            "acceptedAt": quotation.accepted_at.isoformat() if quotation.accepted_at else None
        }
    
    return response

# ==================== QUOTATIONS ====================

@router.get("/quotations", response_model=list)
def get_customer_quotations(
    current: dict = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get all quotations for customer"""
    customer_id = current["customer_id"]
    
    quotations = db.query(Quotation).filter(Quotation.customer_id == customer_id).all()
    
    result = []
    for q in quotations:
        # Get associated request for title
        req = db.query(SalesRequest).filter(SalesRequest.id == q.request_id).first()
        
        result.append({
            "id": q.id,
            "requestTitle": req.request_title if req else "",
            "quantity": req.quantity if req else 0,
            "status": q.quotation_status,
            "validUntil": q.valid_until,
            "createdAt": q.created_at.isoformat() if q.created_at else None,
            "requestId": q.request_id
        })
    
    return result

@router.get("/quotations/{quotation_id}", response_model=dict)
def get_customer_quotation_detail(
    quotation_id: str,
    current: dict = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get details of a specific quotation"""
    customer_id = current["customer_id"]
    
    quotation = db.query(Quotation).filter(
        Quotation.id == quotation_id,
        Quotation.customer_id == customer_id
    ).first()
    
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    # Get line items
    line_items = db.query(QuotationLineItem).filter(QuotationLineItem.quotation_id == quotation_id).all()
    
    line_items_list = []
    for item in line_items:
        line_items_list.append({
            "product_name": item.product_name,
            "quantity": item.quantity,
            "unit_price": str(item.unit_price),
            "subtotal": str(item.subtotal),
            "discount_percent": float(item.discount_percent),
            "discount_amount": str(item.discount_amount),
            "tax_amount": str(item.tax_amount),
            "total_amount": str(item.total_amount)
        })
    
    # Get discount requests
    discount_requests_list = []
    discount_requests = db.query(DiscountRequest).filter(DiscountRequest.quotation_id == quotation_id).all()
    for dr in discount_requests:
        discount_requests_list.append({
            "id": dr.id,
            "requestedDiscount": float(dr.requested_discount_percent),
            "currentDiscount": float(dr.current_discount_percent) if dr.current_discount_percent else 0,
            "reason": dr.reason,
            "status": dr.status,
            "createdAt": dr.created_at.isoformat() if dr.created_at else None,
            "salespersonResponse": dr.salesperson_response
        })
    
    return {
        "id": quotation.id,
        "requestId": quotation.request_id,
        "status": quotation.quotation_status,
        "total": str(quotation.total_amount),
        "subtotal": str(quotation.subtotal),
        "totalDiscount": str(quotation.total_discount),
        "totalTax": str(quotation.total_tax),
        "validUntil": quotation.valid_until,
        "notes": quotation.notes,
        "accepted": quotation.accepted,
        "acceptedAt": quotation.accepted_at.isoformat() if quotation.accepted_at else None,
        "lineItems": line_items_list,
        "discountRequests": discount_requests_list
    }

@router.post("/quotations/{quotation_id}/discount-request", response_model=dict, status_code=200)
def request_quotation_discount(
    quotation_id: str,
    discount_request: RequestDiscountRequest,
    current: dict = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Request a discount on a quotation"""
    customer_id = current["customer_id"]
    
    quotation = db.query(Quotation).filter(
        Quotation.id == quotation_id,
        Quotation.customer_id == customer_id
    ).first()
    
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    try:
        disc_req = DiscountRequest(
            quotation_id=quotation_id,
            customer_id=customer_id,
            salesperson_id=quotation.salesperson_id,
            requested_discount_percent=Decimal(str(discount_request.requestedDiscountPercent)),
            current_discount_percent=quotation.discount_percent,
            reason=discount_request.reason,
            customer_message=discount_request.customerMessage,
            status="Pending Review",
            requires_manager_approval=discount_request.requestedDiscountPercent > float(quotation.salesperson.max_discount_percent)
        )
        
        db.add(disc_req)
        db.commit()
        db.refresh(disc_req)
        
        return {
            "message": "Discount request submitted",
            "discountRequest": {
                "id": disc_req.id,
                "requestedDiscount": float(disc_req.requested_discount_percent),
                "currentDiscount": float(disc_req.current_discount_percent) if disc_req.current_discount_percent else 0,
                "reason": disc_req.reason,
                "status": disc_req.status,
                "createdAt": disc_req.created_at.isoformat() if disc_req.created_at else None
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to submit discount request")

@router.post("/quotations/{quotation_id}/accept", response_model=dict)
def accept_quotation(
    quotation_id: str,
    current: dict = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Accept a quotation"""
    customer_id = current["customer_id"]
    
    quotation = db.query(Quotation).filter(
        Quotation.id == quotation_id,
        Quotation.customer_id == customer_id
    ).first()
    
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    try:
        quotation.accepted = True
        quotation.accepted_at = datetime.utcnow()
        quotation.quotation_status = "Accepted"
        
        # Update associated request status
        sales_request = db.query(SalesRequest).filter(SalesRequest.id == quotation.request_id).first()
        if sales_request:
            sales_request.status = "Accepted"
        
        db.commit()
        
        return {
            "message": "Quotation accepted successfully",
            "quotation": {
                "id": quotation.id,
                "status": quotation.quotation_status,
                "accepted": quotation.accepted,
                "acceptedAt": quotation.accepted_at.isoformat() if quotation.accepted_at else None
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to accept quotation")
