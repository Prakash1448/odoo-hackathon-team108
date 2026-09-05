# 🚀 Quick Start: Python FastAPI Backend

## ⚡ 30-Second Setup

```bash
cd pybackend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 5000
```

**That's it!** Backend runs at: http://localhost:5000

---

## 🎯 What You Get

✅ **34+ API Endpoints**
- 9 Customer endpoints
- 14 Salesperson endpoints  
- 6 Manager endpoints
- 3 Auth endpoints per role

✅ **Complete Database**
- 8 MySQL tables auto-created
- Proper relationships
- Indexes on all FK columns

✅ **Full Security**
- JWT authentication
- Password hashing with bcrypt
- Role-based access control
- Ownership validation

✅ **Zero Frontend Changes**
- Frontend works immediately
- Same API contracts
- Same response formats
- Same field names

---

## 📝 Quick Tests

### 1. Health Check
```bash
curl http://localhost:5000/health
```

### 2. Register Customer
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "companyName": "ABC Corp",
    "email": "john@example.com",
    "phoneNumber": "+91-9876543210",
    "password": "Password123",
    "confirmPassword": "Password123"
  }'
```

### 3. View API Docs
Open: http://localhost:5000/docs

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `app/main.py` | FastAPI app entry point |
| `app/routers/auth.py` | Authentication endpoints |
| `app/routers/customer.py` | Customer endpoints |
| `app/routers/salesperson.py` | Salesperson endpoints |
| `app/routers/manager.py` | Manager endpoints |
| `app/models/` | Database models (8 files) |
| `.env` | Configuration |
| `requirements.txt` | Python dependencies |

---

## 🔑 Environment (.env)

```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=Jayam@321
MYSQL_DATABASE=dealflow360

JWT_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:5173
```

---

## 🧪 Testing Workflow

### 1. Register as Customer
```bash
POST /auth/register
Response: { "token": "...", "customer": { ... } }
```

### 2. Create Sales Request
```bash
POST /customer/requests (with token)
Body: {
  "requestTitle": "...",
  "productRequirement": "...",
  "quantity": 5
}
```

### 3. Login as Salesperson
```bash
POST /auth/salesperson/login
Response: { "token": "...", "salesperson": { ... } }
```

### 4. Create Quotation
```bash
POST /salesperson/requests/{id}/quotation (with token)
Body: {
  "lineItems": [
    { "product_name": "...", "quantity": 5, "unit_price": 100 }
  ]
}
```

### 5. Customer Requests Discount
```bash
POST /customer/quotations/{id}/discount-request (with token)
Body: {
  "requestedDiscountPercent": 10,
  "reason": "Volume discount"
}
```

### 6. Manager Approves/Rejects
```bash
POST /manager/discount-requests/{id}/approve (with token)
OR
POST /manager/discount-requests/{id}/reject (with token)
```

---

## 📊 Database Schema

**8 Automatic Tables:**
1. users - User accounts
2. customers - Customer details
3. salespersons - Salesperson details
4. sales_managers - Manager details
5. sales_requests - Requests
6. quotations - Quotations
7. quotation_line_items - Line items
8. discount_requests - Discount workflows

All created automatically on first startup!

---

## 🔐 Authentication

**How it Works:**
1. User registers/logs in
2. Backend returns JWT token
3. Frontend stores in localStorage
4. Subsequent requests include: `Authorization: Bearer {token}`
5. Backend validates and returns user data

**Roles:**
- CUSTOMER - Access customer endpoints
- SALESPERSON - Access salesperson endpoints
- SALES_MANAGER - Access manager endpoints

---

## 🐛 Troubleshooting

### MySQL Connection Error
```bash
# Check MySQL is running
mysql -u root -p
# Or on Windows
net start MySQL80
```

### Port Already in Use
```bash
uvicorn app.main:app --port 5001
```

### Module Not Found
```bash
pip install -r requirements.txt
```

### Virtual Environment Issues
```bash
# Delete and recreate
rmdir /s venv
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

## 📚 Full Documentation

- **Setup Guide:** `PYTHON_FASTAPI_BACKEND_SETUP.md`
- **Completion Report:** `PYTHON_BACKEND_COMPLETION_REPORT.md`
- **Backend README:** `pybackend/README.md`

---

## 🚀 Deployment

### Development
```bash
uvicorn app.main:app --reload --port 5000
```

### Production
```bash
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

---

## ✨ Key Features

✅ **Modern Stack:** FastAPI + SQLAlchemy + MySQL
✅ **Type Safe:** Full type hints throughout
✅ **Async Ready:** ASGI server
✅ **Auto Docs:** Swagger UI at /docs
✅ **Validated:** Pydantic schemas
✅ **Secured:** JWT + bcrypt + RBAC
✅ **Tested:** All endpoints work
✅ **Documented:** Complete API docs

---

## 📞 Need Help?

1. Check `/docs` endpoint for interactive API docs
2. Read `README.md` in pybackend directory
3. Check error messages in terminal
4. Review database with MySQL client

---

## 🎉 Done!

Your Python FastAPI backend is ready. The frontend will work seamlessly with it!

**Frontend:** http://localhost:5173
**Backend:** http://localhost:5000
**Docs:** http://localhost:5000/docs

Enjoy! 🚀
