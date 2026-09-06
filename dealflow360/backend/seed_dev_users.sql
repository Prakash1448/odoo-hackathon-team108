-- Seed development users with correct IDs to match DEV_ACCOUNTS in auth.py
-- This ensures the token "sub" claims match database user IDs

USE dealflow360;

-- Delete existing dev users (optional)
DELETE FROM users WHERE id LIKE 'dev-%';

-- Create users with IDs matching DEV_ACCOUNTS in auth.py
-- Passwords: We use dummy hashed passwords here since auth.py checks them via DEV_ACCOUNTS

INSERT INTO users 
(id, name, email, hashed_password, role, role_name, company, avatar, is_active, created_at, updated_at)
VALUES 
('dev-admin-001', 'Admin User', 'admin@dealflow360.com', '$2b$12$N9qo8uLOickgx2ZF.G7nm5J7yfF3.efxu3yGaSo8c8ztmMgGkjGkG', 'admin', 'Administrator', 'DealFlow360', 'A', TRUE, NOW(), NOW()),
('dev-manager-001', 'Sales Manager', 'manager@dealflow360.com', '$2b$12$N9qo8uLOickgx2ZF.G7nm5J7yfF3.efxu3yGaSo8c8ztmMgGkjGkG', 'sales-manager', 'Sales Manager', 'DealFlow360', 'M', TRUE, NOW(), NOW()),
('dev-salesman-001', 'Sales Representative', 'salesman@dealflow360.com', '$2b$12$N9qo8uLOickgx2ZF.G7nm5J7yfF3.efxu3yGaSo8c8ztmMgGkjGkG', 'sales-rep', 'Sales Representative', 'DealFlow360', 'S', TRUE, NOW(), NOW()),
('dev-finance-001', 'Finance Team', 'finance@dealflow360.com', '$2b$12$N9qo8uLOickgx2ZF.G7nm5J7yfF3.efxu3yGaSo8c8ztmMgGkjGkG', 'finance', 'Finance', 'DealFlow360', 'F', TRUE, NOW(), NOW()),
('dev-customer-001', 'Customer Portal', 'customer@dealflow360.com', '$2b$12$N9qo8uLOickgx2ZF.G7nm5J7yfF3.efxu3yGaSo8c8ztmMgGkjGkG', 'customer', 'Customer', 'Acme Corp', 'C', TRUE, NOW(), NOW());

-- Verify
SELECT id, name, email, role, is_active FROM users WHERE id LIKE 'dev-%' ORDER BY role;

COMMIT;

print "Development users seeded successfully!";
print "Login with:";
print "  admin@dealflow360.com / admin123";
print "  manager@dealflow360.com / manager123";
print "  salesman@dealflow360.com / salesman123";
print "  finance@dealflow360.com / finance123";
print "  customer@dealflow360.com / customer123";
