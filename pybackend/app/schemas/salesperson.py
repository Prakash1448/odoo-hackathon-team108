from pydantic import BaseModel
from typing import Optional, List

# Dashboard Response
class SalespersonDashboardResponse(BaseModel):
    totalRequests: int
    pendingRequests: int
    quotationsCreated: int
    quotationsSent: int
    quotationsAwaitingAction: int
    activeDiscountRequests: int

# Create Quotation Line Item
class CreateQuotationLineItem(BaseModel):
    product_name: str
    quantity: int
    unit_price: float

# Create Quotation Request
class CreateQuotationRequest(BaseModel):
    lineItems: List[CreateQuotationLineItem]
    discount: Optional[float] = 0
    taxPercent: Optional[float] = 10
    validUntil: Optional[str] = None
    notes: Optional[str] = None

# Update Quotation Request
class UpdateQuotationRequest(BaseModel):
    lineItems: Optional[List[CreateQuotationLineItem]] = None
    discount: Optional[float] = None
    taxPercent: Optional[float] = None
    validUntil: Optional[str] = None
    notes: Optional[str] = None

# Send Quotation Request (empty body)
class SendQuotationRequest(BaseModel):
    pass

# Update Request Status
class UpdateRequestStatusRequest(BaseModel):
    status: str

# Discount Request Responses
class ApproveDiscountRequest(BaseModel):
    salespersonResponse: Optional[str] = None

class RejectDiscountRequest(BaseModel):
    salespersonResponse: str

class CounterOfferDiscountRequest(BaseModel):
    counterOfferDiscount: float
    salespersonResponse: str

class UpdateDiscountRequestStatus(BaseModel):
    status: str
    salespersonResponse: Optional[str] = None

# Discount Request Response
class DiscountRequestResponse(BaseModel):
    id: str
    quotationId: str
    customer: Optional[dict] = None
    requestedDiscount: float
    currentDiscount: Optional[float] = None
    reason: str
    status: str
    createdAt: str
    salespersonResponse: Optional[str] = None
    customerMessage: Optional[str] = None
