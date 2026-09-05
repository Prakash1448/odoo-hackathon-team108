#!/usr/bin/env python3
"""
Setup database and create test users
Run this before starting the backend
"""
import os
import sys
import subprocess

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def install_dependencies():
    """Install required packages"""
    print("\n" + "="*70)
    print("Installing Dependencies...")
    print("="*70)
    
    packages = [
        'mysql-connector-python',
        'fastapi',
        'uvicorn',
        'sqlalchemy',
        'pymysql',
        'pydantic',
        'pydantic-settings',
        'python-dotenv',
        'passlib',
        'bcrypt',
        'python-jose',
        'cryptography',
        'email-validator'
    ]
    
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + packages)
        print("\n✓ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n✗ Failed to install dependencies: {e}")
        return False

def create_test_users():
    """Create test users in the database"""
    try:
        import mysql.connector
        from passlib.context import CryptContext
        
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        db_config = {
            'host': 'localhost',
            'user': 'root',
            'password': 'Jayam@321',
            'database': 'dealflow360',
            'port': 3306
        }
        
        print("\n" + "="*70)
        print("Connecting to Database...")
        print("="*70)
        
        # Connect to MySQL
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Check if users exist
        cursor.execute("SELECT COUNT(*) FROM users")
        count = cursor.fetchone()[0]
        
        if count > 0:
            print(f"\n✓ Database already has {count} users!")
            cursor.close()
            conn.close()
            return True
        
        print("\n" + "="*70)
        print("Creating Test Users...")
        print("="*70)
        
        # Test users
        test_users = [
            ("admin-001", "Admin User", "admin@dealflow360.com", "admin123", "admin", "Administrator"),
            ("manager-001", "Sales Manager", "manager@dealflow360.com", "manager123", "sales-manager", "Sales Manager"),
            ("salesman-001", "Sales Rep", "salesman@dealflow360.com", "salesman123", "sales-rep", "Sales Representative"),
            ("finance-001", "Finance Team", "finance@dealflow360.com", "finance123", "finance", "Finance"),
            ("customer-001", "Customer Portal", "customer@dealflow360.com", "customer123", "customer", "Customer"),
        ]
        
        for user_id, name, email, password, role, role_name in test_users:
            hashed_pwd = pwd_context.hash(password)
            
            sql = """
            INSERT INTO users 
            (id, name, email, hashed_password, role, role_name, company, avatar, is_active, created_at, updated_at)
            VALUES 
            (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """
            
            values = (user_id, name, email, hashed_pwd, role, role_name, "DealFlow360", name[0], True)
            cursor.execute(sql, values)
            print(f"✓ Created: {email}")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("\n" + "="*70)
        print("✓ Test Users Created Successfully!")
        print("="*70)
        
        return True
        
    except ImportError as e:
        print(f"\n✗ Required module not found: {e}")
        print("Install mysql-connector-python: pip install mysql-connector-python")
        return False
    except Exception as e:
        print(f"\n✗ Error: {e}")
        if "2003" in str(e):
            print("\n⚠ Could not connect to MySQL!")
            print("Make sure MySQL is running (XAMPP/MySQL Server)")
        return False

if __name__ == "__main__":
    print("\n")
    print("╔" + "="*68 + "╗")
    print("║" + " "*15 + "DealFlow360 Database Setup" + " "*27 + "║")
    print("╚" + "="*68 + "╝")
    
    # Install dependencies
    if not install_dependencies():
        sys.exit(1)
    
    # Create test users
    if not create_test_users():
        sys.exit(1)
    
    print("\n" + "="*70)
    print("✓ Setup Complete! You can now start the backend.")
    print("="*70)
    print("\nLogin Credentials:")
    print("-"*70)
    print("Email: admin@dealflow360.com")
    print("Password: admin123")
    print("-"*70)
    print("\nStart backend with:")
    print("python -m uvicorn app.main:app --reload --port 8001")
    print("="*70 + "\n")
