# DealFlow360 Customer Module - Testing Guide

## Complete End-to-End Customer Flow Test

This document describes the complete customer journey through the DealFlow360 Customer Module.

### Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Backend Server** (Terminal 1)
   ```bash
   npm run server
   ```
   - Server will initialize SQLite database automatically
   - Runs on http://localhost:5000
   - Check for: "Customer Module Server running on http://localhost:5000"

3. **Start Frontend** (Terminal 2)
   ```bash
   npm run client
   ```
   - Runs on http://localhost:5173
   - Check for: "ready in X ms"

4. **Add Test Data** (Terminal 3, after servers are running)
   ```bash
   node backend/scripts/addTestData.js
   ```
   - Creates test customer account
   - Creates sample sales request
   - Creates sample quotation

---

## Test Scenario: Complete Customer Journey

### Step 1: Customer Registration

**Action**: Navigate to http://localhost:5173/register

**Fill Form**:
- Full Name: `Rajesh Kumar`
- Company Name: `XYZ Manufacturing Ltd`
- Email: `rajesh.xyz@example.com`
- Phone: `+919876543210`
- Password: `MySecurePassword123`
- Confirm Password: `MySecurePassword123`

**Expected Results**:
- ✓ Form validates all fields
- ✓ Email format is validated
- ✓ Password must be 8+ chars with uppercase, lowercase, and number
- ✓ Passwords must match
- ✓ On successful registration, redirected to Dashboard
- ✓ Token stored in localStorage
- ✓ New customer record created in database

**Verify Backend**:
- Customer inserted into `customers` table
- Password hashed with bcrypt
- JWT token generated and returned

---

### Step 2: Customer Login

**Action**: Navigate to http://localhost:5173/login

**Fill Form**:
- Email: `rajesh.xyz@example.com` (or use test account: rajesh@abctech.com)
- Password: `MySecurePassword123` (or test account: TestPassword123)

**Expected Results**:
- ✓ Valid credentials accepted
- ✓ Redirected to Dashboard
- ✓ Token stored in localStorage
- ✓ Displays error for invalid email/password
- ✓ Can register new account via "Register" link

**Security Test**:
- Try invalid password → Error: "Invalid email or password"
- Try non-existent email → Error: "Invalid email or password"

---

### Step 3: View Customer Dashboard

**Action**: After login, view Dashboard (http://localhost:5173/dashboard)

**Expected Results**:
- ✓ Header shows DealFlow360 logo and navigation
- ✓ Dashboard displays 6 summary cards:
  - Total Requests: Shows count
  - Pending Requests: Shows count
  - Quotations Received: Shows count
  - Quotations Awaiting Action: Shows count
  - Discount Requests: Shows count
  - Accepted Quotations: Shows count
- ✓ Recent Requests table shows all customer's requests
- ✓ "Create Request" button visible
- ✓ Each request shows: ID, Title, Quantity, Status, Date, View link

**Test Database Connection**:
- Dashboard numbers reflect actual database data
- If test data added, should see at least 1 request in table
- Status shows correct value from database

---

### Step 4: Create New Sales Request

**Action**: Click "Create Request" button on Dashboard or navigate to /requests/new

**Fill Form**:
- Request Title: `60 High-Performance Desktop Computers`
- Product/Requirement: `Desktop Computer`
- Quantity: `60`
- Specifications: `Intel i9 13th Gen, 32GB RAM, 1TB NVMe SSD, RTX 4080, Windows 11 Pro`
- Additional Notes: `Needed for software development team. Include 3-year warranty and on-site support.`
- Expected Delivery Date: `2026-09-30`

**Expected Results**:
- ✓ All required fields validated on submit
- ✓ Quantity must be positive integer
- ✓ Success message shown: "Request created successfully! Redirecting..."
- ✓ Redirected to request detail page
- ✓ New Request ID generated (REQ-XXXXXX format)
- ✓ Status shows "Submitted"
- ✓ Created date displayed

**Verify Backend**:
- New record in `sales_requests` table
- `status` = 'Submitted'
- `customer_id` matches logged-in customer
- `created_at` timestamp set

---

### Step 5: View My Requests

**Action**: Navigate to /requests

**Expected Results**:
- ✓ Table shows all requests for this customer
- ✓ Columns: Request ID, Requirement, Quantity, Status, Created Date, Action
- ✓ Each request has a "View" link
- ✓ Can create new request from this page
- ✓ Status badge color-coded:
  - Blue: Submitted
  - Orange: Under Review
  - Green: Quotation Received/Approved/Accepted
  - Red: Negotiation

---

### Step 6: View Request Details

**Action**: Click "View" on any request or navigate to /requests/{requestId}

**Expected Results**:
- ✓ Breadcrumb navigation shows "← Back to Requests"
- ✓ Request title and ID displayed
- ✓ Status badge shown
- ✓ Details grid shows:
  - Product/Requirement
  - Quantity
  - Created Date
  - Expected Delivery Date (if provided)
- ✓ Specifications and Additional Notes displayed
- ✓ If quotation exists, quotation section shown with:
  - Quotation ID
  - Total Amount (highlighted in blue)
  - Status badge
  - "View Full Quotation" button

**Test Without Quotation**:
- Message shows: "Your request has been submitted. A quotation will be generated soon."

---

### Step 7: Receive and View Quotation

**Prerequisites**: 
- Test data must be added (creates quotation automatically)
- OR simulate salesperson creating quotation

**For Testing**: Use test data quotation

**Action**: Click "View Full Quotation" or navigate to /quotations

**Expected Results - Quotations List**:
- ✓ Table shows all quotations
- ✓ Columns: Quotation ID, Request, Quantity, Status, Valid Until, Date, Action
- ✓ Status color-coded
- ✓ "View" link for each quotation

**Action**: Click "View" on a quotation to see /quotations/{quotationId}

**Expected Results - Quotation Detail**:
- ✓ Quotation ID and Request ID displayed
- ✓ Status badge shown
- ✓ Large, highlighted total amount displayed: "₹40,50,000" (example)
- ✓ Line Items table shows:
  - Product Name: "Business Laptop"
  - Quantity: 90
  - Unit Price: ₹50,000
  - Subtotal: ₹45,00,000
  - Discount: 10% (-₹4,50,000)
  - Tax: ₹0
  - Total: ₹40,50,000
- ✓ Summary section shows:
  - Subtotal: ₹45,00,000
  - Total Discount: -₹4,50,000 (in red)
  - Total: ₹40,50,000 (in blue, bold)
- ✓ Valid Until date displayed (if set)
- ✓ Terms & Notes displayed

**Verify Calculations**:
- Subtotal = Quantity × Unit Price
- Discount Amount = Subtotal × (Discount% / 100)
- Total = Subtotal - Discount Amount + Tax

---

### Step 8: Request Discount / Negotiate

**Action**: Click "Request Discount / Negotiate" button

**Expected Results**:
- ✓ Modal appears with form
- ✓ Shows current discount percentage
- ✓ Form has fields:
  - Requested Discount %
  - Reason for Request
  - Additional Message (optional)

**Fill Form**:
- Requested Discount: `15`
- Reason: `We are a bulk buyer with long-term commitment. Can you offer 15% discount for orders above 50 units?`
- Message: `We'd like to finalize this order quickly if discount is approved.`

**Expected Results**:
- ✓ Validation: discount must be 0-100
- ✓ Reason is required
- ✓ On submit: Modal closes
- ✓ Success message shown (if implemented)
- ✓ Page refreshes to show discount request
- ✓ Discount request appears in "Discount Requests" section with status "Pending Review"

**Verify Backend**:
- New record in `discount_requests` table
- `status` = 'Pending Review'
- `quotation_id` matches selected quotation
- `customer_id` matches logged-in customer
- Cannot submit another discount request while one is active

---

### Step 9: View Discount Request Status

**Action**: On Quotation Detail page, scroll to "Discount Requests" section

**Expected Results**:
- ✓ Shows all discount requests for this quotation
- ✓ Displays:
  - Requested: 15% (Current: 10%)
  - Status badge: "Pending Review"
  - Reason provided
  - Created date
- ✓ Status progresses through: Pending Review → Approved/Rejected/Requires Manager Approval

---

### Step 10: Accept Final Quotation

**Action**: Click "Accept Quotation" button

**Expected Results**:
- ✓ Confirmation modal appears
- ✓ Modal shows:
  - Quotation ID
  - Total amount in large font
  - Confirmation message
  - "Yes, Accept Quotation" and "Cancel" buttons

**Action**: Click "Yes, Accept Quotation"

**Expected Results**:
- ✓ Modal closes
- ✓ Quotation status changes to "Accepted"
- ✓ Green success badge or message shown
- ✓ "Accept Quotation" button becomes unavailable
- ✓ Shows: "✓ Quotation Accepted on [DATE]"
- ✓ Cannot accept already-accepted quotation

**Verify Backend**:
- New record in `quotation_acceptances` table
- Quotation status updated to 'Accepted'
- Sales Request status updated to 'Approved'
- Only one acceptance per quotation allowed

---

### Step 11: View Profile

**Action**: Navigate to /profile or click "Profile" in header

**Expected Results**:
- ✓ Display customer information:
  - Full Name
  - Company Name
  - Email
  - Phone Number
  - Member Since date
  - Customer ID

**Security Test**:
- Customer should only see their own profile
- Cannot access other customer's profile even by URL

---

### Step 12: Logout

**Action**: Click "Logout" button in header

**Expected Results**:
- ✓ Token removed from localStorage
- ✓ Redirected to /login
- ✓ Cannot access protected pages without re-login
- ✓ Try accessing /dashboard without token → redirected to /login

---

## Security Tests

### Test 1: Authorization Check
**Objective**: Verify customer cannot access other customer's data

1. Login as customer A
2. Get customer B's request ID from database
3. Try navigating to `/requests/{customerB_requestId}`
4. **Expected**: 404 error or access denied

**Backend Check**:
- API returns 404 when `customer_id` in request doesn't match logged-in customer
- Database queries filter by `customer_id`

### Test 2: Token Validation
**Objective**: Verify protected routes require valid token

1. Clear localStorage (remove token)
2. Try navigating to /dashboard
3. **Expected**: Redirected to /login
4. Try API call without token
5. **Expected**: 401 Unauthorized error

### Test 3: Password Security
**Objective**: Verify passwords are hashed

1. After registration, check database
2. Password should NOT be stored as plain text
3. Should be bcrypt hash (60 characters, starts with $2a$, $2b$, or $2y$)

### Test 4: Input Validation
**Objective**: Verify backend validates all inputs

1. Try negative quantity in request: `-5` → Error
2. Try invalid email: `notanemail` → Error
3. Try weak password: `weak` → Error
4. Try missing required fields → Error

---

## Performance Checks

### Dashboard Load Time
- Dashboard should load in < 2 seconds
- Verifies no N+1 query problems
- Efficient aggregation queries

### Request List with 1000 Requests
- Should still load and display responsively
- Pagination could be added for production

### Large Quotation
- 100+ line items should display correctly
- Calculations should be accurate

---

## Error Handling Tests

### Test 1: Network Error
1. Stop backend server
2. Try to login
3. **Expected**: Network error message displayed

### Test 2: Invalid Data
1. Try to create request with quantity = 0
2. **Expected**: Form validation error before API call

### Test 3: Expired Token
1. Set token to expire in 1 second
2. Wait 2 seconds
3. Try to access protected page
4. **Expected**: Redirected to login or shown error

---

## Checklist: Complete Customer Flow

- [ ] Customer can register with valid data
- [ ] Registration rejects invalid email/password
- [ ] Customer can login with correct credentials
- [ ] Login rejects invalid credentials
- [ ] Dashboard displays summary cards
- [ ] Dashboard shows recent requests
- [ ] Can create new sales request
- [ ] Request ID generated correctly
- [ ] Request status is "Submitted"
- [ ] My Requests page shows all requests
- [ ] Can view request details
- [ ] Can view associated quotation
- [ ] Quotation shows correct calculations
- [ ] Can request discount on quotation
- [ ] Discount request status tracked
- [ ] Can accept final quotation
- [ ] Quotation status changes to "Accepted"
- [ ] Cannot accept already-accepted quotation
- [ ] Can view customer profile
- [ ] Cannot access other customer's data
- [ ] Can logout successfully
- [ ] Protected routes redirect to login when no token
- [ ] All error messages are user-friendly
- [ ] Mobile responsive design works

---

## Database Verification

### Check Customers Table
```sql
SELECT id, full_name, company_name, email FROM customers;
```

### Check Sales Requests
```sql
SELECT id, customer_id, request_title, status FROM sales_requests;
```

### Check Quotations
```sql
SELECT id, request_id, customer_id, quotation_status FROM quotations;
```

### Check Discount Requests
```sql
SELECT id, quotation_id, customer_id, requested_discount_percent, status FROM discount_requests;
```

### Check Acceptances
```sql
SELECT id, quotation_id, customer_id, accepted_at FROM quotation_acceptances;
```

---

## API Endpoint Verification

### Test Registration Endpoint
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "companyName": "Test Company",
    "email": "test@example.com",
    "phoneNumber": "+911234567890",
    "password": "TestPass123",
    "confirmPassword": "TestPass123"
  }'
```

**Expected Response**:
```json
{
  "message": "Registration successful",
  "token": "eyJhbGc...",
  "customer": {
    "id": "uuid",
    "fullName": "Test User",
    "companyName": "Test Company",
    "email": "test@example.com"
  }
}
```

### Test Login Endpoint
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### Test Protected Endpoint
```bash
curl -X GET http://localhost:5000/customer/dashboard \
  -H "Authorization: Bearer {token}"
```

### Test Authorization (wrong customer)
```bash
# Create request as Customer A, try to access as Customer B
curl -X GET http://localhost:5000/customer/requests/REQ-001 \
  -H "Authorization: Bearer {token_customer_b}"
```

**Expected**: 404 Not Found

---

## Success Criteria

✅ **All tests pass when**:
1. Customer can complete full flow: Register → Login → Create Request → Receive Quotation → Request Discount → Accept
2. All data persists in database correctly
3. No broken routes or frontend errors
4. Authorization prevents unauthorized access
5. Error messages are clear and helpful
6. All calculations are accurate
7. Mobile responsive design works
8. Backend validation catches invalid data

---

## Known Limitations (Phase 1)

- Discount requests are submitted but salesperson response is manual (Salesperson Module will automate)
- Quotations are created manually (Salesperson Module will automate)
- No email notifications (can be added later)
- No password reset flow (marked as "if practical" in requirements)
- No edit/cancel request (intentional - keeps workflow simple)
- No bulk request creation

These will be addressed in subsequent modules.
