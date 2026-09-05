from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from decimal import Decimal
from datetime import datetime

from app.core.database import get_db
from app.dependencies.auth import get_current_salesperson
from app.models.salesperson import Salesperson
from app.models.sales_request import SalesRequest
from app.models.quotation import Quotation
from app.models.quotation_line import QuotationLineItem
from app.models.discount_request import DiscountRequest
from app.models.customer import Customer
from app.schemas.salesperson import (
    SalespersonDashboardResponse, CreateQuotationRequest, UpdateQuotationRequest,
    SendQuotationRequest, UpdateRequestStatusRequest, ApproveDiscountRequest,
    RejectDiscountRequest, CounterOfferDiscountRequest, UpdateDiscountRequestStatus,
    DiscountRequestResponse
)
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/salesperson", tags=["salesperson"])

# ==================== DASHBOARD ====================

@router.get("/dashboard", response_model=SalespersonDashboardResponse)
def get_salesperson_dashboard(
    current: dict = Depends(get_current_salesperson),
    db: Session = Depends(get_db)
):
    """Get salesperson dashboard with summary metrics"""
    salesperson_id = current["salesperson_id"]
    
    total_requests = db.query(SalesRequest).filter(SalesRequest.salesperson_id == salesperson_id).count()
    pending_requests = db.query(SalesRequest).filter(
        SalesRequest.salesperson_id == salesperson_id,
        SalesRequest.status.in_(["Submitted", "Under Review"])
    ).count()
    
    quotations = db.query(Quotation).filter(Quotation.salesperson_id == salesperson_id).all()
    quotations_created = len([q for q in quotations if q.quotation_status == "Draft"])
    quotations_sent = len([q for q in quotations if q.quotation_status in ["Sent", "Awaiting Customer Response"]])
    quotations_awaiting = len([q for q in quotations if q.quotation_status == "Awaiting Customer Response"])
    
    active_discounts = db.query(DiscountRequest).filter(
        DiscountRequest.salesperson_id == salesperson_id,
        DiscountRequest.status.in_(["Pending Review", "Counter Offer"])
    ).count()
    
    return SalespersonDashboardResponse(
        totalRequests=total_requests,
        pendingRequests=pending_requests,
        quotationsCreated=quotations_created,
        quotationsSent=quotations_sent,
        quotationsAwaitingAction=quotations_awaiting,
        activeDiscountRequests=active_discounts
    )

# ==================== REQUESTS ====================

@router.get("/requests", response_model=list)
def get_salesperson_requests(
    current: dict = Depends(get_current_salesperson),
    db: Session = Depends(get_db)
):
    """Get all assigned sales requests for salesperson"""
    salesperson_id = current["salesperson_id"]
    
    requests = db.query(SalesRequest).filter(SalesRequest.salesperson_id == salesperson_id).all()
    
    result = []
    for req in requests:
        customer = db.query(Customer).filter(Customer.id == req.customer_id).first()
        
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
            "createdAt": req.created_at.isoformat() if req.created_at else None,
            "customer": {
                "full_name": customer.full_name,
                "company_name": customer.company_name,
                "email": customer.email
            } if customer else None
        })
    
    return result

@router.get("/requests/{request_id}", response_model=dict)
def get_salesperson_request_detail(
    request_id: str,
    current: dict = Depends(get_current_salesperson),
    db: Session = Depends(get_db)
):
    """Get details of a specific sales request"""
    salesperson_id = current["salesperson_id"]
    
    sales_request = db.query(SalesRequest).filter(
        SalesRequest.id == request_id,
        SalesRequest.salesperson_id == salesperson_id
    ).first()
    
    if not sales_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    customer = db.query(Customer).filter(Customer.id == sales_request.customer_id).first()
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
        "createdAt": sales_request.created_at.isoformat() if sales_request.created_at else None,
        "customer": {
            "id": customer.id,
            "full_name": customer.full_name,
            "company_name": customer.company_name,
            "email": customer.email
        } if customer else None
    }
    
    if quotation:
        response["quotation"] = {
            "id": quotation.id,
            "status": quotation.quotation_status,
            "total": str(quotation.total_amount)
        }
    
    return response

@router.patch("/requests/{request_id}/status", response_model=dict)
def update_request_status(
    request_id: str,
    status_update: UpdateRequestStatusRequest,
    current: dict = Depends(get_current_salesperson),
    db: Session = Depends(get_db)
):
    """Update status of a sales request"""
    salesperson_id = current["salesperson_id"]
    
    sales_request = db.query(SalesRequest).filter(
        SalesRequest.id == request_id,
        SalesRequest.salesperson_id == salesperson_id
    ).first()
    
    if not sales_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    try:
        sales_request.status = status_update.status
        db.commit()
        
        return {
            "message": "Request status updated",
            "request": {
                "id": sales_request.id,
                "status": sales_request.status
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update request status")

# ==================== QUOTATIONS ====================

@router.post("/requests/{request_id}/quotation", response_model=dict, status_code=201)
def create_quotation(
    request_id: str,
    quotation_data: CreateQuotationRequest,
    current: dict = Depends(get_current_salesperson),
    db: Session = Depends(get_db)
):
    """Create a quotation for a sales request"""
    salesperson_id = current["salesperson_id"]
    
    sales_request = db.query(SalesRequest).filter(
        SalesRequest.id == request_id,
        SalesRequest.salesperson_id == salesperson_id
    ).first()
    
    if not sales_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    try:
        # Calculate totals
        subtotal = Decimal(0)
        for item in quotation_data.lineItems:
            subtotal += Decimal(str(item.unit_price)) * Decimal(str(item.quantity))
        
        discount_percent = Decimal(str(quotation_data.discount or 0))
        tax_percent = Decimal(str(quotation_data.taxPercent or 10))
        
        total_discount = (subtotal * discount_percent) / Decimal(100)
        subtotal_after_discount = subtotal - total_discount
        total_tax = (subtotal_after_discount * tax_percent) / Decimal(100)
        total_amount = subtotal_after_discount + total_tax
        
        quotation = Quotation(
            request_id=request_id,
            customer_id=sales_request.customer_id,
            salesperson_id=salesperson_id,
            quotation_status="Draft",
            subtotal=subtotal,
            total_discount=total_discount,
            total_tax=total_tax,
            total_amount=total_amount,
            discount_percent=discount_percent,
            notes=quotation_data.notes,
            valid_until=quotation_data.validUntil
        )
        
        db.add(quotation)
        db.flush()
        
        # Create line items
        for item in quotation_data.lineItems:
            qty = Decimal(str(item.quantity))
            unit_price = Decimal(str(item.unit_price))
            subtotal_item = qty * unit_price
            discount_amt = (subtotal_item * discount_percent) / Decimal(100)
            subtotal_after_disc = subtotal_item - discount_amt
            tax_amt = (subtotal_after_disc * tax_percent) / Decimal(100)
            total_item = subtotal_after_disc + tax_amt
            
            line_item = QuotationLineItem(
                quotation_id=quotation.id,
                product_name=item.product_name,
                quantity=qty,
                unit_price=unit_price,
                subtotal=subtotal_item,
                discount_percent=discount_percent,
                discount_amount=discount_amt,
                tax_percent=tax_percent,
                tax_amount=tax_amt,
                total_amount=total_item
            )
            db.add(line_item)
        
        db.commit()
        db.refresh(quotation)
        
        return {
            "quotation": {
                "id": quotation.id,
                "status": quotation.quotation_status
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create quotation")

@router.get("/quotations", response_model=list)
def get_salesperson_quotations(
    current: dict = Depends(get_current_salesperson),
    db: Session = Depends(get_db)
):
    """Get all quotations created by salesperson"""
    salesperson_id = current["salesperson_id"]
    
    quotations = db.query(Quotation).filter(Quotation.salesperson_id == salesperson_id).all()
    
    result = []
    for q in quotations:
        req = db.query(SalesRequest).filter(SalesRequest.id == q.request_id).first()
        customer = db.query(Customer).filter(Customer.id == q.customer_id).first()
        
        result.append({
            "id": q.id,
            "requestId": q.request_id,
            "productRequirement": req.product_requirement if req else "",
            "customer": {"name": customer.full_name if customer else ""},
            "status": q.quotation_status,
            "validUntil": q.valid_until,
            "createdAt": q.created_at.isoformat() if q.created_at else None
        })
    
    return result

@router.get("/quotations/{quotation_id}", response_model=dict)
def get_salesperson_quotation_detail(
    quotation_id: str,
    current: dict = Depends(get_current_salesperson),
    db: Session = Depends(get_db)
):
    """Get details of a specific quotation"""
    salesperson_id = current["salesperson_id"]
    
    quotation = db.query(Quotation).filter(
        Quotation.id == quotation_id,
        Quotation.salesperson_id == salesperson_id
    ).first()
    
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    line_items = db.query(QuotationLineItem).filter(QuotationLineItem.quotation_id == quotation_id).all()
    customer = db.query(Customer).filter(Customer.id == quotation.customer_id).first()
    discount_requests = db.query(DiscountRequest).filter(DiscountRequest.quotation_id == quotation_id).all()
    
    line_items_list = []
    for item in line_items:
        line_items_list.append({
            "id": item.id,
            "product_name": item.product_name,
            "quantity": item.quantity,
            "unit_price": str(item.unit_price),
            "subtotal": str(item.subtotal),
            "discount_percent": float(item.discount_percent),
            "discount_amount": str(item.discount_amount),
            "tax_amount": str(item.tax_amount),
            "total_amount": str(item.total_amount)
        })
    
    discount_requests_list = []
    for dr in discount_requests:
        discount_requests_list.append({
            "id": dr.id,
            "requestedDiscount": float(dr.requested_discount_percent),
            "currentDiscount": float(dr.current_discount_percent) if dr.current_discount_percent else 0,
            "reason": dr.reason,
            "status": dr.status,
            "salespersonResponse": dr.salesperson_response
        })
    
    return {
        "id": quotation.id,
        "requestId": quotation.request_id,
        "status": quotation.quotation_status,
        "subtotal": str(quotation.subtotal),
        "totalDiscount": str(quotation.total_discount),
        "totalTax": str(quotation.total_tax),
        "total": str(quotation.total_amount),
        "validUntil": quotation.valid_until,
        "notes": quotation.notes,
        "lineItems": line_items_list,
        "customer": {
            "full_name": customer.full_name,
            "company_name": customer.company_name,
            "email": customer.email
        } if customer else None,
        "discountRequests": discount_requests_list
    }

@router.post("/quotations/{quotation_id}/send", response_model=dict)
def send_quotation(
    quotation_id: str,
    current: dict = Depends(get_current_salesperson),
    db: Session = Depends(get_db)
):
    """Send quotation to customer"""
    salesperson_id = current["salesperson_id"]
    
    quotation = db.query(Quotation).filter(
        Quotation.id == quotation_id,
        Quotation.salesperson_id == salesperson_id
    ).first()
    
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    try:
        quotation.quotation_status = "Sent"
        quotation.quotation_number = f"QT-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        db.commit()
        
        return {
            "message": "Quotation sent to customer",
            "quotation": {
                "id": quotation.id,
                "status": quotation.quotation_status
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to send quotation")

@router.patch("/quotations/{quotation_id}", response_model=dict)
def update_quotation(
    quotation_id: str,
    quotation_data: UpdateQuotationRequest,
    current: dict = Depends(get_current_salesperson),
    db: Session = Depends(get_db)
):
    """Update an existing quotation"""
    salesperson_id = current["salesperson_id"]
    
    quotation = db.query(Quotation).filter(
        Quotation.id == quotation_id,
        Quotation.salesperson_id == salesperson_id,
        Quotation.quotation_status == "Draft"
    ).first()
    
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found or cannot be updated")
    
    try:
        if quotation_data.notes:
            quotation.notes = quotation_data.notes
        if quotation_data.validUntil:
            quotation.valid_until = quotation_data.validUntil
        
        # Recalculate totals if line items provided
        if quotation_data.lineItems:
            # Delete old line items
            db.query(QuotationLineItem).filter(QuotationLineItem.quotation_id == quotation_id).delete()
            
            discount_percent = Decimal(str(quotation_data.discount or quotation.discount_percent))
            tax_percent = Decimal(str(quotation_data.taxPercent or 10))
            
            subtotal = Decimal(0)
            for item in quotation_data.lineItems:
                subtotal += Decimal(str(item.unit_price)) * Decimal(str(item.quantity))
            
            total_discount = (subtotal * discount_percent) / Decimal(100)
            subtotal_after_discount = subtotal - total_discount
            total_tax = (subtotal_after_discount * tax_percent) / Decimal(100)
            total_amount = subtotal_after_discount + total_tax
            
            quotation.subtotal = subtotal
            quotation.total_discount = total_discount
            quotation.total_tax = total_tax
            quotation.total_amount = total_amount
            quotation.discount_percent = discount_percent
            
            for item in quotation_data.lineItems:
                qty = Decimal(str(item.quantity))
                unit_price = Decimal(str(item.unit_price))
                subtotal_item = qty * unit_price
                discount_amt = (subtotal_item * discount_percent) / Decimal(100)
                subtotal_after_disc = subtotal_item - discount_amt
                tax_amt = (subtotal_after_disc * tax_percent) / Decimal(100)
                total_item = subtotal_after_disc + tax_amt
                
                line_item = QuotationLineItem(
                    quotation_id=quotation_id,
                    product_name=item.product_name,
                    quantity=qty,
                    unit_price=unit_price,
                    subtotal=subtotal_item,
                    discount_percent=discount_percent,
                    discount_amount=discount_amt,
                    tax_percent=tax_percent,
                    tax_amount=tax_amt,
                    total_amount=total_item
                )
                db.add(line_item)
        
        db.commit()
        
        return {
            "quotation": {
                "id": quotation.id,
                "status": quotation.quotation_status
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update quotation")

# ==================== DISCOUNT REQUESTS ====================

@router.get("/discount-requests", response_model=list)
def get_salesperson_discount_requests(
    current: dict = Depends(get_current_salesperson),
    db: Session = Depends(get_db)
):
    """Get all discount requests for salesperson's quotations"""
    salesperson_id = current["salesperson_id"]
    
    discount_requests = db.query(DiscountRequest).filter(
        DiscountRequest.salesperson_id == salesperson_id
    ).all()
    
    result = []
    for dr in discount_requests:
        customer = db.query(Customer).filter(Customer.id == dr.customer_id).first()
        
        result.append({
            "id": dr.id,
            "quotationId": dr.quotation_id,
            "customer": {"name": customer.full_name if customer else ""},
            "requestedDiscount": float(dr.requested_discount_percent),
            "currentDiscount": float(dr.current_discount_percent) if dr.current_discount_percent else 0,
            "reason": dr.reason,
            "status": dr.status,
            "createdAt": dr.created_at.isoformat() if dr.created_at else None,
            "salespersonResponse": dr.salesperson_response,
            "customerMessage": dr.customer_message
        })
    
    return result

@router.post("/discount-requests/{discount_request_id}/approve", response_model=MessageResponse)
def approve_discount_request(
    discount_request_id: str,
    request_data: ApproveDiscountRequest,
    current: dict = Depends(get_current_salesperson),
    db: Session = Depends(get_db)
):
    """Approve a discount request"""
    salesperson_id = current["salesperson_id"]
    
    discount_req = db.query(DiscountRequest).filter(
        DiscountRequest.id == discount_request_id,
        DiscountRequest.salesperson_id == salesperson_id
    ).first()
    
    if not discount_req:
        raise HTTPException(status_code=404, detail="Discount request not found")
    
    try:
        discount_req.status = "Approved"
        discount_req.salesperson_response = request_data.salespersonResponse
        
        # Update quotation discount
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
    request_data: RejectDiscountRequest,
    current: dict = Depends(get_current_salesperson),
    db: Session = Depends(get_db)
):
    """Reject a discount request"""
    salesperson_id = current["salesperson_id"]
    
    discount_req = db.query(DiscountRequest).filter(
        DiscountRequest.id == discount_request_id,
        DiscountRequest.salesperson_id == salesperson_id
    ).first()
    
    if not discount_req:
        raise HTTPException(status_code=404, detail="Discount request not found")
    
    try:
        discount_req.status = "Rejected"
        discount_req.salesperson_response = request_data.salespersonResponse
        db.commit()
        return MessageResponse(message="Discount request rejected")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to reject discount request")

@router.post("/discount-requests/{discount_request_id}/counter-offer", response_model=MessageResponse)
def counter_offer_discount_request(
    discount_request_id: str,
    request_data: CounterOfferDiscountRequest,
    current: dict = Depends(get_current_salesperson),
    db: Session = Depends(get_db)
):
    """Submit counter-offer for a discount request"""
    salesperson_id = current["salesperson_id"]
    
    discount_req = db.query(DiscountRequest).filter(
        DiscountRequest.id == discount_request_id,
        DiscountRequest.salesperson_id == salesperson_id
    ).first()
    
    if not discount_req:
        raise HTTPException(status_code=404, detail="Discount request not found")
    
    try:
        discount_req.counter_offer_discount_percent = Decimal(str(request_data.counterOfferDiscount))
        discount_req.salesperson_response = request_data.salespersonResponse
        discount_req.status = "Counter Offer"
        db.commit()
        return MessageResponse(message="Counter-offer submitted")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to submit counter-offer")

@router.patch("/discount-requests/{discount_request_id}", response_model=MessageResponse)
def update_discount_request_status(
    discount_request_id: str,
    request_data: UpdateDiscountRequestStatus,
    current: dict = Depends(get_current_salesperson),
    db: Session = Depends(get_db)
):
    """Update discount request status"""
    salesperson_id = current["salesperson_id"]
    
    discount_req = db.query(DiscountRequest).filter(
        DiscountRequest.id == discount_request_id,
        DiscountRequest.salesperson_id == salesperson_id
    ).first()
    
    if not discount_req:
        raise HTTPException(status_code=404, detail="Discount request not found")
    
    try:
        discount_req.status = request_data.status
        if request_data.salespersonResponse:
            discount_req.salesperson_response = request_data.salespersonResponse
        db.commit()
        return MessageResponse(message="Status updated")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update status")
