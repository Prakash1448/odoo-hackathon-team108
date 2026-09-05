from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime
from app.models.approval import Approval
from app.models.quote import Quote
from app.models.user import User

class ApprovalService:
    @staticmethod
    def get_approval_queue(db: Session):
        approvals = db.query(Approval).join(Quote).order_by(Approval.created_at.desc()).all()
        result = []
        for app in approvals:
            q = app.quote
            result.append({
                "id": app.id,
                "quoteId": q.id,
                "customer": q.customer.name if q.customer else "Unknown",
                "amount": float(q.amount),
                "discount": float(q.discount),
                "margin": float(q.margin),
                "status": app.status,
                "requiredRole": app.required_role,
                "requestedBy": app.requested_by.name if app.requested_by else "Sales Rep",
                "reason": app.reason,
                "date": app.created_at.isoformat()
            })
        return result

    @staticmethod
    def approve(db: Session, approval_or_quote_id: str, current_user: User, comments: str = None):
        approval = db.query(Approval).filter(
            (Approval.id == approval_or_quote_id) | (Approval.quote_id == approval_or_quote_id)
        ).first()

        if not approval:
            raise HTTPException(status_code=404, detail="Approval request not found")

        approval.status = "Approved"
        approval.comments = comments
        approval.decided_by_user_id = current_user.id
        approval.decided_at = datetime.utcnow()

        quote = approval.quote
        quote.status = "Approved"
        quote.updated_at = datetime.utcnow()

        db.commit()
        return {"success": True, "message": f"Quote {quote.id} approved successfully", "status": "Approved"}

    @staticmethod
    def reject(db: Session, approval_or_quote_id: str, current_user: User, reason: str = None):
        approval = db.query(Approval).filter(
            (Approval.id == approval_or_quote_id) | (Approval.quote_id == approval_or_quote_id)
        ).first()

        if not approval:
            raise HTTPException(status_code=404, detail="Approval request not found")

        approval.status = "Rejected"
        approval.comments = reason
        approval.decided_by_user_id = current_user.id
        approval.decided_at = datetime.utcnow()

        quote = approval.quote
        quote.status = "Rejected"
        quote.rejection_reason = reason
        quote.updated_at = datetime.utcnow()

        db.commit()
        return {"success": True, "message": f"Quote {quote.id} rejected", "status": "Rejected"}

    @staticmethod
    def return_for_revision(db: Session, approval_or_quote_id: str, current_user: User, reason: str = None):
        approval = db.query(Approval).filter(
            (Approval.id == approval_or_quote_id) | (Approval.quote_id == approval_or_quote_id)
        ).first()

        if not approval:
            raise HTTPException(status_code=404, detail="Approval request not found")

        approval.status = "Returned"
        approval.comments = reason
        approval.decided_by_user_id = current_user.id
        approval.decided_at = datetime.utcnow()

        quote = approval.quote
        quote.status = "Draft"
        quote.rejection_reason = reason
        quote.updated_at = datetime.utcnow()

        db.commit()
        return {"success": True, "message": f"Quote {quote.id} returned for revision", "status": "Draft"}
