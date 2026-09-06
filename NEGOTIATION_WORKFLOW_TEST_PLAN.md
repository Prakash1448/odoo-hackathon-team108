# Customer Negotiation → Threshold → Approval → Upsell Workflow - TEST PLAN

## Complete Workflow Overview

```
CUSTOMER
   ↓
Open Quotation
   ↓
Request Negotiated Discount
   ↓
System Checks Threshold
   ↓
 ┌──────────────────────────────┐
 │                              │
 │ Discount <= Threshold        │ Discount > Threshold
 │                              │
 ↓                              ↓
AUTO APPROVED              MANAGER APPROVAL
 │                              │
 │                         ┌────┴────┐
 │                         ↓         ↓
 │                     APPROVE     REJECT
 │                         │
 └──────────────┬──────────┘
                ↓
       UPSELL RECOMMENDATION
                ↓
       Add / Dismiss Product
                ↓
       Recalculate Quote
                ↓
       Final Confirmation
                ↓
             ORDER
```

---

## Test Scenario 1: Within Threshold (AUTO APPROVED)

**Setup:**
- Customer Tier: SMB
- Max Auto-Approval Discount: 10%
- Current Quote Discount: 8%
- Customer Requests: 7% (within threshold)

**Expected Flow:**
1. Customer proposes 7% discount
2. Backend checks ApprovalRule: 7% <= 10% ✓
3. Quote status: "Under Negotiation" (NO manager approval needed)
4. System calculates margin with new discount
5. If margin OK: Status remains "Under Negotiation"

**Test Steps:**
```bash
# 1. Customer proposes discount within threshold
POST /api/portal/quotes/{quote_id}/negotiate
{
  "proposedDiscount": 7,
  "comment": "Request 7% for bulk order"
}

Expected Response:
{
  "success": true,
  "status": "Under Negotiation",
  "approvalRequired": false,
  "proposedAmount": 46500,
  "marginWithProposedDiscount": 22.5
}

# 2. Verify quote status
GET /api/quotes/{quote_id}

Expected:
- status: "Under Negotiation"
- customer_proposed_discount: 7
- NO approval record created
```

**Pass Criteria:**
- ✅ Status = "Under Negotiation"
- ✅ No Approval record in database
- ✅ customer_proposed_discount = 7
- ✅ Margin calculated correctly

---

## Test Scenario 2: Above Threshold (MANAGER APPROVAL REQUIRED)

**Setup:**
- Customer Tier: SMB
- Max Auto-Approval Discount: 10%
- Current Quote Discount: 8%
- Customer Requests: 15% (exceeds threshold)

**Expected Flow:**
1. Customer proposes 15% discount
2. Backend checks ApprovalRule: 15% > 10% ✗
3. Quote status: "Pending Approval"
4. Approval record created with required_role="sales-manager"
5. Manager sees in approval queue

**Test Steps:**
```bash
# 1. Customer proposes discount exceeding threshold
POST /api/portal/quotes/{quote_id}/negotiate
{
  "proposedDiscount": 15,
  "comment": "Customer requesting 15% for long-term contract"
}

Expected Response:
{
  "success": true,
  "status": "Pending Approval",
  "approvalRequired": true,
  "proposedAmount": 42500,
  "marginWithProposedDiscount": 18.5
}

# 2. Verify quote status
GET /api/quotes/{quote_id}

Expected:
- status: "Pending Approval"
- customer_proposed_discount: 15

# 3. Verify approval record created
GET /api/approvals

Expected:
- approval.status: "Pending Approval"
- approval.quote_id: matches quote ID
- approval.required_role: "sales-manager"
- approval.reason: contains reason for approval needed
```

**Pass Criteria:**
- ✅ Status = "Pending Approval"
- ✅ Approval record exists with correct role
- ✅ Reason field explains threshold exceeded
- ✅ Manager sees in approval queue

---

## Test Scenario 3: Manager Approves Negotiation

**Setup:**
- Quote status: "Pending Approval"
- Approval record exists
- Manager (sales-manager role) reviews and approves

**Expected Flow:**
1. Manager sees pending approval in queue
2. Reviews customer reason and proposal
3. Clicks APPROVE
4. Quote status → "Approved"
5. Approval record: status="Approved", decided_by_user_id set, decided_at set
6. Upsell recommendations become available

**Test Steps:**
```bash
# 1. Manager gets approval queue
GET /api/approvals
Authorization: Bearer {manager_token}

Expected:
[
  {
    "id": "app-xyz",
    "quoteId": "{quote_id}",
    "customer": "Acme Corp",
    "amount": 42500,
    "discount": 15,
    "status": "Pending Approval",
    "reason": "Discount 15.0% exceeds SMB limit (10.0%)"
  }
]

# 2. Manager approves
POST /api/approvals/{approval_id}/approve
{
  "comments": "Approved for long-term relationship"
}
Authorization: Bearer {manager_token}

Expected Response:
{
  "success": true,
  "message": "Quote {quote_id} approved successfully",
  "status": "Approved"
}

# 3. Verify quote status changed
GET /api/quotes/{quote_id}

Expected:
- status: "Approved"
- approval.status: "Approved"
- approval.decided_by_user_id: set to manager's ID
- approval.decided_at: timestamp
```

**Pass Criteria:**
- ✅ Approval status = "Approved"
- ✅ Quote status = "Approved"
- ✅ Manager ID recorded in approval
- ✅ Timestamp recorded

---

## Test Scenario 4: Manager Rejects Negotiation

**Setup:**
- Quote status: "Pending Approval"
- Approval record exists
- Manager reviews and decides to reject

**Expected Flow:**
1. Manager rejects with reason
2. Quote status → "Rejected"
3. Approval record: status="Rejected"
4. Quote gets rejection_reason
5. Customer sees notification (optional: in next iteration)

**Test Steps:**
```bash
# 1. Manager rejects
POST /api/approvals/{approval_id}/reject
{
  "reason": "Margin too low for this customer segment"
}
Authorization: Bearer {manager_token}

Expected Response:
{
  "success": true,
  "message": "Quote {quote_id} rejected",
  "status": "Rejected"
}

# 2. Verify quote status changed
GET /api/quotes/{quote_id}

Expected:
- status: "Rejected"
- rejection_reason: "Margin too low for this customer segment"
- approval.status: "Rejected"
```

**Pass Criteria:**
- ✅ Quote status = "Rejected"
- ✅ Rejection reason stored
- ✅ Approval.status = "Rejected"
- ✅ No order created

---

## Test Scenario 5: Upsell Product Addition & Recalculation

**Setup:**
- Quote status: "Approved"
- Manager now sees upsell recommendations
- Manager adds recommended product to quote
- Should recalculate totals and verify still approved

**Expected Flow:**
1. Manager gets upsell recommendations for approved quote
2. Sees "Premium Support Plan" recommended
3. Clicks "ADD TO QUOTE"
4. Product added to quote items
5. All totals recalculated (subtotal, discount amount, final amount, margin)
6. ApprovalRule re-evaluated
7. If still within margin/discount: stays "Approved"
8. If exceeds threshold: returns to "Pending Approval"

**Test Steps:**
```bash
# 1. Manager gets upsell recommendations for approved quote
GET /api/recommendations/quotes/{quote_id}/approved
Authorization: Bearer {manager_token}

Expected Response:
[
  {
    "id": "rec-upsell-1",
    "type": "Upsell",
    "title": "Premium Support Plan",
    "explanation": "Pairs well with hardware purchase",
    "confidence": 89,
    "impact": {
      "revenue": 2000,
      "cost": 400,
      "margin": 1600,
      "marginImpact": -2.1
    },
    "productRef": "p-5"
  }
]

# 2. Manager adds upsell product to quote
POST /api/quotes/{quote_id}/add-upsell
{
  "productId": "p-5",
  "quantity": 1
}
Authorization: Bearer {manager_token}

Expected Response:
{
  "success": true,
  "message": "Product added to quote and totals recalculated",
  "quote": {
    "id": "{quote_id}",
    "subtotal": 52000,
    "discount": 15,
    "discountAmount": 7800,
    "amount": 44200,
    "margin": 21.3,
    "status": "Approved",
    "lines": [
      // original items
      {
        "productId": "p-5",
        "productName": "Premium Support Plan",
        "quantity": 1,
        "lineTotal": 2000,
        "lineMargin": 80.0
      }
    ]
  }
}

# 3. Verify quote in database has new item
GET /api/quotes/{quote_id}

Expected:
- status: "Approved" (if margin still OK)
- amount: 44200 (recalculated)
- margin: 21.3 (recalculated)
- items: includes new product
```

**Pass Criteria:**
- ✅ Upsell product added to quote_items table
- ✅ All totals recalculated correctly
- ✅ Quote status: "Approved" if margin OK
- ✅ Margin impact calculated correctly
- ✅ Original discount maintained

---

## Test Scenario 6: Re-Negotiation & Edge Case (Upsell Exceeds Threshold)

**Setup:**
- Quote was "Approved"
- Upsell product added that EXCEEDS margin threshold
- System should re-trigger approval

**Expected Flow:**
1. Quote approved with 15% discount
2. Add upsell that reduces margin below 20% threshold
3. System detects approval rules now violated
4. Quote returns to "Pending Approval"
5. New approval record created/updated
6. Manager must re-approve

**Test Steps:**
```bash
# Setup: Create scenario where upsell pushes margin below threshold
# Quote: $50k, approved at 15% discount, margin=22%
# Add expensive-to-produce upsell product with low margin
# Expected new margin: 18% (below 20% threshold)

# 1. Add upsell that exceeds threshold
POST /api/quotes/{quote_id}/add-upsell
{
  "productId": "p-expensive-low-margin",
  "quantity": 1
}
Authorization: Bearer {manager_token}

Expected Response (EDGE CASE):
{
  "success": true,
  "message": "Product added to quote and totals recalculated",
  "quote": {
    "status": "Pending Approval",  ← CHANGED BACK!
    "margin": 18.5,  ← Below 20% threshold
    "approvalRequired": true
  }
}

# 2. Verify approval record updated
GET /api/approvals

Expected:
- approval.status: "Pending Approval"
- approval.reason: "Upsell product added. Blended margin 18.5% falls below minimum 20.0% threshold"
- approval.decided_by_user_id: null (reset for new review)

# 3. Manager re-approves (or rejects)
POST /api/approvals/{approval_id}/approve
{
  "comments": "Margin acceptable with volume discount to come"
}
Authorization: Bearer {manager_token}

Expected:
- approval.status: "Approved"
- quote.status: "Approved"
```

**Pass Criteria:**
- ✅ Quote reverts to "Pending Approval" when threshold exceeded
- ✅ Margin recalculated correctly (18.5%)
- ✅ Approval record reset (decided_by_user_id = null, decided_at = null)
- ✅ Manager can re-approve
- ✅ History preserved (original approval + new approval recorded)

---

## Regression Testing - Verify No Existing Functionality Broken

### Existing Feature 1: Basic Quote Creation Still Works

```bash
# Create a simple quote (no negotiation)
POST /api/quotes
{
  "customer": "Acme Corp",
  "lines": [
    {
      "productId": "p-1",
      "quantity": 10,
      "discount": 5
    }
  ]
}
Authorization: Bearer {sales_rep_token}

Expected:
✅ Quote created successfully
✅ Status is "Sent" or "Approved" (depending on rules)
✅ No negotiation logs
✅ No approval needed (if within standard thresholds)
```

### Existing Feature 2: Manager Approval Queue Works

```bash
GET /api/approvals
Authorization: Bearer {manager_token}

Expected:
✅ Lists all pending approvals (from both negotiation and new quotes)
✅ Each approval shows correct quote details
✅ Approve/Reject endpoints work
```

### Existing Feature 3: Customer Can Still Accept Approved Quote

```bash
POST /api/portal/quotes/{quote_id}/confirm
Authorization: Bearer {customer_token}

Expected:
✅ Quote status → "Confirmed"
✅ Order created in orders table
✅ Order items created
✅ Invoicing initiated
```

### Existing Feature 4: Recommendations Still Work

```bash
# Preview recommendations while building quote
POST /api/recommendations/preview
{
  "items": [
    {
      "productId": "p-1",
      "quantity": 5,
      "discount": 10
    }
  ],
  "discount": 10
}

Expected:
✅ Returns upsell recommendations
✅ Margin impact calculated
✅ Only non-included products recommended
```

### Existing Feature 5: Quote Recalculation Works

```bash
# Update quote with new items
POST /api/quotes
{
  "id": "{quote_id}",  # Update existing
  "customer": "Acme Corp",
  "lines": [
    {
      "productId": "p-1",
      "quantity": 20,  # Changed quantity
      "discount": 8
    },
    {
      "productId": "p-2",
      "quantity": 5,
      "discount": 8
    }
  ]
}
Authorization: Bearer {sales_rep_token}

Expected:
✅ Quote recalculated
✅ All line items updated
✅ Subtotal, discount_amount, amount, margin all correct
✅ Approval rules re-evaluated
```

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Backend running on port 8000
- [ ] Database seeded with test customers (SMB, Enterprise tiers)
- [ ] Test users created (sales-rep, sales-manager, customer)
- [ ] ApprovalRule records configured
- [ ] UpsellRule records configured
- [ ] Products created in database

### Test Scenario Execution
- [ ] Test 1: Within Threshold (AUTO APPROVED)
- [ ] Test 2: Above Threshold (MANAGER APPROVAL REQUIRED)
- [ ] Test 3: Manager Approves
- [ ] Test 4: Manager Rejects
- [ ] Test 5: Upsell Product Addition
- [ ] Test 6: Re-Negotiation Edge Case

### Regression Testing
- [ ] Basic quote creation works
- [ ] Manager approval queue works
- [ ] Customer acceptance works
- [ ] Recommendations work
- [ ] Quote recalculation works
- [ ] All existing statuses still work

### Final Verification
- [ ] No errors in backend logs
- [ ] No database constraint violations
- [ ] All API responses have correct structure
- [ ] All calculations correct to 2 decimal places
- [ ] Timestamps recorded correctly
- [ ] User IDs properly tracked

---

## Expected Database State After Each Test

### After Test 1 (Within Threshold)
```sql
SELECT * FROM quotes WHERE id = '{quote_id}';
-- status: "Under Negotiation"
-- customer_proposed_discount: 7
-- margin: 22.5

SELECT * FROM approvals WHERE quote_id = '{quote_id}';
-- (empty - no approval needed)

SELECT * FROM negotiation_logs WHERE quote_id = '{quote_id}';
-- 1 record: sender_type="Customer", proposed_discount=7
```

### After Test 2 (Above Threshold)
```sql
SELECT * FROM quotes WHERE id = '{quote_id}';
-- status: "Pending Approval"
-- customer_proposed_discount: 15

SELECT * FROM approvals WHERE quote_id = '{quote_id}';
-- 1 record: status="Pending Approval", required_role="sales-manager"

SELECT * FROM negotiation_logs WHERE quote_id = '{quote_id}';
-- 1 record: sender_type="Customer", proposed_discount=15
```

### After Test 3 (Manager Approves)
```sql
SELECT * FROM quotes WHERE id = '{quote_id}';
-- status: "Approved"
-- customer_proposed_discount: 15

SELECT * FROM approvals WHERE quote_id = '{quote_id}';
-- 1 record: status="Approved", decided_by_user_id=<manager_id>, decided_at=<timestamp>
```

### After Test 5 (Upsell Added)
```sql
SELECT * FROM quote_items WHERE quote_id = '{quote_id}';
-- Original items + 1 new item (p-5)
-- Total items: 4 (or whatever count)

SELECT * FROM quotes WHERE id = '{quote_id}';
-- amount: 44200 (recalculated)
-- margin: 21.3 (recalculated)
-- status: "Approved"
```

### After Test 6 (Re-Approval)
```sql
SELECT * FROM quotes WHERE id = '{quote_id}';
-- status: "Pending Approval" (reverted!)
-- margin: 18.5 (below 20% threshold)

SELECT * FROM approvals WHERE quote_id = '{quote_id}';
-- LATEST record: status="Pending Approval", decided_by_user_id=null, decided_at=null
-- PREVIOUS record: status="Approved" (historical)
```

---

## API Response Format Validation

### Quote Response Format
```json
{
  "id": "QT-2026-xxxx",
  "customerId": "c-1",
  "customer": "Acme Corp",
  "owner": "John Smith",
  "subtotal": 50000.00,
  "discount": 15.00,
  "discountAmount": 7500.00,
  "amount": 42500.00,
  "cost": 25000.00,
  "margin": 22.35,
  "risk": "Moderate",
  "riskScore": 50,
  "status": "Pending Approval",
  "rejectionReason": null,
  "customerProposedDiscount": 15.00,
  "lines": [...],
  "negotiationLog": [...],
  "createdAt": "2026-09-06T10:00:00",
  "updatedAt": "2026-09-06T10:30:00"
}
```

### Approval Response Format
```json
{
  "id": "app-xyz123",
  "quoteId": "QT-2026-xxxx",
  "customer": "Acme Corp",
  "amount": 42500.00,
  "discount": 15.00,
  "margin": 22.35,
  "status": "Pending Approval",
  "requiredRole": "sales-manager",
  "requestedBy": "Alice (Sales Rep)",
  "reason": "Discount 15.0% exceeds SMB limit (10.0%); Triggered rule: 'Enterprise Discount'",
  "date": "2026-09-06T10:30:00"
}
```

### Recommendation Response Format
```json
[
  {
    "id": "rec-upsell-1",
    "type": "Upsell",
    "title": "Premium Support Plan",
    "explanation": "Pairs well with hardware purchase",
    "confidence": 89,
    "impact": {
      "revenue": 2000.00,
      "cost": 400.00,
      "margin": 1600.00,
      "marginImpact": -2.1
    },
    "recommendedAction": "Add to Quote",
    "productRef": "p-5"
  }
]
```

---

## Success Criteria Summary

✅ All 6 test scenarios pass
✅ Edge case (re-approval on upsell) handled correctly
✅ No existing features broken
✅ All calculations accurate to 2 decimal places
✅ All database records properly created/updated
✅ All API responses properly formatted
✅ Role-based access control enforced
✅ Audit trail maintained (timestamps, user IDs)
