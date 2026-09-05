from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db, check_db_connection

router = APIRouter()

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    db_status = "ok" if check_db_connection() else "error"
    return {
        "status": "ok",
        "database": db_status
    }
