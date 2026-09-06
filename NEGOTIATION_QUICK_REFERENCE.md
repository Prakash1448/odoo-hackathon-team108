# Customer Negotiation Feature - Quick Reference

## The Feature in 3 Steps

### 1️⃣ Customer Proposes Discount
```
Customer Portal → Quotations → View Quote → "Negotiate Terms" button
  ↓
Modal opens: Enter discount % + message
  ↓
Click "Submit Counter Offer"
  ↓
✓ Stored in database, status changes to "Under Negotiation"
✓ If discount > 20%: Status becomes "Pending Approval"
```

### 2️⃣ Sales Rep Sees & Responds
```
Sales Portal → Quotations → Click "View" button
  ↓
Modal shows: Negotiation Timeline (all customer/sales messages)
  ↓
Scroll to "Send Response" section → Enter message + optional counter discount
  ↓
Click "Send Response"
  ↓
✓ Added to timeline immediately
✓ Customer sees it on next refresh
```

### 3️⃣ Customer Sees Response
```
Customer Portal → Same Quotation → View
  ↓
See complete timeline with:
  • Customer's original proposal
  • Sales Rep's response
  • Any back-and-forth messages
  ↓
✓ All timestamped
✓ Shows who said what
```

---

## Key Information

| Aspect | Details |
|--------|---------|
| **Where Customer Negotiates** | Customer Portal → Quotations → View Quote → "Negotiate Terms" |
| **Where Sales Rep Responds** | Sales Portal → Quotations → View Quote → "Send Response" |
| **Timeline Visible To** | Both customer and sales rep (when viewing same quote) |
| **Discount Threshold** | <20%: "Under Negotiation" / >20%: "Pending Approval" |
| **Required Fields** | Customer: discount % + optional message; Sales Rep: message (optional: counter discount) |
| **Status Updates** | Automatic when discount proposed; stays in negotiation until accepted/rejected |

---

## API Endpoints

### Customer Proposes Discount
```
POST /api/portal/quotes/{quote-id}/negotiate
Body: { proposedDiscount: 15, comment: "message" }
Response: { status: "Under Negotiation", proposedAmount: 42500 }
```

### Sales Rep Responds
```
POST /api/portal/quotes/{quote-id}/negotiate/respond
Body: { comment: "message", proposedDiscount: 12 }
Response: { status: "Under Negotiation", sender: "John Smith" }
```

### Get Quote with Timeline
```
GET /api/portal/quotes/{quote-id}
Response includes: negotiationLog array with all messages
```

---

## Business Rules

✅ Customer can only negotiate quotes with status "Sent" or "Under Negotiation"
✅ Sales Rep can respond if quote is "Sent", "Under Negotiation", or "Pending Approval"
✅ Discounts > 20% auto-trigger manager approval
✅ Messages persist in database (audit trail)
✅ Timestamps show message sequence
✅ Customer sees only their own quotes
✅ Sales Rep sees assigned quotes

---

## Test Credentials

### Customer
- Email: customer@dealflow360.com
- Password: customer123

### Sales Rep
- Email: salesman@dealflow360.com
- Password: salesman123

### Sales Manager
- Email: manager@dealflow360.com
- Password: manager123

---

## Files Involved

**Backend:**
- `app/routers/portal.py` - Negotiation endpoints
- `app/routers/quotes.py` - format_quote_response (includes timeline)
- `app/services/negotiation_service.py` - Business logic

**Frontend:**
- `src/pages/portal/CustomerNegotiation.jsx` - Customer proposal UI
- `src/pages/sales/Quotations.jsx` - Sales Rep response UI
- `src/services/portalService.js` - API calls

**Database:**
- `NegotiationLog` table - All messages stored here

---

## Status: ✅ FULLY IMPLEMENTED & TESTED
