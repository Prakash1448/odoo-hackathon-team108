from pydantic import BaseModel, EmailStr, Field
from typing import Optional

# Customer Registration Request
class CustomerRegisterRequest(BaseModel):
    fullName: str
    companyName: str
    email: EmailStr
    phoneNumber: str
    password: str
    confirmPassword: str

# Customer/Salesperson/Manager Login Request
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Token Response
class TokenResponse(BaseModel):
    token: Optional[str] = None
    access_token: Optional[str] = None
    token_type: str = "bearer"

# Customer Registration Response
class CustomerResponse(BaseModel):
    id: str
    fullName: str
    companyName: str
    email: str
    phoneNumber: Optional[str] = None
    role: Optional[str] = None

# User Response
class UserResponse(BaseModel):
    id: str
    email: str
    role: str

# Customer Login Response
class CustomerLoginResponse(BaseModel):
    token: Optional[str] = None
    access_token: Optional[str] = None
    token_type: str = "bearer"
    customer: Optional[CustomerResponse] = None
    user: Optional[UserResponse] = None

# Salesperson Registration Request
class SalespersonRegisterRequest(BaseModel):
    fullName: str
    email: EmailStr
    password: str
    confirmPassword: str

# Salesperson Response
class SalespersonResponse(BaseModel):
    id: str
    fullName: str
    email: str
    role: Optional[str] = None
    maxDiscountPercent: Optional[float] = None

# Salesperson Login Response
class SalespersonLoginResponse(BaseModel):
    token: Optional[str] = None
    access_token: Optional[str] = None
    token_type: str = "bearer"
    salesperson: Optional[SalespersonResponse] = None

# Manager Registration Request
class ManagerRegisterRequest(BaseModel):
    fullName: str
    email: EmailStr
    password: str

# Manager Response
class ManagerResponse(BaseModel):
    id: str
    fullName: str
    email: str
    role: Optional[str] = None

# Manager Login Response
class ManagerLoginResponse(BaseModel):
    token: Optional[str] = None
    access_token: Optional[str] = None
    token_type: str = "bearer"
    manager: Optional[ManagerResponse] = None
    user: Optional[UserResponse] = None

# Generic Message Response
class MessageResponse(BaseModel):
    message: str
