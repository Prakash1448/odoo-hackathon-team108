"""
Simple script to create test users directly in MySQL
Run this after installing dependencies
"""
import mysql.connector
from passlib.context import CryptContext
import uuid

# MySQL connection details
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Jayam@321',
    'database': 'dealflow360',
    'port': 3306
}

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_users():
    try:
        # Connect to MySQL
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Check if table exists and has users
        cursor.execute("SELECT COUNT(*) FROM users")
        count = cursor.fetchone()[0]
        
        if count > 0:
            print(f"✓ Database already has {count} users. Skipping creation.")
            cursor.close()
            conn.close()
            return
        
        # Test users
        test_users = [
            ("admin@dealflow360.com", "Admin User", "admin123", "admin", "Administrator"),
            ("manager@dealflow360.com", "Sales Manager", "manager123", "sales-manager", "Sales Manager"),
            ("salesman@dealflow360.com", "Sales Rep", "salesman123", "sales-rep", "Sales Representative"),
            ("finance@dealflow360.com", "Finance Team", "finance123", "finance", "Finance"),
            ("customer@dealflow360.com", "Customer Portal", "customer123", "customer", "Customer"),
        ]
        
        print("\n" + "="*70)
        print("Creating Test Users for DealFlow360")
        print("="*70)
        
        for email, name, password, role, role_name in test_users:
            user_id = f"user-{role}-{uuid.uuid4().hex[:8]}"
            hashed_pwd = hash_password(password)
            
            sql = """
            INSERT INTO users 
            (id, name, email, hashed_password, role, role_name, company, avatar, is_active, created_at, updated_at)
            VALUES 
            (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """
            
            values = (user_id, name, email, hashed_pwd, role, role_name, "DealFlow360", name[0], True)
            cursor.execute(sql, values)
            print(f"✓ Created: {email} (Role: {role})")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("\n" + "="*70)
        print("✓ Test Users Created Successfully!")
        print("="*70)
        print("\nLogin Credentials:")
        print("-"*70)
        print(f"{'Email':<35} {'Password':<20} {'Role'}")
        print("-"*70)
        
        for email, _, password, role, _ in test_users:
            print(f"{email:<35} {password:<20} {role}")
        
        print("-"*70)
        print("\nUse any of these credentials to login at http://localhost:5173")
        print("="*70 + "\n")
        
    except mysql.connector.Error as err:
        print(f"✗ Database Error: {err}")
        if err.errno == 2003:
            print("\n⚠ Could not connect to MySQL!")
            print("Make sure MySQL is running (XAMPP/MySQL Server)")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = create_users()
    if not success:
        print("\n⚠ Failed to create users. Please check the error above.")
