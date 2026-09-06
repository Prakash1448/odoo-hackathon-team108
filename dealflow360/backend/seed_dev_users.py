#!/usr/bin/env python3
"""
Seed development test users into database.
Creates users with IDs matching those in DEV_ACCOUNTS (auth.py).

This ensures JWT tokens returned from login have user IDs that exist in the database.
"""

import mysql.connector
import sys

# MySQL connection
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Jayam@321',
    'database': 'dealflow360',
    'port': 3306
}

# Development accounts - MUST match DEV_ACCOUNTS in auth.py!
DEV_USERS = [
    {
        "id": "dev-admin-001",
        "name": "Admin User",
        "email": "admin@dealflow360.com",
        "role": "admin",
        "role_name": "Administrator",
        "company": "DealFlow360",
        "avatar": "A"
    },
    {
        "id": "dev-manager-001",
        "name": "Sales Manager",
        "email": "manager@dealflow360.com",
        "role": "sales-manager",
        "role_name": "Sales Manager",
        "company": "DealFlow360",
        "avatar": "M"
    },
    {
        "id": "dev-salesman-001",
        "name": "Sales Representative",
        "email": "salesman@dealflow360.com",
        "role": "sales-rep",
        "role_name": "Sales Representative",
        "company": "DealFlow360",
        "avatar": "S"
    },
    {
        "id": "dev-finance-001",
        "name": "Finance Team",
        "email": "finance@dealflow360.com",
        "role": "finance",
        "role_name": "Finance",
        "company": "DealFlow360",
        "avatar": "F"
    },
    {
        "id": "dev-customer-001",
        "name": "Customer Portal",
        "email": "customer@dealflow360.com",
        "role": "customer",
        "role_name": "Customer",
        "company": "Acme Corp",
        "avatar": "C"
    }
]

def seed_users():
    """Seed development users into database"""
    
    try:
        print("\n" + "="*70)
        print("Seeding Development Users")
        print("="*70)
        
        # Connect to database
        print("Connecting to MySQL database...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Delete existing dev users
        print("Removing existing dev users...")
        cursor.execute("DELETE FROM users WHERE id LIKE 'dev-%'")
        deleted = cursor.rowcount
        if deleted > 0:
            print("  Deleted %d existing dev users" % deleted)
        
        # Insert new users
        print("\nInserting new dev users...")
        sql = """
        INSERT INTO users 
        (id, name, email, hashed_password, role, role_name, company, avatar, is_active, created_at, updated_at)
        VALUES 
        (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        """
        
        # Dummy hashed password (not used - auth.py checks against DEV_ACCOUNTS)
        dummy_hash = "$2b$12$N9qo8uLOickgx2ZF.G7nm5J7yfF3.efxu3yGaSo8c8ztmMgGkjGkG"
        
        for user in DEV_USERS:
            values = (
                user["id"],
                user["name"],
                user["email"],
                dummy_hash,
                user["role"],
                user["role_name"],
                user["company"],
                user["avatar"],
                True
            )
            cursor.execute(sql, values)
            print("  Created: %s (id=%s, role=%s)" % (user["email"], user["id"], user["role"]))
        
        # Commit changes
        conn.commit()
        cursor.close()
        conn.close()
        
        print("\n" + "="*70)
        print("SUCCESS: Development users seeded!")
        print("="*70)
        print("\nYou can now login with:")
        print("-"*70)
        print("Email                          Password         Role")
        print("-"*70)
        print("admin@dealflow360.com          admin123         admin")
        print("manager@dealflow360.com        manager123       sales-manager")
        print("salesman@dealflow360.com       salesman123      sales-rep")
        print("finance@dealflow360.com        finance123       finance")
        print("customer@dealflow360.com       customer123      customer")
        print("-"*70)
        print("\nFrontend: http://localhost:5173")
        print("Backend:  http://localhost:8001")
        print("="*70 + "\n")
        
        return True
        
    except mysql.connector.Error as err:
        print("\nERROR: Database connection failed")
        print("  Error: %s" % err)
        if err.errno == 2003:
            print("\nMake sure MySQL is running:")
            print("  - Start XAMPP and enable MySQL")
            print("  - OR start MySQL Server directly")
        return False
    except Exception as err:
        print("\nERROR: %s" % err)
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = seed_users()
    sys.exit(0 if success else 1)
