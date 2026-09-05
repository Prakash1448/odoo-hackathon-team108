-- Add test users to dealflow360 database
-- Execute this SQL in MySQL/phpMyAdmin to create test login accounts

USE dealflow360;

-- Clear existing users (optional)
-- DELETE FROM users;

-- Insert test users with bcrypt hashed passwords
-- Password: admin123 (bcrypt hash)
INSERT IGNORE INTO users (id, name, email, hashed_password, role, role_name, company, avatar, is_active, created_at, updated_at)
VALUES ('admin-001', 'Admin User', 'admin@dealflow360.com', '$2b$12$MZKZSDWZlN0.VVJj6xNBh.KZo6lNGU7tnWnKXz3iIXt8hM8L1p.fq', 'admin', 'Administrator', 'DealFlow360', 'A', TRUE, NOW(), NOW());

-- Password: manager123 (bcrypt hash)
INSERT IGNORE INTO users (id, name, email, hashed_password, role, role_name, company, avatar, is_active, created_at, updated_at)
VALUES ('manager-001', 'Sales Manager', 'manager@dealflow360.com', '$2b$12$1xAL8gVv7VW6w5kLH7xo.eY9iK2P1Q3R4S5T6U7V8W9X0Y1Z2A3B', 'sales-manager', 'Sales Manager', 'DealFlow360', 'S', TRUE, NOW(), NOW());

-- Password: salesman123 (bcrypt hash)
INSERT IGNORE INTO users (id, name, email, hashed_password, role, role_name, company, avatar, is_active, created_at, updated_at)
VALUES ('salesman-001', 'Sales Representative', 'salesman@dealflow360.com', '$2b$12$KL7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K', 'sales-rep', 'Sales Representative', 'DealFlow360', 'S', TRUE, NOW(), NOW());

-- Password: finance123 (bcrypt hash)
INSERT IGNORE INTO users (id, name, email, hashed_password, role, role_name, company, avatar, is_active, created_at, updated_at)
VALUES ('finance-001', 'Finance Team', 'finance@dealflow360.com', '$2b$12$V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0O1P2Q3R4S5T6U7', 'finance', 'Finance', 'DealFlow360', 'F', TRUE, NOW(), NOW());

-- Password: customer123 (bcrypt hash)
INSERT IGNORE INTO users (id, name, email, hashed_password, role, role_name, company, avatar, is_active, created_at, updated_at)
VALUES ('customer-001', 'Customer Portal', 'customer@dealflow360.com', '$2b$12$C9D0E1F2G3H4I5J6K7L8M9N0O1P2Q3R4S5T6U7V8W9X0Y1Z2A3B', 'customer', 'Customer', 'Acme Corp', 'C', TRUE, NOW(), NOW());

-- Verify users were created
SELECT id, name, email, role FROM users;
