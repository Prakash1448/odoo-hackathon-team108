from pydantic import BaseModel
from typing import Optional

# Manager Dashboard Response
class ManagerDashboardResponse(BaseModel):
    totalApprovalRequests: int
    pendingApprovals: int
    approvedToday: int
    rejectedToday: int
    awaitingManagerApprovals: int

# Discount Request Response for Manager
class ManagerDiscountRequestResponse(BaseModel):
    id: str
    quotationId: str
    quotationNumber: Optional[str] = None
    customer: Optional[str] = None
    salesperson: Optional[str] = None
    requestedDiscount: float
    currentDiscount: Optional[float] = None
    reason: str
    status: str
    createdAt: str

# Detailed Discount Request for Manager
class DetailedDiscountRequestResponse(BaseModel):
    id: str
    quotationNumber: str
    customer: str
    customerEmail: str
    salesperson: str
    salespersonEmail: str
    currentDiscount: float
    requestedDiscount: float
    reason: str
    salespersonResponse: Optional[str] = None
    quotationDetails: Optional[dict] = None
    status: str
    createdAt: str

# Manager Approval Request
class ManagerApprovalRequest(BaseModel):
    response: Optional[str] = None

# Manager Rejection Request
class ManagerRejectionRequest(BaseModel):
    response: str

# Manager Counter Offer Request
class ManagerCounterOfferRequest(BaseModel):
    counterOfferDiscount: float
    response: str
