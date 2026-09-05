from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database.session import get_db
from app.models.quote import Quote
from app.models.order import Order
from app.models.approval import Approval
from app.services.deal_health_service import DealHealthService
from app.schemas.analytics import DealHealthItem, StalledQuoteItem, DiscountAnomalyItem

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Deal Health"])

@router.get("/deal-health")
def get_deal_health(db: Session = Depends(get_db)):
    active_quotes = db.query(Quote).filter(Quote.status.notin_(["Confirmed", "Rejected", "Fulfillment"])).all()
    results = []
    for q in active_quotes:
        analysis = DealHealthService.analyze_quote_health(q)
        results.append({
            "id": q.id,
            "customer": q.customer.name if q.customer else "Unknown",
            "amount": float(q.amount),
            "discount": float(q.discount),
            "margin": float(q.margin),
            "status": q.status,
            "health": analysis
        })
    return results

@router.get("/stalled-quotes", response_model=List[StalledQuoteItem])
def get_stalled_quotes(db: Session = Depends(get_db)):
    return DealHealthService.get_stalled_quotes(db)

@router.get("/discount-anomalies", response_model=List[DiscountAnomalyItem])
def get_discount_anomalies(db: Session = Depends(get_db)):
    return DealHealthService.get_discount_anomalies(db)

from app.models.rules import UpsellRule

@router.get("/dashboard")
def get_dashboard_summary(db: Session = Depends(get_db)):
    quotes = db.query(Quote).all()
    orders = db.query(Order).all()

    # 1. Real Total Quotation Value (Sum of all quote amounts in MySQL)
    total_val = sum(float(q.amount) for q in quotes)
    
    # 2. Real Active Quotations
    active_quotes = [q for q in quotes if q.status not in ["Confirmed", "Rejected"]]
    active_count = len(active_quotes)
    
    # 3. Real Pending Approvals
    pending_app_count = len([q for q in quotes if q.status == "Pending Approval"])
    confirmed_count = len([q for q in quotes if q.status == "Confirmed"])
    
    # 4. Real Expected Revenue (Sum of pipeline deals & orders)
    expected_rev = sum(float(q.amount) for q in quotes if q.status in ["Sent", "Under Negotiation", "Confirmed", "Fulfillment"])
    if expected_rev == 0:
        expected_rev = sum(float(o.amount) for o in orders)

    # 5. Real Average Margin across all MySQL quotes
    avg_margin = (sum(float(q.margin) for q in quotes) / len(quotes)) if quotes else 0.0

    stalled = DealHealthService.get_stalled_quotes(db)

    # Dynamic pipeline funnel values calculated from MySQL
    pipeline_funnel = []
    for stage in ["Draft", "Pending Approval", "Sent", "Under Negotiation", "Confirmed"]:
        stage_quotes = [q for q in quotes if q.status == stage]
        stage_sum = sum(float(q.amount) for q in stage_quotes)
        stage_val_str = f"${stage_sum:,.0f}" if stage_sum > 0 else "$0"
        pipeline_funnel.append({
            "stage": stage,
            "count": len(stage_quotes),
            "value": stage_val_str
        })

    # Query real intelligence rules from MySQL database
    upsell_rules = db.query(UpsellRule).filter(UpsellRule.active == True).all()
    intelligence = []
    for index, rule in enumerate(upsell_rules):
        target_customer = quotes[index].customer.name if index < len(quotes) and quotes[index].customer else "Enterprise Account"
        rec_title = rule.rec_product.name if rule.rec_product else rule.title
        rec_price = float(rule.rec_product.price) if rule.rec_product else 4500.0
        intelligence.append({
            "id": rule.id,
            "customer": target_customer,
            "recommendation": f"{rule.type}: {rec_title}",
            "expectedValue": f"+${rec_price:,.0f}",
            "marginImpact": f"+{float(rule.min_margin):.0f}%"
        })

    # Query real pending approval quotes from MySQL
    pending_quotes = [q for q in quotes if q.status == "Pending Approval"]
    alerts = []
    for q in pending_quotes:
        alerts.append({
            "id": f"alert-{q.id}",
            "quote": q.id,
            "customer": q.customer.name if q.customer else "Unknown",
            "discount": f"{float(q.discount):.0f}%",
            "risk": q.risk,
            "requiredApprover": "Sales Manager",
            "action": "Needs Discount Approval"
        })

    # Format KPI values dynamically
    total_val_fmt = f"${total_val:,.0f}" if total_val < 1000000 else f"${total_val/1000000:.2f}M"
    expected_rev_fmt = f"${expected_rev:,.0f}" if expected_rev < 1000000 else f"${expected_rev/1000000:.2f}M"

    return {
        "kpis": {
            "totalQuotationValue": {
                "value": total_val_fmt,
                "change": f"{len(quotes)} quotes in DB",
                "trend": "up"
            },
            "activeQuotations": {
                "value": str(active_count),
                "change": f"{active_count} in pipeline",
                "trend": "up"
            },
            "pendingApprovals": {
                "value": str(pending_app_count),
                "change": "Requires action" if pending_app_count > 0 else "All clear",
                "trend": "down" if pending_app_count > 0 else "up"
            },
            "expectedRevenue": {
                "value": expected_rev_fmt,
                "change": "Secured & active",
                "trend": "up"
            },
            "averageMargin": {
                "value": f"{avg_margin:.1f}%",
                "change": "Target: >20.0%",
                "trend": "up" if avg_margin >= 20.0 else "down"
            }
        },
        "intelligence": intelligence,
        "alerts": alerts,
        "dealHealth": [
            {"id": f"dh-{s['id']}", "quote": s["id"], "customer": s["customer"], "issue": s["issue"], "severity": s["severity"]}
            for s in stalled[:3]
        ],
        "pipelineFunnel": pipeline_funnel
    }

