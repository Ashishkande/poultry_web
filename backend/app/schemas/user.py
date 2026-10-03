from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=7, max_length=25)
    password: str = Field(..., min_length=6, max_length=100)
    confirm_password: str = Field(..., min_length=6, max_length=100)

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, values):
        if 'password' in values.data and v != values.data['password']:
            raise ValueError('Passwords do not match')
        return v

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

class OTPResendRequest(BaseModel):
    email: EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    role: str
    status: str
    email_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class ManagerApprovalRequest(BaseModel):
    decision: str = Field(..., pattern="^(APPROVE|REJECT)$")  # APPROVE or REJECT
    reason: Optional[str] = None

class ManagerStatusToggleRequest(BaseModel):
    is_active: bool

class ProfileUpdateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=7, max_length=25)

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)
    confirm_new_password: str = Field(..., min_length=6)

    @field_validator('confirm_new_password')
    @classmethod
    def passwords_match(cls, v, values):
        if 'new_password' in values.data and v != values.data['new_password']:
            raise ValueError('New passwords do not match')
        return v
