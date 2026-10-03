import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "Poultry Farm Mortality Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = "sqlite:///./poultry.db"
    
    # JWT & Auth
    JWT_SECRET_KEY: str = "poultry-super-secret-jwt-key-change-in-production-2026-secure"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # OTP Settings
    OTP_EXPIRE_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 5
    
    # SMTP / Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@poultryfarm.com"
    SMTP_FROM_NAME: str = "Poultry Farm Portal"
    EMAIL_ENABLED: bool = False  # If false, logs OTP to backend console/logs
    
    # Frontend URL for CORS & Links
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
