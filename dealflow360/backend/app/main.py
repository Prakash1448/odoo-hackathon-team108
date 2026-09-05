from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.core.config import settings
from app.routers import (
    auth_router,
    customers_router,
    products_router,
    quotes_router,
    approvals_router,
    fulfillment_router,
    inventory_router,
    billing_router,
    portal_router,
    analytics_router,
    recommendations_router,
    admin_router
)

app = FastAPI(
    title="DealFlow360 API",
    description="Production-Structured Sales Operations & CPQ Backend with MySQL",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Configuration
origins = [
    settings.FRONTEND_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost",
        "http://127.0.0.1",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Include All Routers
app.include_router(auth_router)
app.include_router(customers_router)
app.include_router(products_router)
app.include_router(quotes_router)
app.include_router(recommendations_router)
app.include_router(approvals_router)
app.include_router(fulfillment_router)
app.include_router(inventory_router)
app.include_router(billing_router)
app.include_router(portal_router)
app.include_router(analytics_router)
app.include_router(admin_router)

@app.get("/")
def root():
    return {
        "app": "DealFlow360 API",
        "status": "online",
        "database": "MySQL (dealflow360)",
        "documentation": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "version": "1.0.0"
    }
