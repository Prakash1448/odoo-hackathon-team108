# Customer Negotiation Workflow - Quick Start Guide

## For Customers

### How to Negotiate Discount

1. **Login to Customer Portal**
   - Go to your quotations list
   - Click quotation with status "Sent"

2. **Click "Negotiate Terms"**
   - Enter desired discount percentage (e.g., 12%)
   - Add reason (optional)
   - Click "Submit Negotiation"

3. **Wait for Response**
   - Status will show:
     - "Under Negotiation" → Auto-approved, sales rep can confirm
     - "Pending Manager Approval" → Manager reviewing, you'll be notified

4. **Next Steps**
   - If approved: You'll see in portal and can accept
   - If rejected: Reason provided, can submit new request
   - If under negotiation: Sales rep may counter-offer

---

## For Sales Reps

### How to Respond to Customer Negotiation

1. **Check Your Dashboard**
   - View → Quotations
   - Filter by "Under Negotiation" or "Pending Approval" status

2. **Open Quote Detail**
   - Click "View" button
   - See customer's negotiation history in timeline
   - See proposed discount, message, and margin impact

3. **Send Response to Customer**
   - Scroll to "Send Response to Customer" section
   - Enter your message
   - Optional: propose counter discount
   - Click "Send Response"

4. **Track Status**
   - Quote status updates in real-time
   - Timeline shows all messages (yours + customer's)

---

## For Sales Managers

### Manager Approval Workflow

#### Step 1: Review Pending Approvals
```
Menu → Approvals → View Queue
```

See all customer negotiations requiring approval with:
- Customer name
- Original discount vs requested
- Allowed threshold
- Margin impact
- Customer reason

#### Step 2: Make Decision

**To APPROVE:**
```
Click [APPROVE] → Add optional comments → Submit
```
- Quote status: "Approved"
- Sales rep gets notification
- Upsell recommendations become available

**To REJECT:**
```
Click [REJECT] → Enter reason → Submit
```
- Quote status: "Rejected"
- Customer sees reason
- Can re-submit new negotiation

**To REQUEST REVISION:**
```
Click [RETURN] → Enter specific feedback → Submit
```
- Quote status: "Draft" (reverted for editing)
- Sales rep can revise and re-submit

#### Step 3: (If Approved) Manage Upsells

1. **See Upsell Recommendations**
   - After you approve, recommendations auto-generate
   - Shows products that pair well with quote

2. **Add Products to Upsell**
   - Click [ADD TO QUOTE] for recommended product
   - Totals auto-recalculate
   - Margins updated

3. **Handle Re-Approval (if needed)**
   - If adding upsell exceeds threshold: reverts to approval
   - You'll see it back in your queue
   - Review new totals and decide again

---

## Key Concepts

### Auto-Approval (No Manager Needed)
```
Customer proposes discount ≤ tier limit
        ↓
Margin still ≥ 20%
        ↓
Status: "Under Negotiation"
        ↓
Sales rep can accept and confirm
```

**Example**: SMB customer proposes 8% when limit is 10% → AUTO APPROVED

---

### Manager Approval Required
```
Customer proposes discount > tier limit
        OR
Margin would drop below 20%
        ↓
Status: "Pending Approval"
        ↓
Manager reviews in approval queue
        ↓
Manager: APPROVE / REJECT / REQUEST REVISION
```

**Example**: SMB customer proposes 15% when limit is 10% → MANAGER APPROVAL NEEDED

---

### Upsell Recommendations
```
Manager approves negotiation
        ↓
System generates recommendations
        ↓
Manager sees upsell options
        ↓
Manager: ADD TO QUOTE or DISMISS
        ↓
If adding upsell exceeds threshold:
        ↓
Quote returns to manager approval
```

---

### Edge Case: Re-Approval on Upsell
```
Quote: 15% discount, margin = 22% → APPROVED

Manager adds upsell product
        ↓
Margin drops to 18% (below 20% limit)
        ↓
Quote: "Pending Approval" (reverted!)
        ↓
Manager re-reviews and re-approves
```

**Purpose**: Prevents silently approving quotes that violate policy

---

## API Quick Reference

### Customer Proposes Discount
```bash
POST /api/portal/quotes/{quote_id}/negotiate
{
  "proposedDiscount": 15,
  "comment": "Multi-year commitment discount"
}

Response:
{
  "status": "Pending Approval",  # or "Under Negotiation"
  "approvalRequired": true,      # or false
  "proposedAmount": 42500.00
}
```

### Manager Gets Approval Queue
```bash
GET /api/approvals

Response: [
  {
    "quoteId": "QT-2026-abc",
    "customer": "Acme Corp",
    "discount": 15,
    "status": "Pending Approval",
    "reason": "Discount exceeds tier limit"
  }
]
```

### Manager Approves
```bash
POST /api/approvals/{approval_id}/approve
{
  "comments": "Approved for strategic account"
}
```

### Get Upsell Recommendations
```bash
GET /api/recommendations/quotes/{quote_id}/approved

Response: [
  {
    "title": "Premium Support",
    "impact": { "marginImpact": -2.1 },
    "productRef": "p-5"
  }
]
```

### Add Upsell to Quote
```bash
POST /api/quotes/{quote_id}/add-upsell
{
  "productId": "p-5",
  "quantity": 1
}

Response:
{
  "quote": {
    "amount": 44200,
    "margin": 21.3,
    "status": "Approved"
  }
}
```

---

## Common Scenarios

### Scenario: Customer Wants 12% Discount (Tier Limit 10%)

```
Step 1: Customer submits 12% discount request
        ↓
Step 2: System checks: 12% > 10% limit
        ↓
Step 3: Status: "Pending Approval"
        ↓
Step 4: Manager sees in approval queue
        ↓
Step 5: Manager clicks APPROVE
        ↓
Step 6: Status: "Approved"
        ↓
Step 7: Upsell recommendations appear
        ↓
Step 8: Manager adds "Premium Support" upsell
        ↓
Step 9: Quote total recalculates: $44,200
        ↓
Step 10: Margin: 21.3% (still > 20%, OK)
        ↓
Step 11: Status stays "Approved"
        ↓
Step 12: Customer accepts and order created
```

### Scenario: Upsell Causes Re-Approval

```
Setup: Quote approved with 15% discount, margin=22%

Step 1: Manager adds expensive upsell ($5k, 5% margin)
        ↓
Step 2: System recalculates
        ↓
Step 3: New margin: 18% (below 20% threshold)
        ↓
Step 4: Status reverts to "Pending Approval"
        ↓
Step 5: Approval record reset (decided_by_user_id = null)
        ↓
Step 6: Manager sees it back in approval queue
        ↓
Step 7: Manager re-reviews and re-approves
        ↓
Step 8: Status: "Approved" (final)
```

---

## Troubleshooting

### Q: Why is the quote "Pending Approval" for such a small discount?

**A**: Check if ApprovalRule has other triggers:
- Margin might be below minimum
- Amount might exceed threshold
- Product category might have stricter rules

**Solution**: Increase margin or reduce quantity

---

### Q: Upsell product not appearing in recommendations

**A**: Possible causes:
- No matching UpsellRule configured
- Product already in quote
- Product excluded from recommendations

**Solution**: Check UpsellRule table or skip that product

---

### Q: Quote returned to "Pending Approval" after adding upsell

**A**: This is correct! Adding upsell reduced margin below 20%

**Expected**: Manager must re-review and re-approve

**Solution**: Either reduce upsell quantity or accept lower margin

---

### Q: Can't approve - getting permission error

**A**: Verify manager has correct role
- Endpoint requires "sales-manager" or "finance" role
- Check user role in database: `SELECT role FROM users WHERE id = ?`

**Solution**: Assign sales-manager role to approver

---

## Timeline & Audit Trail

Every decision is recorded:

```
Quote created:           created_at
Customer negotiates:     NegotiationLog.created_at
Manager approves:        Approval.decided_at, decided_by_user_id
Manager may re-approve:  New Approval record
```

**Audit**: Fully traceable who made what decision when

---

## Contact Support

For questions or issues:
1. Check approval_rules table configuration
2. Verify upsell_rules are configured correctly
3. Check customer tier max_auto_approval_discount
4. Review margin calculations match expectations
5. Contact: support@dealflow360.com

---

**Questions?** See full documentation in `NEGOTIATION_WORKFLOW_TEST_PLAN.md`
