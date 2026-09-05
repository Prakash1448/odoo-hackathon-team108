import pytest
from fastapi.testclient import TestClient
from decimal import Decimal
from datetime import datetime, timedelta

from app.main import app
from app.database.session import SessionLocal
from app.models.quote import Quote
from app.models.order import Order
from app.models.subscription import Subscription
from app.models.invoice import Invoice
from app.models.inventory import Inventory
from app.models.customer import Customer
from app.services.billing_service import BillingService

client = TestClient(app)

# Helper to get auth token
def get_auth_token(email: str, password: str = "password"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed: {res.text}"
    return res.json()["access_token"]

# 1. Test Login
def test_01_login():
    res = client.post("/api/auth/login", json={"email": "alex.sterling@dealflow.com", "password": "password"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "sales-rep"
    assert data["user"]["email"] == "alex.sterling@dealflow.com"

# 2. Test Role Authorization
def test_02_role_authorization():
    rep_token = get_auth_token("alex.sterling@dealflow.com")
    admin_token = get_auth_token("elena.admin@dealflow.com")

    # Rep cannot access admin rules
    res_rep = client.get("/api/admin/rules", headers={"Authorization": f"Bearer {rep_token}"})
    assert res_rep.status_code == 403

    # Admin can access admin rules
    res_admin = client.get("/api/admin/rules", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200

# 3. Test Quote Creation
def test_03_quote_creation():
    rep_token = get_auth_token("alex.sterling@dealflow.com")
    payload = {
        "customer": "Acme Corp",
        "lines": [
            {"productId": "p-1", "quantity": 2, "discount": 5.0},
            {"productId": "p-4", "quantity": 1, "discount": 0.0}
        ]
    }
    res = client.post("/api/quotes", json=payload, headers={"Authorization": f"Bearer {rep_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["customer"] == "Acme Corp"
    assert len(data["lines"]) == 2
    assert data["amount"] > 0

# 4. Test Authoritative Quote Calculation (Pricing & Cost from DB)
def test_04_quote_calculation():
    rep_token = get_auth_token("alex.sterling@dealflow.com")
    # p-1 price: 15000, p-4 price: 5000. Qty: 2 of p-1 (30000) + 1 of p-4 (5000) = Subtotal 35000
    # 0% discount -> Total: 35000. Cost: 2*10000 + 2500 = 22500. Margin: (35000-22500)/35000 = 35.71%
    payload = {
        "customer": "Acme Corp",
        "lines": [
            {"productId": "p-1", "quantity": 2, "discount": 0.0},
            {"productId": "p-4", "quantity": 1, "discount": 0.0}
        ]
    }
    res = client.post("/api/quotes", json=payload, headers={"Authorization": f"Bearer {rep_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["subtotal"] == 35000.0
    assert data["amount"] == 35000.0
    assert data["cost"] == 22500.0
    assert abs(data["margin"] - 35.71) < 0.1

# 5. Test Authoritative Discount Calculation
def test_05_discount_calculation():
    rep_token = get_auth_token("alex.sterling@dealflow.com")
    # p-1: 15000, 10% disc = 13500
    payload = {
        "customer": "Acme Corp",
        "lines": [
            {"productId": "p-1", "quantity": 1, "discount": 10.0}
        ]
    }
    res = client.post("/api/quotes", json=payload, headers={"Authorization": f"Bearer {rep_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["subtotal"] == 15000.0
    assert data["discountAmount"] == 1500.0
    assert data["amount"] == 13500.0

# 6. Test Outcome 1: Approval Routing (High Discount triggers Pending Approval)
def test_06_approval_routing():
    rep_token = get_auth_token("alex.sterling@dealflow.com")
    # Acme Corp is Enterprise (limit 15%). Submitting 25% discount should trigger Pending Approval
    payload = {
        "customer": "Acme Corp",
        "lines": [
            {"productId": "p-1", "quantity": 1, "discount": 25.0}
        ]
    }
    res = client.post("/api/quotes", json=payload, headers={"Authorization": f"Bearer {rep_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "Pending Approval"
    assert data["risk"] == "High"

# 7. Test Outcome 1: Customer Tier Auto Approval (Within limit auto-approved/Sent)
def test_07_customer_tier_auto_approval():
    rep_token = get_auth_token("alex.sterling@dealflow.com")
    # Acme Corp Enterprise tier allows up to 15%. A 5% discount with healthy margin routes to Approved/Sent
    payload = {
        "customer": "Acme Corp",
        "status": "Sent",
        "lines": [
            {"productId": "p-1", "quantity": 1, "discount": 5.0}
        ]
    }
    res = client.post("/api/quotes", json=payload, headers={"Authorization": f"Bearer {rep_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["Sent", "Approved"]
    assert data["risk"] == "Low"

# 8. Test Outcome 2: Live Upsell/Cross-sell Suggestions & Margin Impact
def test_08_product_recommendation():
    # Quote preview with Server X-100 (Hardware) should recommend Warranty or Support
    preview_payload = {
        "items": [
            {"productId": "p-1", "quantity": 1, "discount": 0.0}
        ],
        "discount": 0.0
    }
    res = client.post("/api/recommendations/preview", json=preview_payload)
    assert res.status_code == 200
    recs = res.json()
    assert len(recs) > 0
    # First recommendation should include financial impact & margin
    first_rec = recs[0]
    assert "revenue" in first_rec["impact"]
    assert "margin" in first_rec["impact"]
    assert "marginImpact" in first_rec["impact"]
    assert first_rec["impact"]["revenue"] > 0

# 9. Test Outcome 3: Automatic Multi-Warehouse Split
def test_09_warehouse_allocation():
    manager_token = get_auth_token("sarah.jenkins@dealflow.com")
    res = client.get("/api/fulfillment/ORD-2026-0046/auto-split", headers={"Authorization": f"Bearer {manager_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "recommendedSplits" in data
    assert "hasBackorder" in data

# 10. Test Outcome 3: Manual Warehouse Override & Validation
def test_10_manual_warehouse_override():
    manager_token = get_auth_token("sarah.jenkins@dealflow.com")
    # Valid manual split for ORD-2026-0047
    manual_payload = {
        "splits": [
            {"productId": "p-3", "warehouse": "Warehouse A", "quantity": 5},
            {"productId": "p-3", "warehouse": "Warehouse B", "quantity": 7}
        ]
    }
    res = client.post("/api/fulfillment/ORD-2026-0047/manual-allocation", json=manual_payload, headers={"Authorization": f"Bearer {manager_token}"})
    assert res.status_code == 200
    assert res.json()["status"] == "Warehouse Allocation"

# 11. Test Outcome 3: Insufficient Inventory Protection (Negative Stock Prevention)
def test_11_insufficient_inventory():
    manager_token = get_auth_token("sarah.jenkins@dealflow.com")
    # Attempting to allocate 99999 units must be blocked
    invalid_payload = {
        "splits": [
            {"productId": "p-1", "warehouse": "Warehouse A", "quantity": 99999}
        ]
    }
    res = client.post("/api/fulfillment/ORD-2026-0046/manual-allocation", json=invalid_payload, headers={"Authorization": f"Bearer {manager_token}"})
    assert res.status_code == 400
    assert "Insufficient inventory" in res.json()["detail"]

# 12. Test Outcome 4: Mixed One-Time & Recurring Order
def test_12_mixed_order_creation():
    db = SessionLocal()
    order = db.query(Order).filter(Order.id == "ORD-2026-0046").first()
    assert order is not None
    # Check lines: has both one-time (p-1) and recurring subscription (p-6)
    has_onetime = any(not item.is_recurring for item in order.items)
    has_recurring = any(item.is_recurring for item in order.items)
    assert has_onetime is True
    assert has_recurring is True
    db.close()

# 13. Test Outcome 4: Proration Engine
def test_13_proration_engine():
    db = SessionLocal()
    sub = db.query(Subscription).filter(Subscription.status == "Active").first()
    assert sub is not None
    old_amount = float(sub.amount)
    old_qty = sub.quantity

    # Modify subscription quantity (+10 seats)
    new_qty = old_qty + 10
    updated_sub = BillingService.modify_subscription_with_proration(db, sub.id, new_qty)
    assert updated_sub.quantity == new_qty
    assert float(updated_sub.amount) > old_amount

    # Verify a prorated invoice was generated
    prorated_inv = db.query(Invoice).filter(Invoice.order_id == sub.order_id, Invoice.id.like("%PRORATE%")).first()
    assert prorated_inv is not None
    assert float(prorated_inv.amount) > 0
    db.close()

# 14. Test Outcome 4: Invoice Creation
def test_14_invoice_creation():
    finance_token = get_auth_token("marcus.thorne@dealflow.com")
    res = client.get("/api/invoices", headers={"Authorization": f"Bearer {finance_token}"})
    assert res.status_code == 200
    invoices = res.json()
    assert len(invoices) > 0
    inv = invoices[0]
    assert "amount" in inv
    assert "status" in inv
    assert "dueDate" in inv

# 15. Test Outcome 6: Customer Negotiation Portal View
def test_15_customer_negotiation_portal():
    customer_token = get_auth_token("john@acmecorp.com")
    res = client.get("/api/portal/quotes", headers={"Authorization": f"Bearer {customer_token}"})
    assert res.status_code == 200
    quotes = res.json()
    assert len(quotes) > 0
    # Customer only sees Acme Corp quotes
    for q in quotes:
        assert q["customer"] == "Acme Corp"

# 16. Test Outcome 6: Counter-Offer & Manager Approval Route
def test_16_counter_offer_approval():
    customer_token = get_auth_token("john@acmecorp.com")
    # Submit counter-offer with 25% discount (>20% threshold)
    counter_payload = {
        "proposedDiscount": 25.0,
        "comment": "Requesting 25% discount for bulk commitment."
    }
    res = client.post("/api/portal/quotes/QT-2026-0045/negotiate", json=counter_payload, headers={"Authorization": f"Bearer {customer_token}"})
    assert res.status_code == 200
    data = res.json()
    # High counter offer requires manager approval
    assert data["status"] == "Pending Approval"

# 17. Test Outcome 5: Real-Time Deal Health Scoring
def test_17_deal_health():
    res = client.get("/api/analytics/deal-health")
    assert res.status_code == 200
    deals = res.json()
    assert len(deals) > 0
    deal = deals[0]
    assert "health" in deal
    assert "overall" in deal["health"]
    assert "commercialScore" in deal["health"]
    assert "engagementScore" in deal["health"]

# 18. Test Outcome 5: Stalled Quotes Detection
def test_18_stalled_quotes():
    res = client.get("/api/analytics/stalled-quotes")
    assert res.status_code == 200
    stalled = res.json()
    assert isinstance(stalled, list)

# 19. Test Outcome 5: Discount Anomaly Detection
def test_19_discount_anomalies():
    res = client.get("/api/analytics/discount-anomalies")
    assert res.status_code == 200
    anomalies = res.json()
    assert isinstance(anomalies, list)
    # QT-2026-0042 has 25% discount which exceeds Acme Corp 15% tier limit -> flagged!
    found = any(a["id"] == "QT-2026-0042" for a in anomalies)
    assert found is True

# 20. Test Customer Data Isolation (Security)
def test_20_customer_data_isolation():
    customer_token = get_auth_token("john@acmecorp.com")
    # QT-2026-0043 belongs to CyberSystems Inc, NOT Acme Corp
    res = client.get("/api/portal/quotes/QT-2026-0043", headers={"Authorization": f"Bearer {customer_token}"})
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]
