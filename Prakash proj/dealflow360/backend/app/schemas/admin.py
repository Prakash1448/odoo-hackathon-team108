from pydantic import BaseModel
from typing import Optional

class UpsellRuleBase(BaseModel):
    triggerProductId: str
    recProductId: str
    type: str  # 'Upsell', 'Cross-sell'
    minMargin: float
    isPromo: bool = False
    active: bool = True
    title: str
    explanation: Optional[str] = None
    confidence: int = 85

class UpsellRuleCreate(UpsellRuleBase):
    pass

class UpsellRuleResponse(BaseModel):
    id: str
    triggerProduct: str
    recProduct: str
    triggerProductId: str
    recProductId: str
    type: str
    minMargin: float
    isPromo: bool
    active: bool
    title: str
    confidence: int

    class Config:
        from_attributes = True
