import logging
from fastapi import FastAPI, Request, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.utils.websocket_manager import ws_manager
from app.routers import (
    auth_router,
    admin_router,
    managers_router,
    farms_router,
    shades_router,
    batches_router,
    mortality_router,
    reports_router,
    notifications_router
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
# Production-Ready Poultry Farm Mortality Management System API (PostgreSQL)
logger = logging.getLogger("poultry_app")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-Ready Poultry Farm Mortality Management System API"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Error Handling for Consistent Structure
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "error_code": f"HTTP_{exc.status_code}"
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_error = errors[0]["msg"] if errors else "Validation error"
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": f"Input validation failed: {first_error}",
            "errors": errors,
            "error_code": "VALIDATION_ERROR"
        }
    )

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(managers_router, prefix=settings.API_V1_STR)
app.include_router(farms_router, prefix=settings.API_V1_STR)
app.include_router(shades_router, prefix=settings.API_V1_STR)
app.include_router(batches_router, prefix=settings.API_V1_STR)
app.include_router(mortality_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)

@app.websocket("/ws/{user_id}")
async def root_websocket_endpoint(websocket: WebSocket, user_id: int):
    await ws_manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)

@app.on_event("startup")
def on_startup():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
    
    # Auto-seed database if admin does not exist
    try:
        from app.models.user import User
        from app.core.security import get_password_hash
        db = SessionLocal()
        admin = db.query(User).filter(User.role == "ADMIN").first()
        if not admin:
            logger.info("Creating default administrator account...")
            admin = User(
                name="System Administrator",
                email="admin@poultryfarm.com",
                phone="+1 (555) 019-2834",
                password_hash=get_password_hash("Admin@123456"),
                role="ADMIN",
                status="APPROVED",
                email_verified=True
            )
            db.add(admin)
            db.commit()
            logger.info("Default administrator account created: admin@poultryfarm.com / Admin@123456")
        db.close()
    except Exception as e:
        logger.error(f"Error during startup auto-seeding: {e}")

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/health")
def healthcheck():
    return {"status": "healthy"}
