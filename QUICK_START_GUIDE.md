# DealFlow360 Module 1 - Quick Start Guide

## 🚀 Start the System

### 1. Terminal 1: Start Backend
```bash
npm run server
# Output: Customer Module Server running on http://localhost:5000
```

### 2. Terminal 2: Start Frontend
```bash
cd frontend
npm run dev
# Output: Local: http://localhost:5173
```

### 3. Terminal 3: Run End-to-End Tests (Optional)
```bash
npm run test:e2e
# Runs complete workflow test automatically
```

---

## 📊 Quick Test Workflow (Manual)

### Access Points
- **Frontend**: http://localhost:5173
- **Backend Health**: http://localhost:5000/health
- **Database**: MySQL `dealflow360` database

### Test Scenario (5 minutes)

1. **Register Customer**
   - Go to http://localhost:5173/register
   - Email: test@customer.com, Password: Test@123

2. **Create Query**
   - Click "New Request"
   - Title: Need 50 laptops
   - Quantity: 50
   - Save

3. **Register Salesperson** (Open new browser tab)
   - Go to http://localhost:5173/salesperson/register
   - Email: sales@company.com, Password: Sales@123

4. **Create Quotation**
   - Go to Salesperson Dashboard
   - View Requests → Select query
   - Create Quotation (50 × ₹50,000 with 10% discount)
   - Send to Customer

5. **Customer Requests Discount**
   - Go to Customer Dashboard
   - View Quotation
   - Request 15% Discount (exceeds 10% limit)

6. **Manager Approves**
   - Go to Manager Login: http://localhost:5173/manager/login
   - Email: manager@dealflow.com, Password: Manager@123
   - View Pending Approvals
   - Click Approve

7. **Customer Accepts**
   - Go to Customer Dashboard
   - View Final Quotation
   - Click Accept

**Total Time**: 5 minutes
**Outcome**: Complete workflow from query to acceptance ✅

---

## 🎯 Key Test Credentials

### Test Customer
- Email: manager@abctech.com
- Password: Test@1234
- Role: CUSTOMER

### Test Salesperson
- Email: john.smith@company.com
- Password: Salesperson@123
- Role: SALESPERSON (max_discount: 10%)

### Test Manager
- Email: manager@dealflow.com
- Password: Manager@123
- Role: SALES_MANAGER

---

## 📁 Important Files

### Documentation
- **TEST_PLAN.md** - Comprehensive 20-step test scenario
- **WORKFLOW_COMPLETION_SUMMARY.md** - System overview
- **SYSTEM_VERIFICATION_CHECKLIST.md** - Verification checklist
- **QUICK_START_GUIDE.md** - This file

### Backend Structure
```
backend/
├── server.js - Main Express app
├── auth.js - Authentication logic
├── database.js - MySQL setup & schema
├── business-rules.js - Core business logic
└── routes/
    ├── auth.js - Customer auth
    ├── customer.js - Customer APIs
    ├── salesperson.js - Salesperson APIs
    ├── salesperson-auth.js - Salesperson auth
    ├── manager-auth.js - Manager auth
    ├── manager.js - Manager APIs (NEW)
    └── quotation.js - Quotation endpoints
```

### Frontend Structure
```
frontend/src/
├── App.jsx - Main router
├── api.js - API client
└── pages/
    ├── CustomerRegister.jsx
    ├── CustomerDashboard.jsx
    ├── QuotationDetail.jsx
    ├── SalespersonRegister.jsx
    ├── SalespersonDashboard.jsx
    ├── SalespersonDiscountRequests.jsx
    ├── ManagerLogin.jsx
    ├── ManagerDashboard.jsx
    ├── ManagerApprovalDetail.jsx
    └── ... (other pages)
```

---

## 🔄 Complete Workflow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│ DealFlow360 Module 1 - Complete End-to-End Workflow             │
└─────────────────────────────────────────────────────────────────┘

CUSTOMER                    SALESPERSON              MANAGER
   │                           │                        │
   ├─ Register                 │                        │
   │                           │                        │
   ├─ Create Query             │                        │
   │  (REQ-00001)              │                        │
   │                           │                        │
   │◄─ Salesperson sees query ─┤                        │
   │                           │                        │
   │                           ├─ Create Quotation      │
   │                           │  (Q-00001)             │
   │                           │                        │
   │◄──────── Receives Quote ──┤                        │
   │         (SENT)            │                        │
   │                           │                        │
   ├─ Requests 15% Discount    │                        │
   │  (exceeds 10% limit)      │                        │
   │                           │                        │
   │                           ├─ Approval Required ───►│
   │                           │  (Business Rule)       │
   │                           │                        │
   │                           │                        ├─ Register
   │                           │                        │
   │                           │                        ├─ Review
   │                           │                        │
   │                           │◄───── Approve ────────┤
   │                           │                        │
   │◄──── Updated Quote ──────┤                        │
   │    with 15% discount     │                        │
   │                           │                        │
   ├─ Accept Quotation         │                        │
   │  (ACCEPTED)               │                        │
   │                           │                        │
   └─────────────────────────────────────────────────────┘

Key Business Rule: If discount > salesperson limit → Manager approval
Audit Trail: Every action logged for compliance
```

---

## 🛠️ Troubleshooting

### Backend Not Starting?
```bash
# Check MySQL is running
# Verify port 5000 is available
# Check .env file exists with DB credentials
npm run server
```

### Frontend Not Starting?
```bash
cd frontend
# Check dependencies installed
npm install
npm run dev
```

### Database Issues?
```bash
# Verify MySQL service is running
# Check database 'dealflow360' exists
# Verify tables created (check TEST_PLAN.md for expected schema)
```

### Test Failing?
```bash
# Ensure both backend and frontend are running
# Check browser console for API errors
# Verify correct credentials used
# Check network tab for failed requests
```

---

## 📊 System Statistics

| Component | Status |
|-----------|--------|
| Backend API Endpoints | 22+ ✅ |
| Database Tables | 10 ✅ |
| User Roles | 4 ✅ |
| Status Flows | 3 ✅ |
| Business Rules | 1 ✅ |
| Audit Events | 10+ ✅ |
| Frontend Pages | 15+ ✅ |
| Test Scenarios | 20 ✅ |

---

## ✨ Features Implemented

✅ Customer registration & dashboard
✅ Create sales queries
✅ Salesperson quotation creation
✅ Send quotations to customers
✅ Customer discount requests
✅ Automatic business rule checking
✅ Manager approval workflow
✅ Update quotations with final discounts
✅ Customer acceptance & finalization
✅ Complete audit trail logging
✅ Role-based access control
✅ Proper status flow management
✅ Accurate calculations (subtotal, discount, tax, total)
✅ Database integrity with foreign keys
✅ Error handling and validation

---

## 🎓 Learning Resources in Code

- **Business Rules**: `backend/business-rules.js`
- **Authentication Flow**: `backend/auth.js`
- **Database Schema**: `backend/database.js`
- **API Design**: `backend/routes/*.js`
- **Frontend Integration**: `frontend/src/api.js`
- **UI Patterns**: `frontend/src/pages/*.jsx`

---

## 📞 Support

For issues or questions:
1. Check TEST_PLAN.md for step-by-step guidance
2. Review SYSTEM_VERIFICATION_CHECKLIST.md for requirements
3. Check browser console for errors
4. Check backend server logs for API issues
5. Verify database connection in .env file

---

## 🎉 Success Criteria

Your system is working correctly when:

✅ Customer can register and create queries
✅ Salesperson can see queries and create quotations
✅ Quotations are visible to customers
✅ Discount requests work correctly
✅ Manager gets notified for high discounts
✅ Manager can approve/reject/counter-offer
✅ Final quotations reflect approved discounts
✅ Customers can accept quotations
✅ No duplicate acceptances allowed
✅ Audit trail shows all actions

**When all checkmarks are ✅ → System is Production Ready**

---

**Last Updated**: September 5, 2026
**Status**: ✅ PRODUCTION READY
