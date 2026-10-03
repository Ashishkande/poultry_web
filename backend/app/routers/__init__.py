from app.routers.auth import router as auth_router
from app.routers.admin import router as admin_router
from app.routers.managers import router as managers_router
from app.routers.farms import router as farms_router
from app.routers.shades import router as shades_router
from app.routers.batches import router as batches_router
from app.routers.mortality import router as mortality_router
from app.routers.reports import router as reports_router
from app.routers.notifications import router as notifications_router

__all__ = [
    "auth_router",
    "admin_router",
    "managers_router",
    "farms_router",
    "shades_router",
    "batches_router",
    "mortality_router",
    "reports_router",
    "notifications_router"
]
