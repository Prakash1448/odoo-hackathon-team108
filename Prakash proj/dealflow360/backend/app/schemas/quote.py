from pydantic import BaseModel
from typing import List, Optional, Any

class LineProduct(BaseModel):
    id: str
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    maxDiscount: Optional[float] = None

class QuoteLineItem(BaseModel):
    id: Optional[str] = None
    product: Optional[LineProduct] = None
    productId: Optional[str] = None
    quantity: int = 1
    discount: float = 0.0

class QuoteCreateRequest(BaseModel):
    id: Optional[str] = None
    customer: Optional[str] = None
    customerId: Optional[str] = None
    lines: List[QuoteLineItem] = []
    discount: Optional[float] = None
    owner: Optional[str] = None
    status: Optional[str] = None

class QuoteItemResponse(BaseModel):
    id: str
    productId: str
    productName: str
    category: str
    quantity: int
    unitPrice: float
    unitCost: float
    discount: float
    lineTotal: float
    lineMargin: float
    product: Optional[Any] = None

class QuoteResponse(BaseModel):
    id: str
    customerId: str
    customer: str
    owner: str
    subtotal: float
    discount: float
    discountAmount: float
    amount: float
    cost: float
    margin: float
    risk: str
    riskScore: int
    status: str
    rejectionReason: Optional[str] = None
    customerProposedDiscount: Optional[float] = None
    lines: List[QuoteItemResponse] = []
    createdAt: str
    updatedAt: str
    negotiationLog: Optional[List[Any]] = []

    class Config:
        from_attributes = True
