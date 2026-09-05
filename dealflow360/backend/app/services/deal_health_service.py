from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any

from app.models.quote import Quote
from app.models.customer import Customer

class DealHealthService:
    @staticmethod
    def analyze_quote_health(quote: Quote) -> Dict[str, Any]:
        """
        Outcome 5: Calculates real-time deal health and risk factors.
        """
        now = datetime.utcnow()
        days_inactive = (now - quote.updated_at).days if quote.updated_at else 0
        discount_val = float(quote.discount or 0.0)
        margin_val = float(quote.margin or 0.0)

        factors = []
        recommended_actions = []

        # Commercial score (0-100)
        commercial_score = 85
        if discount_val > 20:
            commercial_score -= 35
            factors.append(f"High discount ({discount_val:.1f}%) compresses profitability.")
        elif discount_val > 10:
            commercial_score -= 15

        if margin_val < 20:
            commercial_score -= 30
            factors.append(f"Blended margin ({margin_val:.1f}%) is below company 20% floor.")

        commercial_score = max(10, min(100, commercial_score))

        # Approval score
        if quote.status == "Pending Approval":
            approval_score = 40
            factors.append("Awaiting manager/finance approval.")
            recommended_actions.append("Follow up with designated approver")
        elif quote.status == "Rejected":
            approval_score = 10
            factors.append("Quotation was rejected.")
            recommended_actions.append("Review rejection feedback and re-draft")
        else:
            approval_score = 95

        # Engagement score
        if days_inactive > 14:
            engagement_score = 20
            factors.append(f"No customer or rep activity for {days_inactive} days.")
            recommended_actions.append("Nudge Customer with re-engagement email")
        elif days_inactive > 7:
            engagement_score = 60
            factors.append(f"Deal idle for {days_inactive} days.")
            recommended_actions.append("Schedule follow-up touchpoint")
        else:
            engagement_score = 90
            factors.append("Deal is actively progressing.")
            recommended_actions.append("Proceed with next scheduled milestone")

        # Composite overall health
        if days_inactive > 14 or discount_val > 25 or margin_val < 15 or quote.status == "Rejected":
            overall = "Critical"
        elif days_inactive > 7 or discount_val > 15 or margin_val < 22 or quote.status == "Pending Approval":
            overall = "Moderate"
        else:
            overall = "Healthy"

        return {
            "overall": overall,
            "commercialScore": commercial_score,
            "approvalScore": approval_score,
            "engagementScore": engagement_score,
            "factors": factors,
            "recommendedActions": recommended_actions
        }

    @staticmethod
    def get_stalled_quotes(db: Session) -> List[Dict[str, Any]]:
        quotes = db.query(Quote).filter(Quote.status.notin_(["Confirmed", "Rejected", "Fulfilled"])).all()
        now = datetime.utcnow()
        stalled = []

        for q in quotes:
            days_inactive = (now - q.updated_at).days if q.updated_at else 0
            if days_inactive > 10 or (q.status == "Pending Approval" and days_inactive > 3):
                issue = f"Stalled > {days_inactive} days" if days_inactive > 10 else "Pending Approval > 3 days"
                severity = "danger" if days_inactive > 14 else "warning"
                stalled.append({
                    "id": q.id,
                    "customer": q.customer.name if q.customer else "Unknown",
                    "amount": float(q.amount),
                    "status": q.status,
                    "daysInactive": days_inactive,
                    "issue": issue,
                    "severity": severity
                })
        return stalled

    @staticmethod
    def get_discount_anomalies(db: Session) -> List[Dict[str, Any]]:
        quotes = db.query(Quote).join(Customer).all()
        anomalies = []

        for q in quotes:
            tier = q.customer.tier if q.customer else None
            tier_limit = float(tier.max_auto_approval_discount) if tier else 15.0
            discount_val = float(q.discount or 0.0)
            margin_val = float(q.margin or 0.0)

            if discount_val > tier_limit or margin_val < 20.0:
                issue = f"Discount {discount_val}% exceeds {tier.name if tier else 'Tier'} limit ({tier_limit}%)" if discount_val > tier_limit else f"Margin below 20% ({margin_val}%)"
                severity = "danger" if discount_val > 20.0 or margin_val < 15.0 else "warning"
                anomalies.append({
                    "id": q.id,
                    "customer": q.customer.name if q.customer else "Unknown",
                    "customerTier": tier.name if tier else "Standard",
                    "discount": discount_val,
                    "tierDiscountLimit": tier_limit,
                    "margin": margin_val,
                    "issue": issue,
                    "severity": severity
                })
        return anomalies
