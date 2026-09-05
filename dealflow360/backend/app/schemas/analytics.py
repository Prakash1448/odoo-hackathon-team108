from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class DealHealthDetail(BaseModel):
    overall: str  # 'Healthy', 'Moderate', 'Critical'
    commercialScore: int
    approvalScore: int
    engagementScore: int
    factors: List[str]
    recommendedActions: List[str]

class DealHealthItem(BaseModel):
    id: str
    customer: str
    amount: float
    discount: float
    margin: float
    status: str
    health: DealHealthDetail

class StalledQuoteItem(BaseModel):
    id: str
    customer: str
    amount: float
    status: str
    daysInactive: int
    issue: str
    severity: str

class DiscountAnomalyItem(BaseModel):
    id: str
    customer: str
    customerTier: str
    discount: float
    tierDiscountLimit: float
    margin: float
    issue: str
    severity: str

class DashboardAnalyticsResponse(BaseModel):
    kpis: Dict[str, Any]
    alerts: List[Any]
    intelligence: List[Any]
    dealHealth: List[Any]
    pipelineFunnel: List[Any]
