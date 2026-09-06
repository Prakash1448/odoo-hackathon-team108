# Customer Negotiation Feature - Complete Implementation

## Overview
Successfully implemented a two-way negotiation system where customers can propose discounts on quotations and Sales Reps can respond with counter-offers. All messages appear in a shared timeline visible to both parties.

---

## Feature Flow

### 1. Customer Initiates Negotiation
**Path:** Customer Portal → Quotations → View Quote → "Negotiate Terms" button

**Steps:**
1. Customer logs into Customer Portal
2. Navigates to quotations dashboard
3. Views a quotation with status "Sent" or "Under Negotiation"
4. Clicks "Negotiate Terms" button
5. Modal opens with discount proposal form
6. Enters:
   - Proposed Discount % (1-99%)
   - Optional message explaining reasoning
7. Clicks "Submit Counter Offer"

**Backend Processing:**
- Endpoint: `POST /api/portal/quotes/{id}/negotiate`
- Authentication: Customer user (get_current_user)
- Creates NegotiationLog entry with sender_type="Customer"
- Validates discount range (1-99%)
- Business Rule: If discount > 20%, sets quote status to "Pending Approval" (manager review required)
- Otherwise: Sets quote status to "Under Negotiation"
- Returns success with proposed amount calculation

**Result:**
- Discount proposal stored in NegotiationLog
- Status updated automatically
- If > 20%: Creates Approval record for manager review
- Customer sees confirmation: "Counter offer submitted successfully!"

---

### 2. Sales Rep Views Customer Negotiation
**Path:** Sales → Quotations → View Quote (modal)

**Steps:**
1. Sales Rep logs into Sales Dashboard
2. Navigates to Quotations page
3. Sees quotation with status "Under Negotiation" or "Pending Approval"
4. Clicks "View" button to open detail modal

**What Sales Rep Sees:**
- Quote Summary: Amount, current discount, status
- **Negotiation History Timeline:**
  - Initial "Quote Sent" entry
  - Each message from customer with proposed discount and reasoning
  - Each message from sales team with responses and counter-offers
  - All timestamped with sender name

**Backend Process:**
- Endpoint: `GET /api/quotes/{id}` or `GET /api/portal/quotes/{id}`
- Returns format_quote_response with negotiationLog array
- NegotiationLog includes all entries from both customer and sales team
- Each entry contains: sender_name, message, proposed_discount, proposed_amount, created_at

---

### 3. Sales Rep Responds to Negotiation
**Path:** Sales → Quotations → View Quote Modal → "Send Response to Customer" section

**Steps:**
1. Sales Rep sees negotiation timeline
2. Scrolls to "Send Response to Customer" section
3. Enters:
   - Message: Response/counter-offer text (required)
   - Counter Discount % (optional): Alternative discount offer
4. Clicks "Send Response" button
5. Response is added to negotiation log
6. Quote details refresh automatically

**Backend Processing:**
- Endpoint: `POST /api/portal/quotes/{id}/negotiate/respond`
- Authentication: sales-rep, sales-manager, or admin role (require_roles)
- Creates NegotiationLog entry with sender_type="Sales"
- Sets sender_name to current user (Sales Rep/Manager name)
- Stores message and counter discount
- Maintains quote status as "Under Negotiation" or "Pending Approval"
- Returns success response

**Result:**
- Response added to NegotiationLog
- Immediately visible in timeline
- Status unchanged (stays in negotiation state)
- Alert: "Response sent successfully!"

---

### 4. Customer Sees Sales Rep Responses
**Path:** Customer Portal → Quotations → View Quote

**Timeline Display:**
1. Customer refreshes their negotiation page (or views after response)
2. Sees complete timeline including:
   - "Quote Sent" - initial terms
   - Customer's proposed discount message
   - Sales Rep's response message with counter-offer
   - Any subsequent back-and-forth

**Frontend Display:**
- Visual timeline in sidebar (right column)
- Each entry shows:
  - Sender name (implies who sent it)
  - Message content
  - Timestamp
  - Proposed discount if included
- Timeline flows chronologically
- Real-time updates when modal is refreshed

---

## Technical Implementation

### Database Schema
**NegotiationLog Table:**
```
id (UUID)
quote_id (FK to Quote)
sender_type (ENUM: "Customer", "Sales")
sender_name (VARCHAR)
message (TEXT)
proposed_discount (DECIMAL)
proposed_amount (DECIMAL)
created_at (DATETIME)
```

### API Endpoints

#### Customer Proposes Discount
```
POST /api/portal/quotes/{id}/negotiate
Authorization: Bearer {customer_token}
Content-Type: application/json

Request:
{
  "proposedDiscount": 15,
  "comment": "Please consider 15% discount for bulk order"
}

Response:
{
  "success": true,
  "message": "Counter offer submitted successfully and logged to negotiation history",
  "status": "Under Negotiation",
  "proposedAmount": 42500
}
```

#### Sales Rep Responds
```
POST /api/portal/quotes/{id}/negotiate/respond
Authorization: Bearer {sales_rep_token}
Content-Type: application/json

Request:
{
  "comment": "We can offer 12% discount for this order",
  "proposedDiscount": 12
}

Response:
{
  "success": true,
  "message": "Response added to negotiation history",
  "status": "Under Negotiation",
  "sender": "John Smith"
}
```

#### Get Quote with Negotiation Timeline
```
GET /api/portal/quotes/{id}
Authorization: Bearer {customer_or_salesrep_token}

Response:
{
  "id": "quote-123",
  "customer": "Acme Corp",
  "amount": 50000,
  "status": "Under Negotiation",
  "negotiationLog": [
    {
      "sender": "Customer Portal",
      "message": "Please consider 15% discount for bulk order",
      "proposedDiscount": 15,
      "proposedAmount": 42500,
      "date": "2026-09-06T10:30:00"
    },
    {
      "sender": "John Smith",
      "message": "We can offer 12% discount for this order",
      "proposedDiscount": 12,
      "proposedAmount": 44000,
      "date": "2026-09-06T11:15:00"
    }
  ]
}
```

### Frontend Components

#### CustomerNegotiation.jsx (Customer Portal)
- Displays quotation detail
- Shows "Negotiate Terms" button for "Sent" status quotes
- Modal form: proposed discount % + message
- Validation: 1-99% discount range
- Warning: Discounts > 20% require manager approval
- Timeline sidebar showing all negotiations
- Auto-refresh after submitting counter-offer

#### Quotations.jsx (Sales Dashboard)
- "View" button to open quote detail modal
- Displays negotiation history timeline
- "Send Response to Customer" form section
- Response fields: message (required) + counter discount (optional)
- Auto-refresh after sending response
- Real-time list update

### Backend Services

#### NegotiationService.submit_counter_offer()
- Validates customer access to quote
- Validates discount range (1-99%)
- Creates NegotiationLog entry with sender_type="Customer"
- Calculates proposed total: subtotal * (1 - discount/100)
- Business logic: If discount > 20%, triggers manager approval
- Sets quote.status = "Pending Approval" or "Under Negotiation"
- Updates quote.updated_at and commits

#### format_quote_response()
- Iterates through quote.negotiation_logs
- Builds negotiationLog array with sender name, message, discounts, date
- Includes in quote response for both customer and sales portals

---

## Business Rules

### Discount Thresholds
- **< 20% discount**: Quote status → "Under Negotiation" (Sales Rep can approve)
- **> 20% discount**: Quote status → "Pending Approval" (Manager review required)
- Customer sees warning: "Discounts over 20% require managerial approval"

### Quote Status Transitions
```
Draft 
  ↓ (Send to customer)
Sent
  ↓ (Customer proposes discount)
Under Negotiation / Pending Approval (depending on discount %)
  ↓ (Customer accepts or all parties agree)
Confirmed
  ↓ (System creates Order)
Processing
```

### Visibility Rules
- **Customer**: Can see ONLY their own quotations and negotiations
- **Sales Rep**: Can see all quotations assigned to them and respond to negotiations
- **Sales Manager**: Can see all quotations and approve large discounts
- **Admin**: Can see all quotations

---

## Feature Verification Checklist

✅ **Backend Endpoint Verified**
- POST /api/portal/quotes/{id}/negotiate creates NegotiationLog
- Discount validation (1-99%)
- Manager approval trigger (> 20%)
- Transaction handling with db.commit()

✅ **Customer UI Verified**
- "Negotiate Terms" button appears on "Sent" status quotes
- Modal form with discount % and message
- Form validation prevents invalid inputs
- "Submit Counter Offer" sends to backend
- Success alert and auto-refresh

✅ **Sales Rep UI Verified**
- "View" button opens quote detail modal
- Negotiation history timeline displays all messages
- "Send Response" form with message and optional counter discount
- Response button wired to backend endpoint
- Auto-refresh shows new response in timeline

✅ **Customer Timeline Verified**
- Sees complete negotiation history
- Shows both customer proposals and sales rep responses
- Timestamped entries
- Real-time updates on refresh

✅ **Data Flow Verified**
- Customer propose → creates NegotiationLog (sender_type="Customer")
- Sales rep respond → creates NegotiationLog (sender_type="Sales")
- format_quote_response returns all negotiationLog entries
- Timeline displays all entries chronologically

---

## How to Test

### Test Scenario: Full Negotiation Flow

1. **Customer Login:**
   - Email: customer@dealflow360.com
   - Password: customer123

2. **Customer Proposes Discount:**
   - Navigate to Customer Portal
   - Click quotation with status "Sent"
   - Click "Negotiate Terms"
   - Enter: Discount % = 15, Message = "Please consider 15% discount"
   - Click "Submit Counter Offer"
   - Verify: "Counter offer submitted successfully"

3. **Sales Rep Views Negotiation:**
   - Logout customer
   - Login as Sales Rep
   - Email: salesman@dealflow360.com
   - Password: salesman123
   - Navigate to Sales → Quotations
   - Find quote with "Under Negotiation" status
   - Click "View"
   - Verify: See customer's message in timeline with proposed discount

4. **Sales Rep Responds:**
   - In modal, scroll to "Send Response to Customer"
   - Enter: Message = "We can offer 12%", Discount = 12
   - Click "Send Response"
   - Verify: "Response sent successfully"
   - Verify: Response appears in timeline

5. **Customer Sees Response:**
   - Logout sales rep
   - Login as customer again
   - Navigate to same quotation
   - Verify: See sales rep's response message in timeline
   - Verify: Timeline shows complete back-and-forth

---

## Files Modified/Created

### Backend
- `backend/app/routers/portal.py` - Added respond_to_negotiation endpoint
- `backend/app/routers/quotes.py` - format_quote_response includes negotiationLog

### Frontend
- `src/pages/portal/CustomerNegotiation.jsx` - Customer negotiation UI (already working)
- `src/pages/sales/Quotations.jsx` - Sales Rep response modal (fixed JSX parse error)
- `src/pages/portal/CustomerDashboard.jsx` - Quote listing with negotiation status

### Services
- `src/services/portalService.js` - submitNegotiation() for customer proposals

---

## Success Metrics

✅ Customers can initiate discount negotiations
✅ Sales Reps see customer negotiations in real-time
✅ Sales Reps can respond with counter-offers
✅ Customers see complete negotiation timeline
✅ All messages persist in database
✅ Timestamps show message sequence
✅ Approval workflow triggers for large discounts
✅ Quote status updates correctly during negotiation
✅ No errors in browser console
✅ Responsive design works on mobile

---

## Future Enhancements

1. **Email Notifications**: Notify parties when negotiation activity occurs
2. **Negotiation History Export**: Download negotiation timeline as PDF
3. **Automatic Approval**: Rules engine for auto-approving discounts under certain conditions
4. **Negotiation Analytics**: Reports on negotiation duration, discount trends
5. **Two-Way Messaging**: Real-time chat instead of discrete messages
6. **Document Attachment**: Allow attaching documents to negotiation messages
7. **Approval Chain**: Multiple approvers for very large discounts
8. **Negotiation Templates**: Pre-defined counter-offer templates for sales team

---

## Support & Troubleshooting

### Issue: Customer doesn't see "Negotiate Terms" button
**Solution:** Quote must have status "Sent" or "Under Negotiation". Check quote status in database.

### Issue: Sales Rep response not appearing in customer timeline
**Solution:** Refresh the customer portal page. Check browser developer tools for API errors.

### Issue: "Pending Approval" status not triggered for large discounts
**Solution:** Verify NegotiationService checks if discount > 20% threshold. Check Approval table for records.

### Issue: Negotiation log shows only customer messages, not sales rep responses
**Solution:** Verify respond_to_negotiation endpoint creates NegotiationLog entries. Check database for records with sender_type="Sales".

---

**Implementation Status: ✅ COMPLETE**

All features are implemented, tested, and ready for production use.
