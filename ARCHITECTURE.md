# DealFlow360 Customer Module - Architecture Guide

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     WEB BROWSER                             │
│              (Customer Portal Interface)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP/HTTPS
                     │ JSON
                     │
         ┌───────────▼───────────┐
         │                       │
         │  FRONTEND (React)     │
         │  Port: 5173           │
         │  Vite + React Router  │
         │                       │
         │ ┌─────────────────┐   │
         │ │ Authentication  │   │
         │ │ - Login         │   │
         │ │ - Register      │   │
         │ └─────────────────┘   │
         │                       │
         │ ┌─────────────────┐   │
         │ │ Pages           │   │
         │ │ - Dashboard     │   │
         │ │ - Requests      │   │
         │ │ - Quotations    │   │
         │ │ - Profile       │   │
         │ └─────────────────┘   │
         │                       │
         │ ┌─────────────────┐   │
         │ │ Components      │   │
         │ │ - Header        │   │
         │ │ - PrivateRoute  │   │
         │ └─────────────────┘   │
         │                       │
         └───────────┬───────────┘
                     │
                     │ REST API Calls
                     │ Bearer Token Auth
                     │
         ┌───────────▼───────────┐
         │                       │
         │  BACKEND (Express)    │
         │  Port: 5000           │
         │  Node.js              │
         │                       │
         │ ┌─────────────────┐   │
         │ │ Authentication  │   │
         │ │ Routes          │   │
         │ │ - Register      │   │
         │ │ - Login         │   │
         │ │ - Logout        │   │
         │ └─────────────────┘   │
         │                       │
         │ ┌─────────────────┐   │
         │ │ Customer Routes │   │
         │ │ - Dashboard     │   │
         │ │ - Profile       │   │
         │ │ - Requests      │   │
         │ └─────────────────┘   │
         │                       │
         │ ┌─────────────────┐   │
         │ │ Quotation Routes│   │
         │ │ - Get           │   │
         │ │ - Discount      │   │
         │ │ - Accept        │   │
         │ └─────────────────┘   │
         │                       │
         │ ┌─────────────────┐   │
         │ │ Middleware      │   │
         │ │ - Auth          │   │
         │ │ - CORS          │   │
         │ │ - Validation    │   │
         │ └─────────────────┘   │
         │                       │
         └───────────┬───────────┘
                     │
                     │ SQL Queries
                     │ CRUD Operations
                     │
         ┌───────────▼───────────┐
         │                       │
         │  DATABASE (SQLite)    │
         │  File: database.db    │
         │                       │
         │ ┌─────────────────┐   │
         │ │ Customers       │   │
         │ │ - ID (PK)       │   │
         │ │ - Email (UNQ)   │   │
         │ │ - Password Hash │   │
         │ └─────────────────┘   │
         │                       │
         │ ┌─────────────────┐   │
         │ │ Sales Requests  │   │
         │ │ - ID (PK)       │   │
         │ │ - Customer ID   │   │
         │ │ - Details       │   │
         │ │ - Status        │   │
         │ └─────────────────┘   │
         │                       │
         │ ┌─────────────────┐   │
         │ │ Quotations      │   │
         │ │ - ID (PK)       │   │
         │ │ - Request ID    │   │
         │ │ - Status        │   │
         │ └─────────────────┘   │
         │                       │
         │ ┌─────────────────┐   │
         │ │ Line Items      │   │
         │ │ - Quotation ID  │   │
         │ │ - Pricing       │   │
         │ │ - Discount      │   │
         │ └─────────────────┘   │
         │                       │
         │ ┌─────────────────┐   │
         │ │ Discount Req    │   │
         │ │ - Quotation ID  │   │
         │ │ - Status        │   │
         │ │ - Response      │   │
         │ └─────────────────┘   │
         │                       │
         │ ┌─────────────────┐   │
         │ │ Acceptances     │   │
         │ │ - Quotation ID  │   │
         │ │ - Accepted At   │   │
         │ └─────────────────┘   │
         │                       │
         └───────────────────────┘
```

---

## Data Flow: Complete Customer Journey

```
1. REGISTRATION
   ┌────────────────┐
   │ User fills     │
   │ registration   │
   │ form           │
   └────────┬───────┘
            │
            ▼
   ┌────────────────┐
   │ Frontend       │
   │ validates      │
   │ (UX)           │
   └────────┬───────┘
            │
            ▼
   ┌────────────────┐
   │ POST           │
   │ /auth/register │
   └────────┬───────┘
            │
            ▼
   ┌────────────────────────────┐
   │ Backend validation:        │
   │ - All fields required      │
   │ - Email format valid       │
   │ - Password strong          │
   │ - Email not duplicate      │
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ Backend processing:        │
   │ - Hash password (bcrypt)   │
   │ - Generate UUID            │
   │ - Create customer record   │
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ Database insert            │
   │ INSERT INTO customers      │
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ Backend response:          │
   │ - JWT token                │
   │ - Customer data            │
   │ - Status 201 Created       │
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ Frontend:                  │
   │ - Store token in localStorage
   │ - Redirect to dashboard    │
   └────────────────────────────┘

2. LOGIN
   ┌────────────────┐
   │ User enters    │
   │ email/password │
   └────────┬───────┘
            │
            ▼
   ┌────────────────┐
   │ POST /auth/login
   └────────┬───────┘
            │
            ▼
   ┌────────────────────────────┐
   │ Backend:                   │
   │ - Find customer by email   │
   │ - Compare password (bcrypt)│
   │ - Generate JWT token       │
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ Response token + customer  │
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ Frontend:                  │
   │ - Store token              │
   │ - Redirect to dashboard    │
   └────────────────────────────┘

3. CREATE REQUEST
   ┌────────────────┐
   │ User clicks    │
   │ "Create Request"
   └────────┬───────┘
            │
            ▼
   ┌────────────────┐
   │ Fill form:     │
   │ - Title        │
   │ - Product      │
   │ - Quantity     │
   │ - Specs        │
   └────────┬───────┘
            │
            ▼
   ┌────────────────┐
   │ POST /requests │
   └────────┬───────┘
            │
            ▼
   ┌────────────────────────────┐
   │ Backend:                   │
   │ - Validate all fields      │
   │ - Validate quantity > 0    │
   │ - Generate REQ-XXXXX       │
   │ - Get customer_id from JWT │
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ INSERT INTO sales_requests │
   │ Status = 'Submitted'       │
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ Response:                  │
   │ - Request ID               │
   │ - Status 201               │
   │ - Redirect to request detail
   └────────────────────────────┘

4. VIEW QUOTATION
   ┌────────────────┐
   │ User clicks    │
   │ "View Quotation"
   └────────┬───────┘
            │
            ▼
   ┌────────────────────────────┐
   │ GET /quotations/:id        │
   │ Auth: Bearer {token}       │
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ Backend:                   │
   │ - Verify token             │
   │ - Extract customer_id      │
   │ - Check quotation belongs   │
   │   to customer              │
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ SELECT quotation           │
   │ WHERE customer_id = X      │
   │ AND id = Y                 │
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ SELECT line_items          │
   │ Calculate totals:          │
   │ - Subtotal                 │
   │ - Discount                 │
   │ - Tax                      │
   │ - Total                    │
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ Response JSON with all     │
   │ quotation details          │
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ Frontend:                  │
   │ - Display line items       │
   │ - Show calculations        │
   │ - Enable discount request  │
   │ - Enable acceptance        │
   └────────────────────────────┘

5. REQUEST DISCOUNT
   ┌────────────────┐
   │ Click "Request │
   │ Discount"      │
   └────────┬───────┘
            │
            ▼
   ┌────────────────┐
   │ Fill form:     │
   │ - Discount %   │
   │ - Reason       │
   │ - Message      │
   └────────┬───────┘
            │
            ▼
   ┌────────────────────────────┐
   │ POST /quotations/:id/      │
   │ discount-request           │
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ Backend:                   │
   │ - Validate discount 0-100  │
   │ - Check no active request  │
   │ - Generate UUID            │
   │ - Get current discount     │
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ INSERT INTO               │
   │ discount_requests         │
   │ Status = 'Pending Review' │
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ Response:                  │
   │ - Request ID               │
   │ - Status 201               │
   │ - Show success message     │
   └────────────────────────────┘

6. ACCEPT QUOTATION
   ┌────────────────┐
   │ Click "Accept  │
   │ Quotation"     │
   └────────┬───────┘
            │
            ▼
   ┌────────────────────────────┐
   │ Show confirmation modal    │
   │ with total amount          │
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ Click "Yes, Accept"        │
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ POST /quotations/:id/accept│
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ Backend:                   │
   │ - Check not already        │
   │   accepted                 │
   │ - Check not rejected       │
   │ - Generate UUID            │
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ INSERT INTO acceptances    │
   │ UPDATE quotations status   │
   │ UPDATE requests status     │
   └────────┬───────────────────┘
            │
            ▼
   ┌────────────────────────────┐
   │ Response:                  │
   │ - Acceptance ID            │
   │ - Accepted timestamp       │
   │ - Status 200               │
   └────────────────────────────┘
```

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│                  AUTHENTICATION FLOW                    │
└─────────────────────────────────────────────────────────┘

REGISTRATION:
User ──register──> Frontend ──POST /auth/register──> Backend
                                                       │
                                                       ├─ Validate
                                                       ├─ Hash Password
                                                       ├─ INSERT customer
                                                       │
User <──redirect──────────── Frontend <──Token────< Backend
(store token)

LOGIN:
User ──login──> Frontend ──POST /auth/login──> Backend
                                               │
                                               ├─ Find customer
                                               ├─ Verify password
                                               ├─ Generate JWT
                                               │
User <──redirect────────── Frontend <──Token──< Backend
(store token)

PROTECTED ENDPOINT:
Frontend ──GET /customer/dashboard──> Backend
          Header: Authorization: Bearer {token}
                                       │
                                       ├─ Verify token signature
                                       ├─ Extract customer_id
                                       ├─ Check expiration
                                       ├─ Query database
                                       │
Frontend <──Dashboard data────────< Backend

TOKEN EXPIRATION:
After 7 days: Token invalid
            │
            ├─ Frontend detects 401 response
            ├─ Clear localStorage
            ├─ Redirect to login
            │
User ──Must login again──> New token generated
```

---

## Authorization Model

```
┌─────────────────────────────────────────────────────────┐
│           AUTHORIZATION & DATA ISOLATION               │
└─────────────────────────────────────────────────────────┘

Customer A                      Customer B
(ID: uuid-111)                 (ID: uuid-222)

    │                               │
    │ Logs in                       │ Logs in
    ▼                               ▼
  Token-A                        Token-B
(contains uuid-111)            (contains uuid-222)

Request: GET /customer/requests
Header: Authorization: Bearer Token-A

    │
    ▼
Backend:
1. Verify token is valid ✓
2. Extract customer_id = uuid-111
3. Query: SELECT * FROM sales_requests 
          WHERE customer_id = uuid-111
4. Return only Customer A's requests

Result: Customer A cannot see Customer B's data
        Even if they try: /customer/requests/REQ-002
        (if REQ-002 belongs to Customer B)
        
        Backend checks:
        SELECT * FROM sales_requests
        WHERE id = 'REQ-002'
        AND customer_id = uuid-111
        
        Result: Not found (404)
```

---

## Component Hierarchy

```
App.jsx
│
├─ Router
│  │
│  ├─ /login ──────────────► Login.jsx
│  ├─ /register ────────────► Register.jsx
│  │
│  ├─ PrivateRoute ◄─ Protected Routes
│  │  │
│  │  ├─ /dashboard ────────► Header + Dashboard.jsx
│  │  │
│  │  ├─ /requests ────────► Header + RequestsList.jsx
│  │  │
│  │  ├─ /requests/new ────► Header + CreateRequest.jsx
│  │  │
│  │  ├─ /requests/:id ────► Header + RequestDetail.jsx
│  │  │
│  │  ├─ /quotations ──────► Header + Quotations.jsx
│  │  │
│  │  ├─ /quotations/:id ──► Header + QuotationDetail.jsx
│  │  │
│  │  └─ /profile ────────► Header + Profile.jsx
│  │
│  └─ Default ────────────► Redirect to /dashboard
│
│ Shared Components:
│ ├─ Header.jsx (on all protected pages)
│ ├─ PrivateRoute.jsx (route protection)
│ └─ api.js (all API calls)
```

---

## API Endpoint Organization

```
/auth (Authentication)
├─ POST /auth/register      (Register new customer)
├─ POST /auth/login         (Login customer)
└─ POST /auth/logout        (Logout)

/customer (Customer Operations)
├─ GET /customer/dashboard  (Dashboard summary)
├─ GET /customer/profile    (Customer profile)
├─ GET /customer/requests   (List requests)
├─ POST /customer/requests  (Create request)
└─ GET /customer/requests/:id (Request details)

/quotations (Quotation Operations)
├─ GET /quotations          (List quotations)
├─ GET /quotations/:id      (Quotation details)
├─ POST /quotations/:id/discount-request (Request discount)
└─ POST /quotations/:id/accept (Accept quotation)

/health (System)
└─ GET /health              (Health check)

Total: 12 endpoints
Authorization: 3 public, 9 require Bearer token
```

---

## Database Relationship Diagram

```
┌──────────────┐
│  Customers   │ (Primary Entity)
├──────────────┤
│ id (PK)      │
│ email        │◄─────┐
│ password_hash│      │
│ full_name    │      │
│ company_name │      │
│ phone_number │      │
└──────────────┘      │
       │              │
       │ 1:N          │ Foreign Key
       │              │
       ▼              │
┌──────────────────┐  │
│ SalesRequests    │  │
├──────────────────┤  │
│ id (PK)          │  │
│ customer_id (FK) ├──┘
│ request_title    │
│ product_req      │
│ quantity         │
│ status           │
│ created_at       │
└──────────────────┘
       │
       │ 1:1
       │
       ▼
┌──────────────────┐
│  Quotations      │
├──────────────────┤
│ id (PK)          │
│ request_id (FK)  │◄─ Relationship
│ customer_id (FK) │
│ quotation_status │
│ valid_until      │
│ created_at       │
└──────────────────┘
       │
       │ 1:N
       │
       ▼
┌──────────────────────────┐
│ QuotationLineItems       │
├──────────────────────────┤
│ id (PK)                  │
│ quotation_id (FK)        │
│ product_name             │
│ quantity                 │
│ unit_price               │
│ discount_percent         │
│ tax_amount               │
│ total_amount             │
└──────────────────────────┘

       Quotations
            │
            │ 1:N
            │
            ▼
    ┌──────────────────────┐
    │ DiscountRequests     │
    ├──────────────────────┤
    │ id (PK)              │
    │ quotation_id (FK)    │
    │ customer_id (FK)     │
    │ requested_discount   │
    │ current_discount     │
    │ reason               │
    │ status               │
    │ manager_approval     │
    └──────────────────────┘

       Quotations
            │
            │ 1:1
            │
            ▼
    ┌──────────────────────┐
    │ QuotationAcceptances │
    ├──────────────────────┤
    │ id (PK)              │
    │ quotation_id (FK)    │
    │ customer_id (FK)     │
    │ accepted_at          │
    └──────────────────────┘
```

---

## File Load Sequence

```
1. User opens browser → index.html

2. index.html loads:
   - vite client
   - src/main.jsx

3. main.jsx loads:
   - React
   - ReactDOM
   - App component
   - index.css

4. App.jsx loads:
   - React Router
   - All page components
   - PrivateRoute component

5. Component loads (e.g., Dashboard):
   - Header component
   - api.js for API calls
   - styles from index.css

6. User interaction:
   - Pages communicate with backend via api.js
   - Token sent in Authorization header
   - Response displayed in component
```

---

## Error Handling Flow

```
User Action
    │
    ▼
Frontend validates (UX check)
    │
    ├─ Valid ──┐
    │          │
    └─ Invalid─┤─► Show frontend error
                │  (Don't send to backend)
                │
                ▼
          Backend receives
              │
              ▼
         Backend validates (Business logic)
              │
              ├─ Valid ─────┐
              │              │
              └─ Invalid ─┐  │
                          │  │
                    Return 400 + error message
                          │  │
                          │  ▼
                  ┌────────────────────┐
                  │ Frontend receives  │
                  │ error response     │
                  └────────────────────┘
                          │
                          ▼
                  ┌────────────────────┐
                  │ Display error to   │
                  │ user in UI         │
                  │ (friendly message) │
                  └────────────────────┘

Authorization Error:
    No token ──────► 401 → Redirect to login
    Expired token ─► 401 → Redirect to login
    Wrong customer► 404 → Resource not found
```

---

## Deployment Architecture (Future)

```
For production deployment:

Internet
    │
    ▼
┌─────────────────────────────────────┐
│ Web Server / Load Balancer          │
│ (Nginx / HAProxy)                   │
└────────────┬────────────────────────┘
             │
             ├─────────────────────┐
             │                     │
             ▼                     ▼
     ┌──────────────┐      ┌──────────────┐
     │ Frontend CDN │      │ API Servers  │
     │ (React build)│      │ (Node.js x3) │
     └──────────────┘      └──┬───────┬──┘
                              │       │
                              ▼       ▼
                         ┌──────────────────┐
                         │ Database         │
                         │ (PostgreSQL)     │
                         │ with replicas    │
                         └──────────────────┘
```

---

**Architecture Version**: 1.0  
**Last Updated**: September 5, 2026  
**Status**: Production Ready
