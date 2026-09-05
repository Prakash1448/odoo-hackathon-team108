from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.services.approval_service import ApprovalService
from app.schemas.approval import ApprovalResponse, ApprovalActionRequest
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User

router = APIRouter(prefix="/api/approvals", tags=["Approvals"])

@router.get("", response_model=List[ApprovalResponse])
def get_approval_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["sales-manager", "finance", "admin"]))
):
    return ApprovalService.get_approval_queue(db)

@router.post("/{id}/approve")
def approve_quote(
    id: str,
    action: ApprovalActionRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["sales-manager", "finance", "admin"]))
):
    comments = action.comments if action else None
    return ApprovalService.approve(db, id, current_user, comments)

@router.post("/{id}/reject")
def reject_quote(
    id: str,
    action: ApprovalActionRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["sales-manager", "finance", "admin"]))
):
    reason = action.reason if action else None
    return ApprovalService.reject(db, id, current_user, reason)

@router.post("/{id}/return")
def return_quote(
    id: str,
    action: ApprovalActionRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["sales-manager", "finance", "admin"]))
):
    reason = action.reason if action else None
    return ApprovalService.return_for_revision(db, id, current_user, reason)
