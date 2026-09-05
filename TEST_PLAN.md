# DealFlow360 Module 1 - End-to-End Workflow Test Plan

## Overview
Complete workflow test: Customer Query → Salesperson Quotation → Discount Request → Manager Approval → Customer Acceptance

## Test Scenario

### STEP 1: Customer Registration & Authentication
**Objective**: Register a new customer and verify authentication
- **URL**: http://localhost:5173/register
- **Test Data**:
  - Full Name: ABC Technologies Manager
  - Company Name: ABC Technologies Pvt Ltd
  - Email: manager@abctech.com
  - Phone: 9876543210
  - Password: Test@1234
  - Confirm Password: Test@1234
- **Expected Result**: 
  - ✓ Registration successful
  - ✓ Token stored in localStorage
  - ✓ Redirect to /dashboard

### STEP 2: Customer Creates Sales Query
**Objective**: Customer creates a new sales request/query
- **URL**: http://localhost:5173/requests/new
- **Test Data**:
  - Title: Need 90 Business Laptops
  - Product: Business Laptop
  - Quantity: 90
  - Specifications: 16GB RAM, 512GB SSD, Intel i7 or equivalent
  - Additional Notes: Need installation and 1-year support
  - Expected Delivery: 30 days
- **Expected Result**:
  - ✓ Request ID generated: REQ-00001
  - ✓ Status: SUBMITTED
  - ✓ Database record created
  - ✓ Audit log: CUSTOMER_CREATED_REQUEST

### STEP 3: Verify Request in Customer Dashboard
**Objective**: Verify request appears in customer's dashboard
- **URL**: http://localhost:5173/dashboard
- **Expected Result**:
  - ✓ Total Requests: 1
  - ✓ Pending Requests: 1
  - ✓ Request visible in list with SUBMITTED status

### STEP 4: Salesperson Registration & Authentication
**Objective**: Register salesperson and authenticate
- **URL**: http://localhost:5173/salesperson/register
- **Test Data**:
  - Full Name: John Smith
  - Email: john.smith@company.com
  - Password: Salesperson@123
  - Confirm Password: Salesperson@123
- **Expected Result**:
  - ✓ Registration successful
  - ✓ Token stored (separate from customer token)
  - ✓ Redirect to /salesperson/dashboard
  - ✓ max_discount_percent: 10

### STEP 5: Salesperson Views Customer Request
**Objective**: Verify salesperson can see customer's request
- **URL**: http://localhost:5173/salesperson/requests
- **Expected Result**:
  - ✓ REQ-00001 visible in list
  - ✓ Shows customer: ABC Technologies Pvt Ltd
  - ✓ Product: Business Laptop
  - ✓ Quantity: 90

### STEP 6: Salesperson Opens Request Details
**Objective**: View full request details and create quotation
- **URL**: http://localhost:5173/salesperson/requests/REQ-00001
- **Expected Result**:
  - ✓ All request details visible
  - ✓ Customer contact info shown
  - ✓ Create Quotation button available

### STEP 7: Salesperson Creates Quotation
**Objective**: Create quotation with line items and discounts
- **Action**: Click "Create Quotation"
- **Test Data**:
  - Product: Business Laptop
  - Quantity: 90
  - Unit Price: 50000
  - Discount: 10%
  - Tax: 18%
  - Valid Until: 30 days
  - Notes: Enterprise pricing, includes 1-year support
- **Expected Result**:
  - ✓ Quotation ID generated: Q-00001
  - ✓ Quotation Number: Q-00001
  - ✓ Status: DRAFT
  - ✓ Subtotal: ₹45,00,000 (90 × 50,000)
  - ✓ Discount (10%): ₹4,50,000
  - ✓ After Discount: ₹40,50,000
  - ✓ Tax (18%): ₹72,90,000
  - ✓ Total: ₹113,40,000
  - ✓ Database: quotation_line_items created
  - ✓ Audit log: SALESPERSON_CREATED_QUOTATION

### STEP 8: Salesperson Sends Quotation to Customer
**Objective**: Send draft quotation to customer
- **URL**: http://localhost:5173/salesperson/quotations/Q-00001
- **Action**: Click "Send to Customer"
- **Expected Result**:
  - ✓ Quotation status: DRAFT → SENT
  - ✓ Request status: QUOTATION_CREATED → QUOTATION_SENT
  - ✓ Audit log: QUOTATION_SENT_TO_CUSTOMER

### STEP 9: Customer Views Received Quotation
**Objective**: Verify customer sees sent quotation
- **Login**: Logout salesperson, login as customer (manager@abctech.com)
- **URL**: http://localhost:5173/quotations
- **Expected Result**:
  - ✓ Q-00001 visible in list
  - ✓ Status: SENT
  - ✓ Amount: ₹113,40,000
  - ✓ Request: REQ-00001

### STEP 10: Customer Opens Quotation Details
**Objective**: View full quotation with line items
- **URL**: http://localhost:5173/quotations/Q-00001
- **Expected Result**:
  - ✓ Quotation number: Q-00001
  - ✓ Line items table with all calculations
  - ✓ Subtotal, Discount, Tax, Total breakdown
  - ✓ Status badge: SENT
  - ✓ "Request Discount" button available
  - ✓ "Accept Quotation" button available
  - ✓ Cannot edit prices (read-only)

### STEP 11: Customer Requests Higher Discount
**Objective**: Customer requests 15% discount (exceeds salesperson 10% limit)
- **Action**: Click "Request Discount / Negotiate"
- **Test Data**:
  - Requested Discount: 15%
  - Reason: Bulk purchase of 90 laptops for our organization
  - Message: We are a regular customer. Please offer better pricing.
- **Expected Result**:
  - ✓ Discount request created
  - ✓ Status: PENDING_SALESPERSON_REVIEW
  - ✓ Database: discount_requests record created
  - ✓ Audit log: CUSTOMER_REQUESTED_DISCOUNT

### STEP 12: Salesperson Reviews Discount Request
**Objective**: Salesperson checks request and business rules apply
- **Login**: Logout customer, login as salesperson (john.smith@company.com)
- **URL**: http://localhost:5173/salesperson/discount-requests
- **Expected Result**:
  - ✓ Discount request visible
  - ✓ Quotation: Q-00001
  - ✓ Customer: ABC Technologies Pvt Ltd
  - ✓ Current Discount: 10%
  - ✓ Requested Discount: 15%
  - ✓ Status: PENDING_SALESPERSON_REVIEW
  - ✓ Action buttons: Approve, Reject, Counter Offer, Send to Manager

### STEP 13: Backend Business Rule Check - Exceeds Authority
**Objective**: Verify backend enforces discount limits
- **Action**: Salesperson clicks "Approve"
- **Backend Logic**:
  - checkDiscountApprovalRequired(salespersonId, 15%)
  - Salesperson max_discount: 10%
  - 15% > 10% → requires_manager_approval = TRUE
  - Status: APPROVED → SENT_TO_MANAGER
- **Expected Result**:
  - ✓ Status: SENT_TO_MANAGER
  - ✓ Message: "Discount request forwarded to manager for approval"
  - ✓ Audit log: DISCOUNT_SENT_TO_MANAGER
  - ✓ requires_manager_approval: TRUE

### STEP 14: Manager Reviews Discount Approval Request
**Objective**: Manager sees pending discount request
- **Login**: Logout salesperson, login as manager
- **URL**: http://localhost:5173/manager/login
- **Test Data**:
  - Email: manager@dealflow.com
  - Password: Manager@123
- **Expected Result**:
  - ✓ Login successful
  - ✓ Redirect to /manager/dashboard

### STEP 15: Manager Dashboard Shows Pending Request
**Objective**: Verify manager dashboard displays metrics
- **URL**: http://localhost:5173/manager/dashboard
- **Expected Result**:
  - ✓ Pending Approvals: 1
  - ✓ Awaiting Manager Approval: 1
  - ✓ Recent request visible in list

### STEP 16: Manager Views Discount Request Details
**Objective**: Manager reviews full context for decision
- **URL**: http://localhost:5173/manager/approval-requests/DISCOUNT_REQUEST_ID
- **Expected Result**:
  - ✓ Customer: ABC Technologies Pvt Ltd
  - ✓ Salesperson: John Smith
  - ✓ Current Discount: 10%
  - ✓ Requested Discount: 15%
  - ✓ Salesperson Assessment visible
  - ✓ Quotation Summary: ₹113,40,000
  - ✓ Discount impact shown

### STEP 17: Manager Approves Discount Request
**Objective**: Manager approves the 15% discount
- **Action**: Click "✓ Approve"
- **Response**: "Discount approved. Customer is valuable for volume commitments."
- **Expected Result**:
  - ✓ Status: PENDING_SALESPERSON_REVIEW → APPROVED
  - ✓ manager_approval_status: APPROVED
  - ✓ Audit log: MANAGER_APPROVED_DISCOUNT
  - ✓ Notification sent to salesperson

### STEP 18: Salesperson Sees Approval and Updates Quotation
**Objective**: Salesperson applies approved discount to quotation
- **Login**: Logout manager, login as salesperson
- **URL**: http://localhost:5173/salesperson/quotations/Q-00001
- **Action**: Update quotation with 15% discount, then send updated version
- **Expected Result**:
  - ✓ Quotation updated with final_discount_percent: 15%
  - ✓ New total calculated: ₹40,50,000 (after 15% = ₹38,42,500)
  - ✓ Tax on new amount: ₹69,16,500
  - ✓ Final Total: ₹107,59,000
  - ✓ Send Updated Quotation to Customer
  - ✓ Status: FINALIZED
  - ✓ Audit log: QUOTATION_UPDATED

### STEP 19: Customer Sees Final Quotation with Approved Discount
**Objective**: Customer receives and views final quotation
- **Login**: Logout salesperson, login as customer
- **URL**: http://localhost:5173/quotations/Q-00001
- **Expected Result**:
  - ✓ Quotation status: FINALIZED
  - ✓ Discount: 15% applied
  - ✓ New Total: ₹107,59,000
  - ✓ Final price reflects approval
  - ✓ "Accept Quotation" button available (ready for acceptance)

### STEP 20: Customer Accepts Final Quotation
**Objective**: Customer accepts the quotation
- **Action**: Click "Accept Quotation"
- **Confirmation**: "You are accepting quotation Q-00001 for ₹107,59,000"
- **Expected Result**:
  - ✓ Quotation status: FINALIZED → ACCEPTED
  - ✓ Request status: NEGOTIATION → ACCEPTED
  - ✓ quotation_acceptances record created
  - ✓ acceptance_status: ACCEPTED
  - ✓ accepted_at: Current timestamp
  - ✓ Audit log: QUOTATION_ACCEPTED
  - ✓ Cannot duplicate accept

### STEP 21: Verify Audit Trail
**Objective**: Confirm all actions logged
- **Check Backend Logs or Audit API**:
  - ✓ CUSTOMER_CREATED_REQUEST
  - ✓ SALESPERSON_CREATED_QUOTATION
  - ✓ QUOTATION_SENT_TO_CUSTOMER
  - ✓ CUSTOMER_REQUESTED_DISCOUNT
  - ✓ DISCOUNT_SENT_TO_MANAGER
  - ✓ MANAGER_APPROVED_DISCOUNT
  - ✓ QUOTATION_UPDATED
  - ✓ QUOTATION_ACCEPTED

## Success Criteria

✅ **All 20 workflow steps execute successfully**
✅ **Database records created correctly**
✅ **Status transitions follow defined flow**
✅ **Business rule (discount limit) enforced**
✅ **Manager approval required when threshold exceeded**
✅ **Calculations (subtotal, discount, tax, total) correct**
✅ **Audit logging comprehensive**
✅ **Role-based access working**
✅ **No duplicate acceptance allowed**
✅ **Full end-to-end integration verified**

## Test Execution Log

[Tests to be recorded here during execution]
