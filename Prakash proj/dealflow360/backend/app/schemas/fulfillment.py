from pydantic import BaseModel
from typing import List, Dict, Optional, Any

class SplitAllocation(BaseModel):
    productId: str
    warehouse: str
    quantity: int

class WarehouseSplitRequest(BaseModel):
    splits: List[SplitAllocation]

class OrderItemResponse(BaseModel):
    id: str
    productId: str
    productName: str
    category: str
    quantity: int
    unitPrice: float
    lineTotal: float
    isRecurring: bool
    billingFrequency: str
    product: Optional[Any] = None

class OrderResponse(BaseModel):
    id: str
    quoteId: str
    customer: str
    customerId: str
    amount: float
    status: str
    date: str
    items: List[OrderItemResponse] = []
    splits: Optional[List[Any]] = []

    class Config:
        from_attributes = True

class WarehouseInventory(BaseModel):
    warehouse: str
    available: int
    reserved: int
