import random
import string
from datetime import datetime, timedelta
from typing import Tuple, Dict, Any, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.models.user import User, EmailOTP
from app.services.email_service import EmailService
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService

class AuthService:
    @staticmethod
    def generate_otp() -> str:
        return "".join(random.choices(string.digits, k=6))

    @staticmethod
    def register_manager(db: Session, name: str, email: str, phone: str, password: str) -> User:
        clean_email = email.lower().strip()
        existing = db.query(User).filter(User.email == clean_email).first()
        if existing:
            if not existing.email_verified:
                # User exists but not verified, allow updating password and resending OTP
                existing.name = name
                existing.phone = phone
                existing.password_hash = get_password_hash(password)
                existing.status = "PENDING_VERIFICATION"
                db.commit()
                db.refresh(existing)
                AuthService.send_new_otp(db, existing)
                return existing
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
            )

        user = User(
            name=name.strip(),
            email=clean_email,
            phone=phone.strip(),
            password_hash=get_password_hash(password),
            role="MANAGER",
            status="PENDING_VERIFICATION",
            email_verified=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        AuthService.send_new_otp(db, user)

        AuditService.log(
            db=db,
            action="MANAGER_REGISTERED",
            entity_type="User",
            entity_id=user.id,
            user_id=user.id,
            new_data={"email": user.email, "name": user.name}
        )

        return user

    @staticmethod
    def send_new_otp(db: Session, user: User) -> str:
        otp_code = AuthService.generate_otp()
        expires = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

        otp_record = EmailOTP(
            user_id=user.id,
            otp=otp_code,
            expires_at=expires,
            attempts=0
        )
        db.add(otp_record)
        db.commit()

        EmailService.send_otp_email(user.email, user.name, otp_code)
        return otp_code

    @staticmethod
    def verify_otp(db: Session, email: str, otp_code: str) -> Dict[str, Any]:
        clean_email = email.lower().strip()
        user = db.query(User).filter(User.email == clean_email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User account not found.")

        if user.email_verified and user.status != "PENDING_VERIFICATION":
            return {"message": "Email is already verified.", "status": user.status}

        otp_record = (
            db.query(EmailOTP)
            .filter(EmailOTP.user_id == user.id, EmailOTP.verified_at == None)
            .order_by(EmailOTP.created_at.desc())
            .first()
        )

        if not otp_record:
            raise HTTPException(status_code=400, detail="No active OTP found. Please request a new OTP.")

        if otp_record.attempts >= settings.OTP_MAX_ATTEMPTS:
            raise HTTPException(status_code=400, detail="Too many failed attempts. Please request a new OTP.")

        if datetime.utcnow() > otp_record.expires_at:
            raise HTTPException(status_code=400, detail="OTP Expired. Please request a new OTP.")

        if otp_record.otp != otp_code.strip():
            otp_record.attempts += 1
            db.commit()
            raise HTTPException(status_code=400, detail="Invalid OTP")

        # OTP is valid
        otp_record.verified_at = datetime.utcnow()
        user.email_verified = True
        user.status = "PENDING_ADMIN_APPROVAL"
        db.commit()
        db.refresh(user)

        # Notify Admin
        NotificationService.notify_admins(
            db=db,
            notification_type="MANAGER_ACCESS_REQUEST",
            title="New Manager Access Request",
            message=f"Manager: {user.name} ({user.email}) has verified email and requested access.",
            metadata={"manager_id": user.id, "email": user.email, "name": user.name}
        )

        AuditService.log(
            db=db,
            action="EMAIL_VERIFIED",
            entity_type="User",
            entity_id=user.id,
            user_id=user.id,
            new_data={"status": "PENDING_ADMIN_APPROVAL"}
        )

        return {
            "message": "Email Verified Successfully. Your request is now pending admin approval.",
            "status": "PENDING_ADMIN_APPROVAL"
        }

    @staticmethod
    def resend_otp(db: Session, email: str) -> Dict[str, Any]:
        clean_email = email.lower().strip()
        user = db.query(User).filter(User.email == clean_email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User account not found.")

        if user.email_verified and user.status != "PENDING_VERIFICATION":
            return {"message": "Email is already verified."}

        AuthService.send_new_otp(db, user)
        return {"message": "A new OTP has been sent to your registered email address."}

    @staticmethod
    def login(db: Session, email: str, password: str) -> Dict[str, Any]:
        clean_email = email.lower().strip()
        user = db.query(User).filter(User.email == clean_email).first()
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        if not user.email_verified:
            raise HTTPException(
                status_code=403,
                detail="Email verification is required before logging in. Please verify your OTP."
            )

        if user.role == "MANAGER":
            if user.status == "PENDING_ADMIN_APPROVAL":
                raise HTTPException(
                    status_code=403,
                    detail="Your account is pending administrator approval. Please wait for admin review."
                )
            elif user.status == "REJECTED":
                raise HTTPException(
                    status_code=403,
                    detail="Your access request has been rejected by the administrator."
                )
            elif user.status == "DISABLED":
                raise HTTPException(
                    status_code=403,
                    detail="Your account has been deactivated. Please contact the administrator."
                )
            elif user.status != "APPROVED":
                raise HTTPException(
                    status_code=403,
                    detail=f"Account status '{user.status}' does not permit login."
                )

        token_data = {"user_id": user.id, "role": user.role, "email": user.email}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        AuditService.log(
            db=db,
            action="USER_LOGIN",
            entity_type="User",
            entity_id=user.id,
            user_id=user.id
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user
        }

    @staticmethod
    def refresh(db: Session, refresh_token: str) -> Dict[str, Any]:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

        user_id = payload.get("user_id")
        user = db.query(User).filter(User.id == user_id).first()
        if not user or user.status == "DISABLED":
            raise HTTPException(status_code=401, detail="User not found or disabled.")

        token_data = {"user_id": user.id, "role": user.role, "email": user.email}
        new_access_token = create_access_token(token_data)
        return {
            "access_token": new_access_token,
            "token_type": "bearer"
        }
