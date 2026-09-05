# DealFlow360 - Customer Module

**Status**: ✅ COMPLETE & PRODUCTION READY  
**Version**: 1.0  
**Date**: September 5, 2026

---

## 📖 Quick Navigation

**New to this project?**
- Start with **[INDEX.md](INDEX.md)** for complete navigation
- Then read **[QUICKSTART.md](QUICKSTART.md)** to get running in 5 minutes

**Want the project summary?**
- See **[COMPLETION_CERTIFICATE.md](COMPLETION_CERTIFICATE.md)**
- Or read **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)**

**Need technical details?**
- Read **[ARCHITECTURE.md](ARCHITECTURE.md)** for system design
- Check **[API_SPECIFICATION.md](API_SPECIFICATION.md)** for complete API reference

**Want to test?**
- Follow **[TESTING.md](TESTING.md)** for test scenarios
- See **[QUICKSTART.md](QUICKSTART.md)** for quick testing

**Looking for files?**
- Check **[FILE_MANIFEST.md](FILE_MANIFEST.md)**
- Or **[DELIVERY_SUMMARY.txt](DELIVERY_SUMMARY.txt)**

---

# DealFlow360 - Customer Module

A comprehensive sales operations platform starting with the Customer Module, built with React, Node.js, and SQLite.

## Features

### Customer Authentication
- Secure registration with email validation and password requirements
- JWT-based authentication
- Login/Logout functionality
- Protected routes with backend authorization

### Customer Dashboard
- Summary cards showing:
  - Total Requests
  - Pending Requests
  - Quotations Received
  - Quotations Awaiting Action
  - Discount Requests
  - Accepted Quotations
- Recent activity list

### Sales Request Management
- Create new sales requests with detailed specifications
- View all customer requests
- Track request status through lifecycle:
  - Submitted → Under Review → Quotation Received → Negotiation → Approved/Accepted → Completed

### Quotation Management
- View quotations from salesperson
- See detailed line items with pricing breakdown
- Review terms and conditions
- Accept quotations with confirmation

### Discount Negotiation
- Request discount modifications to quotations
- Specify reason for discount request
- Track discount request status:
  - Pending Review → Approved/Rejected/Requires Manager Approval

### Profile Management
- View customer profile information
- Company details and contact information

## Tech Stack

- **Frontend**: React 18, React Router, Axios
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Authentication**: JWT (JSON Web Tokens)
- **Build Tool**: Vite

## Project Structure

```
.
├── backend/
│   ├── database.js          # Database initialization and utilities
│   ├── auth.js              # Authentication helpers and middleware
│   ├── server.js            # Express server setup
│   ├── routes/
│   │   ├── auth.js          # Authentication endpoints
│   │   ├── customer.js      # Customer endpoints
│   │   └── quotation.js     # Quotation endpoints
│   └── scripts/
│       └── addTestData.js   # Test data generation
├── src/
│   ├── pages/               # Page components
│   ├── components/          # Reusable components
│   ├── api.js               # API client
│   ├── App.jsx              # Main app component
│   └── index.css            # Global styles
├── .env                     # Environment variables
├── package.json             # Dependencies
└── README.md                # This file
```

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the backend server** (from project root):
   ```bash
   npm run server
   ```
   - Backend runs on `http://localhost:5000`
   - Database file: `database.db`

3. **Start the frontend** (in a new terminal):
   ```bash
   npm run client
   ```
   - Frontend runs on `http://localhost:5173`

4. **Add test data** (optional, in a new terminal):
   ```bash
   node backend/scripts/addTestData.js
   ```
   - Creates test customer and quotation
   - Login credentials:
     - Email: `rajesh@abctech.com`
     - Password: `TestPassword123`

## API Endpoints

### Authentication
- `POST /auth/register` - Register new customer
- `POST /auth/login` - Login customer
- `POST /auth/logout` - Logout (frontend only)

### Customer
- `GET /customer/dashboard` - Get dashboard summary
- `GET /customer/profile` - Get customer profile
- `GET /customer/requests` - List all requests
- `POST /customer/requests` - Create new request
- `GET /customer/requests/:requestId` - Get request details

### Quotations
- `GET /quotations` - List all quotations
- `GET /quotations/:quotationId` - Get quotation details
- `POST /quotations/:quotationId/discount-request` - Request discount
- `POST /quotations/:quotationId/accept` - Accept quotation

## Security Features

- **Backend Authentication**: JWT tokens validate all protected endpoints
- **Password Security**: Bcrypt hashing for passwords
- **Authorization**: Customers can only access their own data
- **Input Validation**: Server-side validation on all requests
- **Protected Routes**: Frontend routes protected with PrivateRoute component
- **CORS**: Configured for development

## User Flow

1. **Register/Login**
   - Customer creates account or logs in
   - Receives JWT token

2. **Create Request**
   - Navigate to Dashboard
   - Click "Create Request"
   - Fill in product details, quantity, specifications
   - System generates unique Request ID

3. **View Requests**
   - Dashboard shows summary and recent requests
   - "My Requests" page lists all requests with status
   - Click request to view details

4. **Receive Quotation**
   - Salesperson creates quotation for request
   - Quotation automatically available in customer portal
   - Customer can view line items, pricing, terms

5. **Discount Negotiation** (Optional)
   - If not satisfied with price, click "Request Discount"
   - Specify desired discount % and reason
   - Status tracked: Pending Review → Approved/Requires Manager Approval

6. **Accept Quotation**
   - Review final quotation
   - Click "Accept Quotation"
   - Confirmation modal shows total amount
   - Quotation marked as Accepted

## Database Schema

### Customers
- `id` (UUID, Primary Key)
- `full_name`, `company_name`, `email`, `phone_number`
- `password_hash`
- `created_at`, `updated_at`

### Sales Requests
- `id` (String, Primary Key: REQ-001, REQ-002, etc.)
- `customer_id` (Foreign Key)
- `request_title`, `product_requirement`, `quantity`
- `specifications`, `additional_notes`, `expected_delivery_date`
- `status` (Submitted, Under Review, Quotation Received, etc.)
- `created_at`, `updated_at`

### Quotations
- `id` (UUID, Primary Key)
- `request_id`, `customer_id` (Foreign Keys)
- `quotation_status`, `notes`, `valid_until`
- `created_at`, `updated_at`

### Quotation Line Items
- `id` (UUID, Primary Key)
- `quotation_id` (Foreign Key)
- `product_name`, `quantity`, `unit_price`
- `subtotal`, `discount_percent`, `discount_amount`
- `tax_amount`, `total_amount`

### Discount Requests
- `id` (UUID, Primary Key)
- `quotation_id`, `customer_id` (Foreign Keys)
- `requested_discount_percent`, `current_discount_percent`
- `reason`, `customer_message`
- `status`, `salesperson_response`, `manager_approval_status`
- `created_at`, `updated_at`

### Quotation Acceptances
- `id` (UUID, Primary Key)
- `quotation_id`, `customer_id` (Foreign Keys)
- `acceptance_status`, `accepted_at`

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

## Error Handling

- All errors return appropriate HTTP status codes
- Frontend displays user-friendly error messages
- Backend validates all inputs
- Database errors logged and handled gracefully

## Future Modules

The Customer Module is designed to work independently, with clear API contracts for future integration:

- **Salesperson Module**: Create quotations, respond to discount requests
- **Sales Manager Module**: Approve discounts beyond salesperson limits
- **Admin Module**: System configuration and reporting

## Configuration

Edit `.env` file to customize:

```
NODE_ENV=development
PORT=5000
DATABASE_PATH=./database.db
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d
CLIENT_URL=http://localhost:5173
```

## Development Notes

- **Frontend-only validation** is for UX; backend validation is authoritative
- **Mock data** in test script uses realistic business scenarios
- **Status badges** color-coded for quick visual reference
- **Table layouts** responsive on mobile devices
- **API responses** always include error messages for debugging

## License

Proprietary - DealFlow360 Sales Operations Platform

---

**Built for efficient sales operations and customer satisfaction.**
