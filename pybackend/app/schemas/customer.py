from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Create Sales Request
class CreateSalesRequestRequest(BaseModel):
    requestTitle: str
    productRequirement: str
    quantity: int
    specifications: Optional[str] = None
    additionalNotes: Optional[str] = None
    expectedDeliveryDate: Optional[str] = None

# Sales Request Response
class SalesRequestResponse(BaseModel):
    id: str
    request_title: str
    product_requirement: str
    quantity: int
    specifications: Optional[str] = None
    additional_notes: Optional[str] = None
    expected_delivery_date: Optional[str] = None
    status: str
    created_at: str
    createdAt: Optional[str] = None
    salesperson_id: Optional[str] = None
    customer_id: Optional[str] = None

# Customer Profile Response
class CustomerProfileResponse(BaseModel):
    id: str
    fullName: str
    companyName: str
    email: str
    phoneNumber: str
    createdAt: Optional[str] = None
    created_at: Optional[str] = None

# Dashboard Response
class CustomerDashboardResponse(BaseModel):
    totalRequests: int
    pendingRequests: int
    quotationsReceived: int
    quotationsAwaitingAction: int
    discountRequests: int
    acceptedQuotations: int

# Quotation Line Item Response
class QuotationLineItemResponse(BaseModel):
    id: str
    product_name: str
    quantity: int
    unit_price: str
    subtotal: str
    discount_percent: float
    discount_amount: str
    tax_amount: str
    total_amount: str

# Quotation Response
class QuotationResponse(BaseModel):
    id: str
    requestId: Optional[str] = None
    status: str
    total: str
    subtotal: str
    totalDiscount: str
    totalTax: str
    validUntil: Optional[str] = None
    notes: Optional[str] = None
    accepted: Optional[bool] = False
    acceptedAt: Optional[str] = None
    lineItems: list = []
    discountRequests: Optional[list] = None

# Discount Request
class RequestDiscountRequest(BaseModel):
    requestedDiscountPercent: float
    reason: str
    customerMessage: Optional[str] = None

# Quotation Summary (for list)
class QuotationSummaryResponse(BaseModel):
    id: str
    requestTitle: Optional[str] = None
    quantity: Optional[int] = None
    status: str
    validUntil: Optional[str] = None
    createdAt: Optional[str] = None
    requestId: Optional[str] = None
