from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import create_all_tables, check_db_connection
from app.routers import health, auth, customer, salesperson, manager

# Create FastAPI app
app = FastAPI(
    title="DealFlow360 Backend",
    description="FastAPI backend for DealFlow360 Sales Management System",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables on startup
@app.on_event("startup")
def startup_event():
    """Create database tables and check connection on startup"""
    try:
        if check_db_connection():
            create_all_tables()
            print("✓ Database connected and tables created")
        else:
            print("✗ Database connection failed")
    except Exception as e:
        print(f"✗ Startup error: {e}")

# Include routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(customer.router)
app.include_router(salesperson.router)
app.include_router(manager.router)

# Root endpoint
@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "DealFlow360 Backend API",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=5000,
        reload=True
    )
