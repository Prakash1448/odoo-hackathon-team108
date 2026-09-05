from pydantic import BaseModel
from typing import Optional, List, Any

class CounterOfferRequest(BaseModel):
    proposedDiscount: float
    comment: Optional[str] = None

class NegotiationMessage(BaseModel):
    sender: str
    message: Optional[str] = None
    date: str
    proposedDiscount: Optional[float] = None
    proposedAmount: Optional[float] = None
