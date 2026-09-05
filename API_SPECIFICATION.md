# DealFlow360 Customer Module - API Specification

## Overview

This document defines all API endpoints for the Customer Module. Future modules (Salesperson, Sales Manager) will integrate using these APIs and additional endpoints they define.

---

## Base URL

```
http://localhost:5000
```

For production, replace with appropriate domain.

---

## Authentication

All protected endpoints require Bearer token in Authorization header:

```
Authorization: Bearer {jwt_token}
```

Token lifetime: 7 days (configurable)

---

## Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes
- `200` OK - Request successful
- `201` Created - Resource created
- `400` Bad Request - Invalid input
- `401` Unauthorized - No/invalid token
- `404` Not Found - Resource not found
- `409` Conflict - Resource already exists (e.g., email taken)
- `500` Internal Server Error - Server error

---

## Authentication Endpoints

### POST /auth/register

Register a new customer account.

**Request Body**:
```json
{
  "fullName": "string",              // Required, 1-100 chars
  "companyName": "string",           // Required, 1-100 chars
  "email": "string",                 // Required, valid email format
  "phoneNumber": "string",           // Required, 10+ digits
  "password": "string",              // Required, 8+ chars, 1 uppercase, 1 lowercase, 1 number
  "confirmPassword": "string"        // Required, must match password
}
```

**Response** (201 Created):
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "customer": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "John Doe",
    "companyName": "Tech Corp",
    "email": "john@techcorp.com"
  }
}
```

**Errors**:
- `400` - Missing or invalid fields
- `409` - Email already registered

---

### POST /auth/login

Authenticate customer and receive JWT token.

**Request Body**:
```json
{
  "email": "string",                 // Required, valid email
  "password": "string"               // Required
}
```

**Response** (200 OK):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "customer": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "John Doe",
    "companyName": "Tech Corp",
    "email": "john@techcorp.com"
  }
}
```

**Errors**:
- `400` - Missing email or password
- `401` - Invalid email or password

---

### POST /auth/logout

Logout customer. Frontend clears token from localStorage.

**Headers**: Requires Bearer token

**Response** (200 OK):
```json
{
  "message": "Logout successful"
}
```

**Note**: Token is still valid until expiration. For complete logout, implement token blacklist.

---

## Customer Endpoints

All customer endpoints require Bearer token authentication.

### GET /customer/dashboard

Get dashboard summary data.

**Headers**: Required Authorization header

**Response** (200 OK):
```json
{
  "totalRequests": 5,
  "pendingRequests": 1,
  "quotationsReceived": 3,
  "quotationsAwaitingAction": 2,
  "discountRequests": 1,
  "acceptedQuotations": 1
}
```

**Used By**: Dashboard page to display summary cards

---

### GET /customer/profile

Get current customer profile information.

**Headers**: Required Authorization header

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "fullName": "John Doe",
  "companyName": "Tech Corp",
  "email": "john@techcorp.com",
  "phoneNumber": "+911234567890",
  "createdAt": "05 Sep 2026"
}
```

**Errors**:
- `401` - Invalid token
- `404` - Customer not found

---

### GET /customer/requests

List all sales requests for current customer.

**Headers**: Required Authorization header

**Query Parameters**: None (pagination can be added)

**Response** (200 OK):
```json
[
  {
    "id": "REQ-001",
    "request_title": "90 Business Laptops",
    "product_requirement": "Business Laptop",
    "quantity": 90,
    "status": "Quotation Received",
    "created_at": "05 Sep"
  },
  {
    "id": "REQ-002",
    "request_title": "20 Monitors",
    "product_requirement": "Monitor",
    "quantity": 20,
    "status": "Under Review",
    "created_at": "05 Sep"
  }
]
```

**Status Values**: "Submitted", "Under Review", "Quotation Received", "Negotiation", "Approved", "Accepted", "Completed"

---

### POST /customer/requests

Create a new sales request.

**Headers**: Required Authorization header

**Request Body**:
```json
{
  "requestTitle": "string",          // Required, 1-200 chars
  "productRequirement": "string",    // Required, 1-100 chars
  "quantity": integer,               // Required, > 0
  "specifications": "string",        // Optional
  "additionalNotes": "string",       // Optional
  "expectedDeliveryDate": "YYYY-MM-DD"  // Optional
}
```

**Response** (201 Created):
```json
{
  "message": "Request created successfully",
  "request": {
    "id": "REQ-001",
    "requestTitle": "90 Business Laptops",
    "productRequirement": "Business Laptop",
    "quantity": 90,
    "status": "Submitted",
    "createdAt": "05 Sep"
  }
}
```

**Errors**:
- `400` - Missing required fields or invalid quantity
- `401` - Invalid token

**Request ID Format**: REQ-{last 6 digits of timestamp}

---

### GET /customer/requests/:requestId

Get details of a specific sales request.

**Headers**: Required Authorization header

**URL Parameters**:
- `requestId` - The request ID (e.g., REQ-001)

**Response** (200 OK):
```json
{
  "id": "REQ-001",
  "request_title": "90 Business Laptops",
  "product_requirement": "Business Laptop",
  "quantity": 90,
  "specifications": "16GB RAM, 512GB SSD, i7 processor",
  "additional_notes": "Need installation and support",
  "expected_delivery_date": "2026-09-30",
  "status": "Quotation Received",
  "createdAt": "05 Sep",
  "quotation": {
    "id": "Q-550e8400",
    "status": "Awaiting Customer Response",
    "lineItems": [ /* see quotation line items */ ],
    "subtotal": "45000000.00",
    "totalDiscount": "4500000.00",
    "totalTax": "0.00",
    "total": "40500000.00",
    "validUntil": "2026-09-20",
    "createdAt": "05 Sep"
  }
}
```

**Errors**:
- `404` - Request not found or customer doesn't own it
- `401` - Invalid token

---

## Quotation Endpoints

All quotation endpoints require Bearer token authentication.

### GET /quotations

List all quotations for current customer.

**Headers**: Required Authorization header

**Response** (200 OK):
```json
[
  {
    "id": "Q-550e8400-e29b-41d4-a716-446655440000",
    "requestId": "REQ-001",
    "requestTitle": "90 Business Laptops",
    "productRequirement": "Business Laptop",
    "quantity": 90,
    "status": "Awaiting Customer Response",
    "validUntil": "2026-09-20",
    "createdAt": "05 Sep"
  }
]
```

---

### GET /quotations/:quotationId

Get detailed quotation with line items and calculations.

**Headers**: Required Authorization header

**URL Parameters**:
- `quotationId` - The quotation ID (UUID)

**Response** (200 OK):
```json
{
  "id": "Q-550e8400-e29b-41d4-a716-446655440000",
  "requestId": "REQ-001",
  "status": "Awaiting Customer Response",
  "lineItems": [
    {
      "id": "LI-550e8400",
      "product_name": "Business Laptop",
      "quantity": 90,
      "unit_price": 50000.00,
      "subtotal": 4500000.00,
      "discount_percent": 10,
      "discount_amount": 450000.00,
      "tax_amount": 0.00,
      "total_amount": 4050000.00
    }
  ],
  "subtotal": "4500000.00",
  "totalDiscount": "450000.00",
  "totalTax": "0.00",
  "total": "4050000.00",
  "validUntil": "2026-09-20",
  "notes": "Payment terms: Net 30. Delivery: 2 weeks.",
  "createdAt": "05 Sep",
  "accepted": false,
  "acceptedAt": null,
  "discountRequests": [
    {
      "id": "DR-550e8400",
      "requestedDiscount": 15,
      "currentDiscount": 10,
      "reason": "Bulk order discount request",
      "status": "Pending Review",
      "salespersonResponse": null,
      "managerApprovalStatus": null,
      "createdAt": "05 Sep"
    }
  ]
}
```

**Quotation Status Values**: 
- "Awaiting Customer Response"
- "Accepted"
- "Rejected"
- "Expired"

**Discount Request Status Values**:
- "Pending Review" - Awaiting salesperson decision
- "Approved" - Salesperson approved the discount
- "Rejected" - Salesperson rejected the discount
- "Requires Manager Approval" - Needs manager review
- "Manager Approved" - Manager approved the discount
- "Manager Rejected" - Manager rejected the discount

**Errors**:
- `404` - Quotation not found or customer doesn't own it
- `401` - Invalid token

---

### POST /quotations/:quotationId/discount-request

Request a discount modification on a quotation.

**Headers**: Required Authorization header

**URL Parameters**:
- `quotationId` - The quotation ID (UUID)

**Request Body**:
```json
{
  "requestedDiscountPercent": number,  // Required, 0-100
  "reason": "string",                  // Required, 1-500 chars
  "customerMessage": "string"          // Optional, additional message
}
```

**Response** (201 Created):
```json
{
  "message": "Discount request submitted successfully",
  "discountRequest": {
    "id": "DR-550e8400",
    "requestedDiscount": 15,
    "currentDiscount": 10,
    "reason": "Bulk order discount request",
    "status": "Pending Review",
    "createdAt": "05 Sep"
  }
}
```

**Errors**:
- `400` - Invalid discount percent (0-100) or missing reason
- `400` - Active discount request already exists for this quotation
- `404` - Quotation not found
- `401` - Invalid token

**Business Rules**:
- Only one active discount request per quotation
- Cannot request discount on rejected/expired quotation
- Discount must be 0-100

---

### POST /quotations/:quotationId/accept

Accept a quotation.

**Headers**: Required Authorization header

**URL Parameters**:
- `quotationId` - The quotation ID (UUID)

**Request Body**: Empty (no body required)

**Response** (200 OK):
```json
{
  "message": "Quotation accepted successfully",
  "acceptance": {
    "id": "ACC-550e8400",
    "quotationId": "Q-550e8400-e29b-41d4-a716-446655440000",
    "status": "Accepted",
    "acceptedAt": "05 Sep 2026"
  }
}
```

**Errors**:
- `400` - Quotation already accepted
- `400` - Cannot accept rejected/expired quotation
- `404` - Quotation not found
- `401` - Invalid token

**Business Logic**:
- Creates acceptance record
- Updates quotation status to "Accepted"
- Updates associated sales request status to "Approved"
- Prevents duplicate acceptances

---

## Health Check Endpoint

### GET /health

Check if backend is running.

**Headers**: None required

**Response** (200 OK):
```json
{
  "status": "OK",
  "timestamp": "2026-09-05T10:30:00.000Z"
}
```

---

## Error Response Examples

### Invalid Email
```json
{
  "error": "Invalid email format"
}
```

### Weak Password
```json
{
  "error": "Password must be at least 8 characters with uppercase, lowercase, and number"
}
```

### Email Already Registered
```json
{
  "error": "Email already registered"
}
```

### Invalid Token
```json
{
  "error": "Invalid or expired token"
}
```

### No Authorization
```json
{
  "error": "No token provided"
}
```

### Not Found
```json
{
  "error": "Request not found"
}
```

---

## Data Validation Rules

### Email
- Format: valid email address
- Uniqueness: must be unique across all customers

### Password
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- Stored as bcrypt hash, never plain text

### Phone Number
- At least 10 digits
- Non-digit characters removed for validation
- Stored with formatting

### Request Quantity
- Must be positive integer (> 0)
- No decimal numbers

### Discount Percent
- Must be between 0 and 100
- Can have decimal places (e.g., 15.5%)

---

## Rate Limiting

Currently not implemented. Recommended for production:
- Max 10 requests per minute per IP for auth endpoints
- Max 100 requests per minute per token for other endpoints

---

## CORS Configuration

Frontend can be on different domain:
```
Access-Control-Allow-Origin: {CLIENT_URL from .env}
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

---

## Future Extensions for Other Modules

### Salesperson Module Additions

**Create Quotation** (Salesperson):
```
POST /quotations
- Request ID
- Line items with pricing
- Discount %
- Notes/Terms
```

**Update Quotation** (Salesperson):
```
PUT /quotations/:id
- Update pricing, terms, etc.
```

**Respond to Discount Request** (Salesperson):
```
PUT /quotations/:id/discount-request/:discountRequestId
- Approve/Reject
- Manager approval requirement
```

### Sales Manager Module Additions

**Approve Discount Request**:
```
PUT /discount-requests/:id/approve
- Manager approval decision
- Final discount percentage
```

**View Analytics**:
```
GET /analytics/dashboard
- Revenue metrics
- Request conversion rates
- Average deal size
```

---

## Implementation Notes

- All timestamps in ISO 8601 format
- All monetary values in database as numeric, formatted to 2 decimals in API responses
- UUIDs for quotations and line items
- String IDs for requests (REQ-XXXXX format)
- All queries filter by customer_id for authorization
- Backend validates all input; frontend validation is UX only

---

## Testing API Endpoints

### Using curl

```bash
# Register
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{...}'

# Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{...}'

# Get Dashboard (with token)
curl -X GET http://localhost:5000/customer/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman
1. Create collection
2. Set variables: base_url, token
3. Import requests from this spec
4. Run test scenarios

---

## Version History

- **v1.0** (2026-09-05) - Initial Customer Module API
  - Authentication endpoints
  - Customer endpoints
  - Quotation endpoints
  - Future versions will add Salesperson/Manager endpoints

---

**Last Updated**: 2026-09-05
**API Version**: 1.0
