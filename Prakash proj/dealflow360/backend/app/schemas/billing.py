from pydantic import BaseModel
from typing import List, Optional, Any

class SubscriptionResponse(BaseModel):
    id: str
    orderId: Optional[str] = None
    customer: str
    customerId: str
    plan: str
    quantity: int
    amount: float
    billingFrequency: str
    startDate: str
    nextBillingDate: str
    status: str

    class Config:
        from_attributes = True

class SubscriptionModifyRequest(BaseModel):
    quantity: int

class InvoiceItemResponse(BaseModel):
    id: str
    description: str
    quantity: int
    unitPrice: float
    amount: float
    isProrated: bool

class InvoiceResponse(BaseModel):
    id: str
    quoteId: Optional[str] = None
    orderId: Optional[str] = None
    customer: str
    customerId: str
    amount: float
    subtotal: float
    tax: float
    status: str
    issueDate: str
    dueDate: str
    items: List[InvoiceItemResponse] = []

    class Config:
        from_attributes = True
