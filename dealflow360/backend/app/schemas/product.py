from pydantic import BaseModel, Field
from typing import Optional

class ProductBase(BaseModel):
    name: str
    category: str  # Hardware, Services, Subscriptions
    price: float
    cost: float
    maxDiscount: float = Field(default=15.0, alias="max_discount")
    billingFrequency: str = Field(default="one_time", alias="billing_frequency")
    status: str = "Active"

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    maxDiscount: Optional[float] = None
    billingFrequency: Optional[str] = None
    status: Optional[str] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    category: str
    price: float
    cost: float
    maxDiscount: float
    billingFrequency: str
    status: str

    class Config:
        from_attributes = True
        populate_by_name = True
