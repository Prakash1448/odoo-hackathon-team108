# DealFlow360 API Documentation (Swagger/OpenAPI)

## Base URL
```
http://localhost:5000
```

---

## 🔐 Authentication Endpoints

### 1. **Register Customer**
- **Endpoint:** `POST /auth/register`
- **Content-Type:** `application/json`
- **Request Body:**
```json
{
  "fullName": "John Doe",
  "companyName": "Acme Corp",
  "email": "john@example.com",
  "phoneNumber": "+91-9876543210",
  "password": "Password123",
  "confirmPassword": "Password123"
}
```
- **Response:** 
```json
{
  "message": "Registration successful",
  "token": "eyJhbGc...",
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CUSTOMER"
  },
  "customer": {
    "id": "uuid",
    "fullName": "John Doe",
    "companyName": "Acme Corp",
    "email": "john@example.com"
  }
}
```

---

### 2. **Login Customer**
- **Endpoint:** `POST /auth/login`
- **Content-Type:** `application/json`
- **Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```
- **Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CUSTOMER"
  },
  "customer": {
    "id": "uuid",
    "fullName": "John Doe",
    "companyName": "Acme Corp",
    "email": "john@example.com"
  }
}
```

---

### 3. **Logout**
- **Endpoint:** `POST /auth/logout`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Response:**
```json
{
  "message": "Logout successful"
}
```

---

## 📋 Customer Endpoints

### 4. **Get Customer Profile**
- **Endpoint:** `GET /customer/profile`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Response:**
```json
{
  "customer": {
    "id": "uuid",
    "fullName": "John Doe",
    "companyName": "Acme Corp",
    "email": "john@example.com",
    "phoneNumber": "+91-9876543210",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 5. **Update Customer Profile**
- **Endpoint:** `PUT /customer/profile`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "fullName": "John Updated",
  "companyName": "Acme Corp Updated",
  "phoneNumber": "+91-9988776655"
}
```
- **Response:**
```json
{
  "message": "Profile updated successfully",
  "customer": {
    "id": "uuid",
    "fullName": "John Updated",
    "companyName": "Acme Corp Updated",
    "email": "john@example.com",
    "phoneNumber": "+91-9988776655"
  }
}
```

---

## 📊 Sales Requests Endpoints

### 6. **Create Sales Request**
- **Endpoint:** `POST /customer/requests`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "requestTitle": "Industrial Equipment Quote",
  "productRequirement": "Heavy Machinery",
  "quantity": 5,
  "specifications": "Stainless steel, 500kg capacity",
  "additionalNotes": "Urgent delivery needed",
  "expectedDeliveryDate": "2024-02-15"
}
```
- **Response:**
```json
{
  "message": "Request created successfully",
  "request": {
    "id": "REQ-2024-001",
    "customerId": "uuid",
    "requestTitle": "Industrial Equipment Quote",
    "status": "SUBMITTED",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 7. **Get All Sales Requests**
- **Endpoint:** `GET /customer/requests`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Query Parameters:**
  - `status` (optional): SUBMITTED, IN_PROGRESS, QUOTED, etc.
- **Response:**
```json
{
  "requests": [
    {
      "id": "REQ-2024-001",
      "customerId": "uuid",
      "requestTitle": "Industrial Equipment Quote",
      "productRequirement": "Heavy Machinery",
      "quantity": 5,
      "status": "SUBMITTED",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 8. **Get Sales Request Details**
- **Endpoint:** `GET /customer/requests/:requestId`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Response:**
```json
{
  "request": {
    "id": "REQ-2024-001",
    "customerId": "uuid",
    "salespersonId": "uuid",
    "requestTitle": "Industrial Equipment Quote",
    "productRequirement": "Heavy Machinery",
    "quantity": 5,
    "specifications": "Stainless steel, 500kg capacity",
    "additionalNotes": "Urgent delivery needed",
    "expectedDeliveryDate": "2024-02-15",
    "status": "SUBMITTED",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 💰 Quotations Endpoints

### 9. **Get All Quotations for Customer**
- **Endpoint:** `GET /customer/quotations`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Query Parameters:**
  - `status` (optional): DRAFT, PENDING_APPROVAL, ACCEPTED, REJECTED
- **Response:**
```json
{
  "quotations": [
    {
      "id": "uuid",
      "requestId": "REQ-2024-001",
      "quotationNumber": "QT-2024-001",
      "salespersonId": "uuid",
      "salespersonName": "Jane Smith",
      "quotationStatus": "PENDING_APPROVAL",
      "totalAmount": 50000,
      "discountPercent": 5,
      "finalAmount": 47500,
      "taxAmount": 8550,
      "validUntil": "2024-02-15",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 10. **Get Quotation Details**
- **Endpoint:** `GET /customer/quotations/:quotationId`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Response:**
```json
{
  "quotation": {
    "id": "uuid",
    "requestId": "REQ-2024-001",
    "quotationNumber": "QT-2024-001",
    "salespersonId": "uuid",
    "salespersonName": "Jane Smith",
    "quotationStatus": "PENDING_APPROVAL",
    "totalAmount": 50000,
    "discountPercent": 5,
    "finalDiscountPercent": 5,
    "taxAmount": 8550,
    "notes": "Bulk discount applied",
    "validUntil": "2024-02-15",
    "lineItems": [
      {
        "id": "uuid",
        "productName": "Industrial Pump",
        "quantity": 5,
        "unitPrice": 9000,
        "subtotal": 45000,
        "discountPercent": 5,
        "discountAmount": 2250,
        "taxAmount": 7650,
        "totalAmount": 50400
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 11. **Accept Quotation**
- **Endpoint:** `POST /customer/quotations/:quotationId/accept`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Response:**
```json
{
  "message": "Quotation accepted successfully",
  "quotation": {
    "id": "uuid",
    "quotationNumber": "QT-2024-001",
    "quotationStatus": "ACCEPTED",
    "acceptedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 12. **Reject Quotation**
- **Endpoint:** `POST /customer/quotations/:quotationId/reject`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "reason": "Price too high"
}
```
- **Response:**
```json
{
  "message": "Quotation rejected successfully",
  "quotation": {
    "id": "uuid",
    "quotationNumber": "QT-2024-001",
    "quotationStatus": "REJECTED"
  }
}
```

---

## 🏷️ Discount Request Endpoints

### 13. **Request Discount on Quotation**
- **Endpoint:** `POST /customer/quotations/:quotationId/request-discount`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "requestedDiscountPercent": 10,
  "reason": "Volume purchase",
  "customerMessage": "Can you improve the price for bulk order?"
}
```
- **Response:**
```json
{
  "message": "Discount request submitted",
  "discountRequest": {
    "id": "uuid",
    "quotationId": "uuid",
    "requestedDiscountPercent": 10,
    "currentDiscountPercent": 5,
    "status": "PENDING_SALESPERSON_REVIEW",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 14. **Get Discount Requests**
- **Endpoint:** `GET /customer/discount-requests`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Query Parameters:**
  - `status` (optional): PENDING_SALESPERSON_REVIEW, PENDING_MANAGER_REVIEW, APPROVED, REJECTED
- **Response:**
```json
{
  "discountRequests": [
    {
      "id": "uuid",
      "quotationNumber": "QT-2024-001",
      "requestedDiscountPercent": 10,
      "currentDiscountPercent": 5,
      "status": "PENDING_SALESPERSON_REVIEW",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## 👤 Salesperson Endpoints (Separate Auth)

### 15. **Salesperson Login**
- **Endpoint:** `POST /salesperson-auth/login`
- **Content-Type:** `application/json`
- **Request Body:**
```json
{
  "email": "salesperson@example.com",
  "password": "Password123"
}
```
- **Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "salesperson@example.com",
    "role": "SALESPERSON"
  },
  "salesperson": {
    "id": "uuid",
    "fullName": "Jane Smith",
    "email": "salesperson@example.com",
    "maxDiscountPercent": 10
  }
}
```

---

### 16. **Get Assigned Sales Requests**
- **Endpoint:** `GET /salesperson/requests`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Response:**
```json
{
  "requests": [
    {
      "id": "REQ-2024-001",
      "customerId": "uuid",
      "customerName": "John Doe",
      "requestTitle": "Industrial Equipment Quote",
      "status": "SUBMITTED",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 17. **Create Quotation for Request**
- **Endpoint:** `POST /salesperson/quotations`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "requestId": "REQ-2024-001",
  "lineItems": [
    {
      "productName": "Industrial Pump",
      "quantity": 5,
      "unitPrice": 9000,
      "discountPercent": 5,
      "taxPercent": 18
    }
  ],
  "notes": "Bulk discount applied",
  "validUntil": "2024-02-15"
}
```
- **Response:**
```json
{
  "message": "Quotation created successfully",
  "quotation": {
    "id": "uuid",
    "quotationNumber": "QT-2024-001",
    "requestId": "REQ-2024-001",
    "totalAmount": 50000,
    "discountPercent": 5,
    "finalAmount": 47500,
    "taxAmount": 8550,
    "quotationStatus": "DRAFT",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 👔 Manager Endpoints (Approval Workflows)

### 18. **Manager Login**
- **Endpoint:** `POST /manager-auth/login`
- **Content-Type:** `application/json`
- **Request Body:**
```json
{
  "email": "manager@example.com",
  "password": "Password123"
}
```
- **Response:** Same structure as Salesperson login with `SALES_MANAGER` role

---

### 19. **Get Pending Approvals**
- **Endpoint:** `GET /manager/approvals`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Query Parameters:**
  - `type` (optional): DISCOUNT_REQUEST, QUOTATION_APPROVAL
- **Response:**
```json
{
  "approvals": [
    {
      "id": "uuid",
      "type": "DISCOUNT_REQUEST",
      "discountRequestId": "uuid",
      "quotationNumber": "QT-2024-001",
      "customerName": "John Doe",
      "requestedDiscountPercent": 10,
      "currentDiscountPercent": 5,
      "status": "PENDING_MANAGER_REVIEW",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 20. **Approve Discount Request**
- **Endpoint:** `POST /manager/discount-requests/:discountRequestId/approve`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "approvalDiscountPercent": 8,
  "managerResponse": "Approved with adjusted discount"
}
```
- **Response:**
```json
{
  "message": "Discount request approved",
  "discountRequest": {
    "id": "uuid",
    "status": "APPROVED",
    "managerApprovalStatus": "APPROVED",
    "finalDiscountPercent": 8,
    "approvedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid email or password"
}
```

### 409 Conflict
```json
{
  "error": "Email already registered"
}
```

### 500 Internal Server Error
```json
{
  "error": "Operation failed"
}
```

---

## Testing with cURL

### Register Customer
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "companyName": "Acme Corp",
    "email": "john@example.com",
    "phoneNumber": "+91-9876543210",
    "password": "Password123",
    "confirmPassword": "Password123"
  }'
```

### Login Customer
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

### Get Customer Profile
```bash
curl -X GET http://localhost:5000/customer/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## API Summary Table

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | /auth/register | ❌ | Register new customer |
| POST | /auth/login | ❌ | Login customer |
| POST | /auth/logout | ✅ | Logout customer |
| GET | /customer/profile | ✅ | Get profile |
| PUT | /customer/profile | ✅ | Update profile |
| POST | /customer/requests | ✅ | Create sales request |
| GET | /customer/requests | ✅ | List requests |
| GET | /customer/requests/:id | ✅ | Get request details |
| GET | /customer/quotations | ✅ | List quotations |
| GET | /customer/quotations/:id | ✅ | Get quotation details |
| POST | /customer/quotations/:id/accept | ✅ | Accept quotation |
| POST | /customer/quotations/:id/reject | ✅ | Reject quotation |
| POST | /customer/quotations/:id/request-discount | ✅ | Request discount |
| GET | /customer/discount-requests | ✅ | List discount requests |
| POST | /salesperson-auth/login | ❌ | Salesperson login |
| GET | /salesperson/requests | ✅ | Get assigned requests |
| POST | /salesperson/quotations | ✅ | Create quotation |
| POST | /manager-auth/login | ❌ | Manager login |
| GET | /manager/approvals | ✅ | Get pending approvals |
| POST | /manager/discount-requests/:id/approve | ✅ | Approve discount |

---

**Base URL:** `http://localhost:5000`  
**Frontend URL:** `http://localhost:5173`  
**Status:** ✅ Running
