from app.routers.auth import router as auth_router
from app.routers.customers import router as customers_router
from app.routers.products import router as products_router
from app.routers.quotes import router as quotes_router
from app.routers.approvals import router as approvals_router
from app.routers.fulfillment import router as fulfillment_router
from app.routers.inventory import router as inventory_router
from app.routers.billing import router as billing_router
from app.routers.portal import router as portal_router
from app.routers.analytics import router as analytics_router
from app.routers.recommendations import router as recommendations_router
from app.routers.admin import router as admin_router

__all__ = [
    "auth_router",
    "customers_router",
    "products_router",
    "quotes_router",
    "approvals_router",
    "fulfillment_router",
    "inventory_router",
    "billing_router",
    "portal_router",
    "analytics_router",
    "recommendations_router",
    "admin_router"
]
