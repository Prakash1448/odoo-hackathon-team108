from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.quote import Quote
from app.models.invoice import Invoice
from app.schemas.quote import QuoteResponse
from app.schemas.billing import InvoiceResponse
from app.schemas.portal import CounterOfferRequest, OrderRequestCreate
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


# ==================== CUSTOMER INVOICES ====================

def format_invoice_response(invoice: Invoice) -> InvoiceResponse:
    """Format Invoice model to InvoiceResponse schema"""
    return InvoiceResponse(
        id=invoice.id,
        quoteId=invoice.quote_id,
        orderId=invoice.order_id,
        customer=invoice.customer.name if invoice.customer else "Unknown",
        customerId=invoice.customer_id,
        amount=float(invoice.amount),
        subtotal=float(invoice.subtotal),
        tax=float(invoice.tax),
        status=invoice.status,
        issueDate=invoice.issue_date.isoformat() if invoice.issue_date else "",
        dueDate=invoice.due_date.isoformat() if invoice.due_date else "",
        items=[
            {
                "id": item.id,
                "description": item.description,
                "quantity": item.quantity,
                "unitPrice": float(item.unit_price),
                "amount": float(item.amount),
                "isProrated": item.is_prorated,
            }
            for item in invoice.items
        ]
    )


@router.get("/invoices", response_model=List[InvoiceResponse])
def get_customer_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all invoices for the logged-in customer"""
    if current_user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can access this endpoint"
        )
    
    # Filter invoices by customer (matched via customer.name or customer_id)
    invoices = db.query(Invoice).filter(
        (Invoice.customer.has(name=current_user.company)) |
        (Invoice.customer_id == current_user.id)
    ).order_by(Invoice.issue_date.desc()).all()
    
    return [format_invoice_response(inv) for inv in invoices]


@router.get("/invoices/{id}", response_model=InvoiceResponse)
def get_customer_invoice(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single invoice detail for the customer"""
    if current_user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can access this endpoint"
        )
    
    invoice = db.query(Invoice).filter(Invoice.id == id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Verify customer access - only customer who owns the invoice can view it
    if not (
        (invoice.customer.name == current_user.company if invoice.customer else False) or
        (invoice.customer_id == current_user.id)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this invoice"
        )
    
    return format_invoice_response(invoice)


@router.post("/invoices/{id}/pay")
def pay_invoice(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark an invoice as paid"""
    if current_user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can pay invoices"
        )
    
    invoice = db.query(Invoice).filter(Invoice.id == id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Verify customer access
    if not (
        (invoice.customer.name == current_user.company if invoice.customer else False) or
        (invoice.customer_id == current_user.id)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this invoice"
        )
    
    if invoice.status == "Paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice is already paid"
        )
    
    # Mark as paid
    from datetime import datetime
    invoice.status = "Paid"
    invoice.paid_at = datetime.utcnow()
    db.commit()
    db.refresh(invoice)
    
    return {
        "success": True,
        "message": "Invoice marked as paid",
        "invoice": format_invoice_response(invoice)
    }


# ==================== CUSTOMER ORDER REQUESTS ====================

@router.post("/requests")
def create_order_request(
    request: OrderRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create an order request (draft quote) for the logged-in customer.
    The sales team will review and create a formal quotation from this request.
    """
    if current_user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can create order requests"
        )
    
    if not request.items or len(request.items) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order request must contain at least one product"
        )
    
    try:
        from uuid import uuid4
        from app.models.product import Product
        from app.models.customer import Customer
        from app.models.quote import Quote, QuoteItem
        
        # Find customer record by company name match or create reference
        customer = db.query(Customer).filter(
            Customer.name == current_user.company
        ).first()
        
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Customer company not found in system. Please contact support."
            )
        
        # Create a draft quote for the order request
        quote_id = f"quote-{uuid4().hex[:12]}"
        
        # Calculate totals
        subtotal = 0.0
        quote_items = []
        
        for item in request.items:
            product = db.query(Product).filter(Product.id == item.productId).first()
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product {item.productId} not found"
                )
            
            if product.status != "Active":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product {product.name} is not available"
                )
            
            line_subtotal = float(product.price) * item.quantity
            subtotal += line_subtotal
            
            # Create QuoteItem
            quote_item = QuoteItem(
                id=f"quote-item-{uuid4().hex[:12]}",
                quote_id=quote_id,
                product_id=product.id,
                quantity=item.quantity,
                unit_price=float(product.price),
                unit_cost=float(product.cost),
                discount=0.0,
                line_subtotal=line_subtotal,
                line_discount_amount=0.0,
                line_total=line_subtotal,
                line_cost=float(product.cost) * item.quantity,
                line_margin=0.0,
            )
            quote_items.append(quote_item)
        
        # Create the quote (order request)
        quote = Quote(
            id=quote_id,
            customer_id=customer.id,
            owner_user_id=current_user.id,  # The customer initiates this
            subtotal=subtotal,
            discount=0.0,
            discount_amount=0.0,
            amount=subtotal,
            cost=sum(float(item.unit_cost) * item.quantity for item in quote_items),
            margin=0.0,
            status="Draft",  # Draft status indicates customer request
            risk="Low",
            risk_score=10,
        )
        
        quote.items = quote_items
        
        db.add(quote)
        db.commit()
        db.refresh(quote)
        
        return {
            "success": True,
            "message": "Order request submitted successfully. Our sales team will review it shortly.",
            "quoteId": quote_id,
            "status": "Draft",
            "amount": float(subtotal),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create order request: {str(e)}"
        )


@router.get("/requests", response_model=List[QuoteResponse])
def get_customer_order_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all draft order requests (quotes in Draft status) created by the customer"""
    if current_user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can access their order requests"
        )
    
    # Get all draft quotes where customer/owner matches current user's company
    requests = db.query(Quote).filter(
        Quote.status == "Draft",
        (
            (Quote.customer.has(name=current_user.company)) |
            (Quote.customer_id == current_user.id)
        )
    ).order_by(Quote.created_at.desc()).all()
    
    return [format_quote_response(q) for q in requests]
