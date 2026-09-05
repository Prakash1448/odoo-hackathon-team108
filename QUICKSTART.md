# DealFlow360 Customer Module - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Application

**Option A: Automated (Both servers at once)**
```bash
npm run dev
```

**Option B: Manual (In separate terminals)**

Terminal 1 - Backend:
```bash
npm run server
```

Terminal 2 - Frontend:
```bash
npm run client
```

You should see:
- Backend: "Customer Module Server running on http://localhost:5000"
- Frontend: "ready in XXXms"

### Step 3: Open Browser
```
http://localhost:5173
```

---

## 📝 Test the Application

### Add Sample Data
In a new terminal:
```bash
npm run test:data
```

This creates:
- Test customer account
- Sample sales request
- Sample quotation with line items

### Login with Test Account
- **Email**: `rajesh@abctech.com`
- **Password**: `TestPassword123`

Or create your own account by registering.

---

## 🧪 Complete Demo Flow

1. **Register** → Create new customer account
2. **Login** → Login with your credentials
3. **Dashboard** → View summary cards and recent requests
4. **Create Request** → Submit a sales requirement
5. **View Quotation** → See the quote with pricing (after salesperson creates it)
6. **Request Discount** → Negotiate on price
7. **Accept Quote** → Finalize the deal

---

## 📋 Verify Everything Works

### Backend Health Check
```bash
curl http://localhost:5000/health
```
Response: `{"status":"OK","timestamp":"..."}`

### Create Test Customer via API
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "companyName": "Tech Corp",
    "email": "john@techcorp.com",
    "phoneNumber": "+911234567890",
    "password": "Password123",
    "confirmPassword": "Password123"
  }'
```

### Login via API
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@techcorp.com",
    "password": "Password123"
  }'
```

Copy the `token` from response.

### Access Protected Endpoint
```bash
curl -X GET http://localhost:5000/customer/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔧 Configuration

Edit `.env` to customize:

```env
NODE_ENV=development
PORT=5000                           # Backend port
DATABASE_PATH=./database.db         # SQLite database location
JWT_SECRET=your-secret-key-here     # Change in production!
JWT_EXPIRY=7d                       # Token expiration time
CLIENT_URL=http://localhost:5173    # Frontend URL
```

---

## 📱 Frontend Routes

After login, available routes:

- `/dashboard` - Main dashboard
- `/requests` - List all requests
- `/requests/new` - Create new request
- `/requests/:id` - View request details
- `/quotations` - List all quotations
- `/quotations/:id` - View quotation details
- `/profile` - Customer profile

---

## 🛢️ Database

SQLite database is automatically created at `./database.db` on first run.

### View Database Contents
Using SQLite CLI:
```bash
sqlite3 database.db

# Inside sqlite3 prompt:
.tables                           # List all tables
SELECT * FROM customers;          # View customers
SELECT * FROM sales_requests;     # View requests
SELECT * FROM quotations;         # View quotations
.quit
```

### Database Tables
- `customers` - Customer accounts
- `sales_requests` - Sales requirements
- `quotations` - Quotation documents
- `quotation_line_items` - Individual items in quotations
- `discount_requests` - Negotiation requests
- `quotation_acceptances` - Accepted quotations

---

## 🐛 Troubleshooting

### "Cannot find module..."
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use
Backend on 5000, Frontend on 5173. If in use:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

### Database Locked
If you see "database is locked" error:
```bash
# Remove the database file and start fresh
rm database.db
npm run server
```

### Frontend Won't Connect to Backend
Check `.env` file - ensure `CLIENT_URL` matches where frontend is running.

### Token Issues
- Tokens expire after 7 days (configurable in `.env`)
- Log in again to get new token
- Check browser console for error details

---

## 📚 API Documentation

### Authentication Endpoints
```
POST   /auth/register              Register new customer
POST   /auth/login                 Login customer
POST   /auth/logout                Logout
```

### Customer Endpoints
```
GET    /customer/dashboard         Dashboard summary
GET    /customer/profile           Customer profile
GET    /customer/requests          List requests
POST   /customer/requests          Create request
GET    /customer/requests/:id      Request details
```

### Quotation Endpoints
```
GET    /quotations                 List quotations
GET    /quotations/:id             Quotation details
POST   /quotations/:id/discount-request    Request discount
POST   /quotations/:id/accept      Accept quotation
```

---

## 🔒 Security Features

✅ **Implemented**:
- Password hashing with bcrypt
- JWT token authentication
- Backend authorization checks
- Input validation on all endpoints
- CORS protection
- Customer can only access own data

⚠️ **For Production**:
- Change `JWT_SECRET` in `.env`
- Use HTTPS/TLS
- Implement rate limiting
- Add request logging
- Set up monitoring
- Enable database backups
- Implement password reset flow

---

## 📊 Monitor Application

### Check Logs
```bash
# Backend logs show in terminal where server is running
# Look for: "Customer Module Server running..."

# Frontend logs appear in browser console (F12 in Chrome)
```

### Test API Endpoints
Use provided curl commands or:
- [Postman](https://www.postman.com/) - API testing tool
- [Insomnia](https://insomnia.rest/) - REST client

### Monitor Database
```bash
# Watch database file size
ls -lh database.db

# Count records
sqlite3 database.db "SELECT COUNT(*) FROM customers;"
```

---

## 🚢 Deployment Readiness

The Customer Module is ready for:
1. **Local Development** ✅
2. **Team Testing** ✅
3. **Integration with Salesperson Module** ✅
4. **Future Production Deployment** (requires hardening)

### Before Production
- [ ] Change JWT secret
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure logging
- [ ] Add rate limiting
- [ ] Set up monitoring
- [ ] Test with load
- [ ] Security audit
- [ ] Password reset implementation

---

## 📞 Support

### Check Existing Features
See `README.md` for complete documentation

### Review Test Guide
See `TESTING.md` for detailed test scenarios

### Verify Database Schema
```bash
sqlite3 database.db ".schema"
```

---

## ✅ Quick Verification Checklist

After starting the application:

- [ ] Backend server running on port 5000
- [ ] Frontend accessible on http://localhost:5173
- [ ] Can register new customer account
- [ ] Can login with credentials
- [ ] Dashboard loads and shows summary cards
- [ ] Can create new sales request
- [ ] Request appears in My Requests
- [ ] Can view request details
- [ ] Can accept quotations (after test data added)
- [ ] Profile page displays customer info
- [ ] Can logout successfully

---

## 🎯 Next Steps

After verifying the Customer Module works:

1. **Integrate with Salesperson Module** (coming next)
   - Salesperson creates quotations
   - Salesperson responds to discount requests

2. **Integrate with Sales Manager Module** (coming after)
   - Manager approves high-value discounts
   - Manager views analytics

3. **Add Features**
   - Email notifications
   - Password reset
   - Request history export
   - Advanced search and filters

---

**Happy testing! 🎉**

For issues or questions, refer to `README.md` and `TESTING.md`.
