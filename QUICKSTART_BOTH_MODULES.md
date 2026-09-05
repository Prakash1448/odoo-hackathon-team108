# DealFlow360 - Quick Start Guide (Both Modules)

**Last Updated**: September 5, 2026
**Status**: ✅ Both modules running and tested

---

## STEP 1: Start Backend

```bash
cd "c:\Prakash Projects\Omin2\New"
npm run server
```

Expected output:
```
MySQL Pool created successfully
MySQL tables initialized successfully
Customer Module Server running on http://localhost:5000
Client URL: http://localhost:5173
```

---

## STEP 2: Start Frontend (New Terminal)

```bash
cd "c:\Prakash Projects\Omin2\New\frontend"
npm run dev
```

Expected output:
```
VITE v5.4.21 ready in 1026 ms
➜  Local:   http://localhost:5173/
```

---

## ACCESS URLS

### Customer Portal
```
http://localhost:5173/login
```

**Test Customer Login:**
- Email: `alice@techcorp.com`
- Password: `SecurePass123`

### Salesperson Portal
```
http://localhost:5173/salesperson/login
```

**Test Salesperson Login:**
- Email: `john.sales@dealflow360.com`
- Password: `SalesPass123`

---

## WORKFLOW DEMO (10 minutes)

### 1. Customer Creates Request (2 min)

1. Open http://localhost:5173/login
2. Register new customer OR login with existing
3. Go to "/requests/new"
4. Fill form:
   - Title: "Test Product Request"
   - Product: "Premium Paper"
   - Quantity: 1000
   - Expected Date: Tomorrow
5. Click "Submit Request"
6. View request in dashboard

### 2. Salesperson Reviews Request (2 min)

1. Open http://localhost:5173/salesperson/login
2. Register new salesperson OR login with existing
3. Go to "/salesperson/dashboard"
4. See customer request in "Recent Requests"
5. Click "View" to see details
6. Note customer info and requirements

### 3. Salesperson Creates Quotation (2 min)

1. From request detail, click "Create Quotation"
2. Add line items:
   - Product: "Premium Paper 500 sheets"
   - Quantity: 2
   - Unit Price: $10.00
3. Add discount: 10%
4. Set tax: 18%
5. Set valid until: 30 days from now
6. Click "Create Quotation"

### 4. Salesperson Sends Quotation (1 min)

1. From quotation detail, click "Send to Customer"
2. Quotation changes from "Draft" to "Awaiting Customer Response"
3. Status updates in dashboard

### 5. Customer Views Quotation (1 min)

1. Switch to customer account
2. Go to "/quotations"
3. See quotation created by salesperson
4. Click to view details
5. See line items with calculations:
   - Subtotal, Discount, Tax, Total
6. Option to "Accept Quotation" or "Request Discount"

### 6. Customer Requests Discount (1 min)

1. From quotation detail, click "Request Discount / Negotiate"
2. Fill form:
   - Requested Discount: 15%
   - Reason: "Bulk order volume"
   - Message: "Please match competitor pricing"
3. Click "Submit Request"
4. Discount request appears in quotation

### 7. Salesperson Reviews Discount (1 min)

1. Switch to salesperson account
2. Go to "/salesperson/discount-requests"
3. See customer's discount request
4. Click "Review"
5. Options to:
   - Approve (apply discount)
   - Reject (decline)
   - Counter Offer (suggest different)
   - Requires Manager Approval (escalate)
6. Add response: "Requesting manager approval for 15%"
7. Click "Update Status"

---

## QUICK ACTIONS

### Customer Actions
- `/` - Redirect to login
- `/login` - Customer login/register
- `/dashboard` - View metrics and recent requests
- `/requests` - List all requests
- `/requests/new` - Create new request
- `/requests/:id` - View request + quotation
- `/quotations` - List all quotations
- `/quotations/:id` - View quotation + accept/discount
- `/profile` - View customer profile

### Salesperson Actions
- `/salesperson/login` - Salesperson login/register
- `/salesperson/dashboard` - View sales metrics
- `/salesperson/requests` - List customer requests
- `/salesperson/requests/:id` - View request + create quotation
- `/salesperson/quotations` - List quotations
- `/salesperson/quotations/:id` - View quotation + send
- `/salesperson/discount-requests` - Handle discount requests

---

## API ENDPOINTS (Manual Testing)

### Customer Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@techcorp.com",
    "password": "SecurePass123"
  }'
```

### Salesperson Login
```bash
curl -X POST http://localhost:5000/auth/salesperson/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.sales@dealflow360.com",
    "password": "SalesPass123"
  }'
```

### Get Dashboard (use token from login)
```bash
curl -X GET http://localhost:5000/salesperson/dashboard \
  -H "Authorization: Bearer {TOKEN_HERE}"
```

### View Requests
```bash
curl -X GET http://localhost:5000/salesperson/requests \
  -H "Authorization: Bearer {TOKEN_HERE}"
```

---

## TROUBLESHOOTING

### Backend won't start
```bash
# Check if MySQL is running
# Check .env file has correct credentials
# Kill any process on port 5000
netstat -ano | find "5000"
taskkill /PID {PID} /F

# Try again
npm run server
```

### Frontend won't start
```bash
# Kill any process on port 5173
netstat -ano | find "5173"
taskkill /PID {PID} /F

# Clear node_modules and reinstall
cd frontend
del node_modules -r
npm install
npm run dev
```

### Login fails
```
- Check email/password are correct
- Clear localStorage: F12 > Application > Local Storage > Clear All
- Try in Incognito mode
- Check backend is running (curl http://localhost:5000/health)
```

### CORS errors
```
- Ensure frontend is on http://localhost:5173
- Check .env CLIENT_URL matches
- Restart backend after changing .env
```

---

## WHAT TO TEST

✅ Customer can register and login
✅ Customer can create request
✅ Salesperson can see customer request
✅ Salesperson can create quotation
✅ Salesperson can send quotation
✅ Customer can see sent quotation
✅ Customer can request discount
✅ Salesperson can view discount request
✅ Salesperson can respond to discount
✅ Customer can accept quotation
✅ Dashboard metrics update
✅ No errors in browser console
✅ No errors in backend terminal

---

## DATABASE

### Check Tables
```sql
mysql -u root -pJayam@321

USE dealflow360;
SHOW TABLES;
DESC salespersons;
DESC customers;
DESC sales_requests;
```

### View Test Data
```sql
SELECT * FROM customers;
SELECT * FROM salespersons;
SELECT * FROM sales_requests;
SELECT * FROM quotations;
```

### Clear Test Data (if needed)
```sql
-- Delete in correct order (foreign keys)
DELETE FROM quotation_acceptances;
DELETE FROM discount_requests;
DELETE FROM quotation_line_items;
DELETE FROM quotations;
DELETE FROM sales_requests;
DELETE FROM customers;
DELETE FROM salespersons;
```

---

## FILES TO CHECK

```
c:\Prakash Projects\Omin2\New\
├── .env                          # Configuration
├── package.json                  # Dependencies
├── backend/
│   ├── server.js                 # Entry point
│   ├── auth.js                   # Auth functions
│   ├── database.js               # DB connection
│   └── routes/
│       ├── auth.js               # Customer auth
│       ├── salesperson-auth.js    # Salesperson auth
│       ├── customer.js            # Customer APIs
│       ├── quotation.js           # Quotation APIs
│       └── salesperson.js         # Salesperson APIs
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Routes
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── SalespersonLogin.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── SalespersonDashboard.jsx
│   │   │   └── ... more pages
│   │   └── styles/
│   │       ├── Auth.css
│   │       ├── Dashboard.css
│   │       ├── List.css
│   │       └── Detail.css
│   ├── vite.config.js
│   └── package.json
└── TEST_RESULTS.md               # Test documentation
```

---

## NEXT STEPS

After testing both modules:

1. **Module 3 - Sales Manager**: Add manager approval workflow for discounts
2. **Module 4 - Warehouse**: Add inventory and warehouse management
3. **Module 5 - Billing**: Add subscription and billing system

---

## CONTACT & SUPPORT

For issues or questions:
1. Check TEST_RESULTS.md for detailed test cases
2. Check SALESPERSON_MODULE_COMPLETE.md for full documentation
3. Review logs in browser console (F12)
4. Check backend terminal for error messages
5. Verify MySQL connection in .env

---

**Status**: ✅ READY TO USE

Both Customer Module and Salesperson Module are fully implemented, tested, and running. Enjoy! 🚀
