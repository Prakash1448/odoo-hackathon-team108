from pydantic import BaseModel
from typing import Optional, Dict

class DiscountLimits(BaseModel):
    Hardware: float
    Services: float
    Subscriptions: float

class CustomerResponse(BaseModel):
    id: str
    name: str
    tier: str
    contact: str
    billing: Optional[str] = None
    shipping: Optional[str] = None
    discountLimits: Optional[DiscountLimits] = None

    class Config:
        from_attributes = True
