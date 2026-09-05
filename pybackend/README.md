# DealFlow360 FastAPI Backend

A complete Python FastAPI backend for the DealFlow360 sales management system.

## Project Structure

```
pybackend/
├── app/
│   ├── core/
│   │   ├── config.py          # Configuration management
│   │   ├── database.py        # SQLAlchemy setup
│   │   └── security.py        # JWT & password hashing
│   ├── models/
│   │   ├── user.py
│   │   ├── customer.py
│   │   ├── salesperson.py
│   │   ├── sales_manager.py
│   │   ├── sales_request.py
│   │   ├── quotation.py
│   │   ├── quotation_line.py
│   │   └── discount_request.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── customer.py
│   │   ├── salesperson.py
│   │   └── manager.py
│   ├── routers/
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── customer.py        # Customer endpoints
│   │   ├── salesperson.py     # Salesperson endpoints
│   │   ├── manager.py         # Manager endpoints
│   │   └── health.py          # Health check
│   ├── dependencies/
│   │   └── auth.py            # JWT verification
│   └── main.py                # FastAPI app entry point
├── .env                        # Environment variables
├── .gitignore
├── requirements.txt            # Python dependencies
└── README.md
```

## Setup Instructions

### 1. Prerequisites

- Python 3.9+
- MySQL 8.0+
- pip (Python package manager)

### 2. Create Virtual Environment

```bash
cd pybackend
python -m venv venv
```

**Activate on Windows:**
```bash
venv\Scripts\activate
```

**Activate on macOS/Linux:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

Edit `.env` file with your MySQL credentials:

```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=dealflow360

JWT_SECRET=your_secret_key
JWT_EXPIRY=7d
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 5. Run Backend Server

```bash
uvicorn app.main:app --reload --port 5000
```

Server will be available at: `http://localhost:5000`

## API Endpoints

### Health Check
- **GET** `/health` - Health check endpoint

### Authentication
- **POST** `/auth/register` - Customer registration
- **POST** `/auth/login` - Customer login
- **POST** `/auth/logout` - Customer logout
- **POST** `/auth/salesperson/register` - Salesperson registration
- **POST** `/auth/salesperson/login` - Salesperson login
- **POST** `/auth/salesperson/logout` - Salesperson logout
- **POST** `/auth/manager/register` - Manager registration
- **POST** `/auth/manager/login` - Manager login
- **POST** `/auth/manager/logout` - Manager logout

### Customer Endpoints
- **GET** `/customer/dashboard` - Dashboard metrics
- **GET** `/customer/profile` - Get profile
- **POST** `/customer/requests` - Create sales request
- **GET** `/customer/requests` - List all requests
- **GET** `/customer/requests/{request_id}` - Get request details
- **GET** `/customer/quotations` - List quotations
- **GET** `/customer/quotations/{quotation_id}` - Get quotation details
- **POST** `/customer/quotations/{quotation_id}/discount-request` - Request discount
- **POST** `/customer/quotations/{quotation_id}/accept` - Accept quotation

### Salesperson Endpoints
- **GET** `/salesperson/dashboard` - Dashboard metrics
- **GET** `/salesperson/requests` - List assigned requests
- **GET** `/salesperson/requests/{request_id}` - Get request details
- **PATCH** `/salesperson/requests/{request_id}/status` - Update request status
- **POST** `/salesperson/requests/{request_id}/quotation` - Create quotation
- **GET** `/salesperson/quotations` - List quotations
- **GET** `/salesperson/quotations/{quotation_id}` - Get quotation details
- **POST** `/salesperson/quotations/{quotation_id}/send` - Send quotation
- **PATCH** `/salesperson/quotations/{quotation_id}` - Update quotation
- **GET** `/salesperson/discount-requests` - List discount requests
- **POST** `/salesperson/discount-requests/{id}/approve` - Approve discount
- **POST** `/salesperson/discount-requests/{id}/reject` - Reject discount
- **POST** `/salesperson/discount-requests/{id}/counter-offer` - Counter-offer

### Manager Endpoints
- **GET** `/manager/dashboard` - Dashboard metrics
- **GET** `/manager/discount-requests` - List discount requests
- **GET** `/manager/discount-requests/{id}` - Get discount request details
- **POST** `/manager/discount-requests/{id}/approve` - Approve discount
- **POST** `/manager/discount-requests/{id}/reject` - Reject discount
- **POST** `/manager/discount-requests/{id}/counter-offer` - Counter-offer

## API Documentation

Access interactive Swagger documentation at:
```
http://localhost:5000/docs
```

## Database Schema

The backend automatically creates the following tables:

- **users** - User accounts (Customer, Salesperson, Manager)
- **customers** - Customer details
- **salespersons** - Salesperson details
- **sales_managers** - Manager details
- **sales_requests** - Customer sales requests
- **quotations** - Quotations
- **quotation_line_items** - Line items in quotations
- **discount_requests** - Discount request workflows

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. User registers/logs in via `/auth/{role}/login`
2. Backend returns JWT token
3. Frontend stores token in localStorage
4. All subsequent requests include token in Authorization header: `Bearer {token}`
5. Backend verifies token via dependency injection

## Error Handling

Standard HTTP status codes:
- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **500** - Internal Server Error

Error responses include error message:
```json
{
  "error": "Error message here"
}
```

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Role-based access control (RBAC)
- Request validation with Pydantic
- CORS middleware for frontend access
- Ownership validation (customers can only access their own data)

## Development

### Add New Endpoint

1. Create schema in `app/schemas/`
2. Create router in `app/routers/`
3. Include router in `app/main.py`

### Database Queries

Use SQLAlchemy ORM:
```python
from app.core.database import get_db
from app.models.customer import Customer

def get_customer(customer_id: str, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    return customer
```

### Authentication

Use dependency:
```python
from app.dependencies.auth import get_current_customer

def my_endpoint(current: dict = Depends(get_current_customer)):
    customer_id = current["customer_id"]
    ...
```

## Performance Notes

- Connection pooling enabled (pool_size=10)
- Database indexes on foreign keys
- Decimal type for financial calculations
- Lazy-loaded relationships to avoid N+1 queries

## Testing

Run with test data:
```bash
# Create test users
# Use frontend to register and test flows
```

## Troubleshooting

### Database Connection Error
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database `dealflow360` exists

### Import Errors
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt`

### Port Already in Use
- Change port in startup command: `--port 5001`

## Deployment

For production:

1. Set `DEBUG=false` in `.env`
2. Update `JWT_SECRET` to a strong value
3. Use production database
4. Use ASGI server like Gunicorn:
   ```bash
   gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
   ```

## Frontend Integration

Frontend should:

1. Make requests to `http://localhost:5000`
2. Include Authorization header for protected routes
3. Handle 401 responses by redirecting to login
4. Store tokens in localStorage

## Support

For issues or questions, check:
- API documentation at `/docs`
- Model definitions in `app/models/`
- Router implementations in `app/routers/`
