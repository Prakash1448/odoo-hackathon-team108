"""
Seed script to create test users in the dealflow360 database
"""
import os
import sys
from datetime import datetime
from passlib.context import CryptContext

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import engine, Base, SessionLocal
from app.models.user import User

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def seed_users():
    """Create test users in the database"""
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if users already exist
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"✓ Database already has {existing_users} users. Skipping seed.")
            return
        
        # Test users to seed
        test_users = [
            {
                "id": "user-admin-001",
                "name": "Admin User",
                "email": "admin@dealflow360.com",
                "password": "admin123",
                "role": "admin",
                "role_name": "Administrator",
                "company": "DealFlow360"
            },
            {
                "id": "user-sales-manager-001",
                "name": "Sales Manager",
                "email": "manager@dealflow360.com",
                "password": "manager123",
                "role": "sales-manager",
                "role_name": "Sales Manager",
                "company": "DealFlow360"
            },
            {
                "id": "user-sales-rep-001",
                "name": "Sales Rep",
                "email": "salesman@dealflow360.com",
                "password": "salesman123",
                "role": "sales-rep",
                "role_name": "Sales Representative",
                "company": "DealFlow360"
            },
            {
                "id": "user-finance-001",
                "name": "Finance Team",
                "email": "finance@dealflow360.com",
                "password": "finance123",
                "role": "finance",
                "role_name": "Finance",
                "company": "DealFlow360"
            },
            {
                "id": "user-customer-001",
                "name": "Customer Portal",
                "email": "customer@dealflow360.com",
                "password": "customer123",
                "role": "customer",
                "role_name": "Customer",
                "company": "Acme Corp"
            }
        ]
        
        # Create users
        for user_data in test_users:
            user = User(
                id=user_data["id"],
                name=user_data["name"],
                email=user_data["email"],
                hashed_password=hash_password(user_data["password"]),
                role=user_data["role"],
                role_name=user_data["role_name"],
                company=user_data["company"],
                avatar=user_data["name"][0],  # First letter of name
                is_active=True
            )
            db.add(user)
            print(f"✓ Created user: {user_data['email']}")
        
        db.commit()
        print("\n" + "="*60)
        print("✓ Test users created successfully!")
        print("="*60)
        print("\nTest Credentials:")
        print("-" * 60)
        for user in test_users:
            print(f"Email: {user['email']:<35} Password: {user['password']}")
        print("-" * 60)
        
    except Exception as e:
        db.rollback()
        print(f"✗ Error creating users: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
