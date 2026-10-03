from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import (
    UserRegisterRequest, OTPVerifyRequest, OTPResendRequest,
    LoginRequest, RefreshTokenRequest, TokenResponse, UserResponse
)
from app.services.auth_service import AuthService
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
def register(req: UserRegisterRequest, db: Session = Depends(get_db)):
    user = AuthService.register_manager(
        db=db,
        name=req.name,
        email=req.email,
        phone=req.phone,
        password=req.password
    )
    return {
        "success": True,
        "message": f"Registration successful. A 6-digit OTP has been sent to {user.email}.",
        "email": user.email,
        "status": user.status
    }

@router.post("/verify-otp", response_model=dict)
def verify_otp(req: OTPVerifyRequest, db: Session = Depends(get_db)):
    res = AuthService.verify_otp(db=db, email=req.email, otp_code=req.otp)
    return {"success": True, **res}

@router.post("/resend-otp", response_model=dict)
def resend_otp(req: OTPResendRequest, db: Session = Depends(get_db)):
    res = AuthService.resend_otp(db=db, email=req.email)
    return {"success": True, **res}

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    res = AuthService.login(db=db, email=req.email, password=req.password)
    return res

@router.post("/refresh", response_model=dict)
def refresh(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    res = AuthService.refresh(db=db, refresh_token=req.refresh_token)
    return res

@router.post("/logout", response_model=dict)
def logout(current_user: User = Depends(get_current_user)):
    return {"success": True, "message": "Logged out successfully."}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
