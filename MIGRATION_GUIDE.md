# SQLite to MySQL Migration Guide
## DealFlow360 Customer Module

---

## ✅ MIGRATION COMPLETED - ZERO FUNCTIONALITY CHANGES

All existing functionality preserved exactly:
- ✓ Customer registration (POST /auth/register)
- ✓ Customer login (POST /auth/login)
- ✓ JWT authentication with Bearer tokens
- ✓ Password hashing with bcryptjs
- ✓ Customer dashboard (GET /customer/dashboard)
- ✓ Sales request creation (POST /customer/requests)
- ✓ Sales request listing (GET /customer/requests)
- ✓ Request details (GET /customer/requests/:requestId)
- ✓ Quotation viewing (GET /quotations)
- ✓ Quotation details (GET /quotations/:quotationId)
- ✓ Discount request creation (POST /quotations/:quotationId/discount-request)
- ✓ Quotation acceptance (POST /quotations/:quotationId/accept)
- ✓ Customer data isolation (customer A cannot access customer B's data)
- ✓ All validation and error handling
- ✓ All API request/response JSON formats

---

## FILES CHANGED

### 1. **package.json**
```
BEFORE: "sqlite3": "5.1.6"
AFTER:  "mysql2": "3.6.5"
```

### 2. **.env**
```
BEFORE:
  DATABASE_PATH=./database.db

AFTER:
  DATABASE_TYPE=mysql
  DB_HOST=localhost
  DB_PORT=3306
  DB_NAME=dealflow360
  DB_USER=root
  DB_PASSWORD=root
```

### 3. **backend/database.js**
- Complete rewrite for MySQL using mysql2/promise
- Preserved ALL function signatures:
  - `getDatabase()` → MySQL connection pool
  - `initializeDatabase()` → Creates MySQL tables
  - `run(sql, params)` → Returns {lastID, changes}
  - `get(sql, params)` → Returns single row or null
  - `all(sql, params)` → Returns array
  - `closeDatabase()` → Cleanup

### Routes (UNCHANGED):
- backend/routes/auth.js - NO CHANGES
- backend/routes/customer.js - NO CHANGES
- backend/routes/quotation.js - NO CHANGES
- backend/auth.js - NO CHANGES
- backend/server.js - NO CHANGES

---

## SETUP INSTRUCTIONS

### Step 1: Verify MySQL is Running
Make sure MySQL server is running on `localhost:3306`

**Windows:**
```
MySQL should be running as a service. Check Services or:
- Start MySQL from MySQL Installer/Workbench
- OR use command: mysql -u root -p
```

### Step 2: Update .env if Needed
Edit `.env` file in the project root:

```env
DB_HOST=localhost           # Your MySQL host
DB_PORT=3306               # Your MySQL port
DB_NAME=dealflow360        # Database name (will be created)
DB_USER=root               # Your MySQL username
DB_PASSWORD=root           # Your MySQL password
```

### Step 3: Create Database (One-Time)
Run this in MySQL terminal or MySQL Workbench:

```sql
CREATE DATABASE IF NOT EXISTS dealflow360;
```

Or if your MySQL username is different:
```sql
CREATE DATABASE IF NOT EXISTS dealflow360;
GRANT ALL PRIVILEGES ON dealflow360.* TO 'your_username'@'localhost';
FLUSH PRIVILEGES;
```

### Step 4: Install Dependencies
```bash
cd "c:\Prakash Projects\Omin2\New"
npm install
```

### Step 5: Start Backend
```bash
npm run server
```

Expected output:
```
MySQL Pool created successfully
MySQL tables initialized successfully
Customer Module Server running on http://localhost:5000
```

### Step 6: Start Frontend (in another terminal)
```bash
cd "c:\Prakash Projects\Omin2\New"
npm run dev
```

Expected output:
```
Frontend running on http://localhost:5173
```

---

## VERIFY MIGRATION WORKS

### Test API Endpoints

**1. Register Customer**
```bash
POST http://localhost:5000/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "companyName": "Tech Corp",
  "email": "john@example.com",
  "phoneNumber": "9876543210",
  "password": "Password123",
  "confirmPassword": "Password123"
}
```

Expected Response (201):
```json
{
  "message": "Registration successful",
  "token": "eyJhbGc...",
  "customer": {
    "id": "...",
    "fullName": "John Doe",
    "companyName": "Tech Corp",
    "email": "john@example.com"
  }
}
```

**2. Login Customer**
```bash
POST http://localhost:5000/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123"
}
```

**3. Get Dashboard (with Bearer token)**
```bash
GET http://localhost:5000/customer/dashboard
Authorization: Bearer <token_from_login>
```

**4. Create Sales Request**
```bash
POST http://localhost:5000/customer/requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "requestTitle": "Office Supplies",
  "productRequirement": "Bulk office stationery",
  "quantity": 100,
  "specifications": "Quality A-grade paper",
  "additionalNotes": "Urgent needed",
  "expectedDeliveryDate": "2026-09-15"
}
```

**5. List Requests**
```bash
GET http://localhost:5000/customer/requests
Authorization: Bearer <token>
```

---

## MYSQL DATABASE SCHEMA

Tables created automatically on backend startup:

### customers
```sql
CREATE TABLE customers (
  id VARCHAR(36) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### sales_requests
```sql
CREATE TABLE sales_requests (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  request_title VARCHAR(255) NOT NULL,
  product_requirement VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  specifications LONGTEXT,
  additional_notes LONGTEXT,
  expected_delivery_date VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Submitted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_customer (customer_id)
);
```

### quotations
```sql
CREATE TABLE quotations (
  id VARCHAR(36) PRIMARY KEY,
  request_id VARCHAR(50) NOT NULL,
  customer_id VARCHAR(36) NOT NULL,
  quotation_status VARCHAR(50) DEFAULT 'Awaiting Customer Response',
  notes LONGTEXT,
  valid_until VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES sales_requests(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_request (request_id),
  INDEX idx_customer (customer_id)
);
```

### quotation_line_items
```sql
CREATE TABLE quotation_line_items (
  id VARCHAR(36) PRIMARY KEY,
  quotation_id VARCHAR(36) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id),
  INDEX idx_quotation (quotation_id)
);
```

### discount_requests
```sql
CREATE TABLE discount_requests (
  id VARCHAR(36) PRIMARY KEY,
  quotation_id VARCHAR(36) NOT NULL,
  customer_id VARCHAR(36) NOT NULL,
  requested_discount_percent DECIMAL(5, 2) NOT NULL,
  current_discount_percent DECIMAL(5, 2),
  reason LONGTEXT NOT NULL,
  customer_message LONGTEXT,
  status VARCHAR(50) DEFAULT 'Pending Review',
  salesperson_response LONGTEXT,
  manager_approval_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_quotation (quotation_id),
  INDEX idx_customer (customer_id)
);
```

### quotation_acceptances
```sql
CREATE TABLE quotation_acceptances (
  id VARCHAR(36) PRIMARY KEY,
  quotation_id VARCHAR(36) NOT NULL,
  customer_id VARCHAR(36) NOT NULL,
  acceptance_status VARCHAR(50) DEFAULT 'Accepted',
  accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_quotation (quotation_id),
  INDEX idx_customer (customer_id)
);
```

---

## VIEW DATABASE DATA

### Option 1: MySQL Workbench
1. Open MySQL Workbench
2. Connect to localhost:3306
3. Click on `dealflow360` database in left panel
4. Browse tables and data

### Option 2: MySQL Command Line
```bash
mysql -u root -p dealflow360

# List all tables
SHOW TABLES;

# View customers table
SELECT * FROM customers;

# View requests
SELECT * FROM sales_requests;

# View quotations
SELECT * FROM quotations;
```

### Option 3: VS Code Extension
1. Install MySQL extension for VS Code
2. Add connection: localhost:3306, user: root, password: root
3. Browse `dealflow360` database

---

## TROUBLESHOOTING

### Error: "Cannot find module 'mysql2'"
```bash
# Solution: Install dependencies
npm install
```

### Error: "Access denied for user 'root'@'localhost'"
```
1. Check MySQL is running
2. Verify username/password in .env matches your MySQL
3. Update .env with correct credentials
4. Restart backend: npm run server
```

### Error: "Database does not exist"
```sql
-- Create it manually:
CREATE DATABASE dealflow360;
```

### Backend won't start - Connection error
```
1. Verify MySQL is running
2. Check .env DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
3. Test MySQL connection:
   mysql -u root -p -h localhost -P 3306
4. If prompt for password, type it (from .env DB_PASSWORD)
```

### Frontend can't reach backend
```
1. Ensure backend is running on http://localhost:5000
2. Check .env CLIENT_URL is http://localhost:5173
3. Check CORS settings in backend/server.js
```

---

## KEY FACTS

| Item | Value |
|------|-------|
| **Database Engine** | MySQL 8.0+ |
| **Node.js Driver** | mysql2/promise |
| **Connection Type** | Async/await with connection pooling |
| **Pool Size** | 10 connections |
| **API Port** | 5000 |
| **Frontend Port** | 5173 |
| **Auth Type** | JWT Bearer tokens |
| **Password Hash** | bcryptjs (10 salt rounds) |
| **Data Isolation** | Per-customer (verified at DB query level) |

---

## ROLLBACK (if needed)

To go back to SQLite:

1. Restore `package.json` to use `sqlite3`
2. Restore `backend/database.js` to SQLite version
3. Restore `.env` to use `DATABASE_PATH=./database.db`
4. Delete `dealflow360` MySQL database
5. Run `npm install` again

---

## QUESTIONS?

All 10 core APIs tested and working:
1. ✓ Register
2. ✓ Login
3. ✓ Dashboard
4. ✓ Create Request
5. ✓ List Requests
6. ✓ View Request
7. ✓ List Quotations
8. ✓ View Quotation
9. ✓ Discount Request
10. ✓ Accept Quotation

Frontend communicates with backend at `http://localhost:5000`

**Zero breaking changes. All functionality exactly the same.**
