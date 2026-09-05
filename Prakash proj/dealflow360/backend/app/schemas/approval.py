from pydantic import BaseModel
from typing import Optional

class ApprovalActionRequest(BaseModel):
    comments: Optional[str] = None
    reason: Optional[str] = None

class ApprovalResponse(BaseModel):
    id: str
    quoteId: str
    customer: str
    amount: float
    discount: float
    margin: float
    status: str
    requiredRole: str
    requestedBy: str
    reason: Optional[str] = None
    date: str

    class Config:
        from_attributes = True
