from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class RecommendationImpact(BaseModel):
    revenue: float
    cost: float
    margin: float
    marginImpact: Optional[float] = None  # percentage difference in margin

class RecommendationItem(BaseModel):
    id: str
    type: str  # 'Upsell', 'Cross-sell'
    title: str
    explanation: str
    confidence: int
    impact: RecommendationImpact
    recommendedAction: str
    productRef: str

class RecommendationPreviewRequest(BaseModel):
    items: List[Dict[str, Any]]
    customerId: Optional[str] = None
    discount: Optional[float] = 0.0

class RecommendationResponse(BaseModel):
    recommendations: List[RecommendationItem] = []
    summaryImpact: Optional[Dict[str, float]] = None
