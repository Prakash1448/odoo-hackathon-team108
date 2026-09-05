-- Direct SQL to insert test user (avoid password hashing issues)
USE dealflow360;

-- Delete if exists
DELETE FROM users WHERE email = 'admin@dealflow360.com';

-- Insert with simple bcrypt hash for "admin123"
-- Note: This is a pre-computed hash
INSERT INTO users (id, name, email, hashed_password, role, role_name, company, avatar, is_active, created_at, updated_at)
VALUES (
    'admin-001',
    'Admin User', 
    'admin@dealflow360.com',
    '$2b$12$MZKZSDWZlN0.VVJj6xNBh.KZo6lNGU7tnWnKXz3iIXt8hM8L1p.fq',
    'admin',
    'Administrator',
    'DealFlow360',
    'A',
    1,
    NOW(),
    NOW()
);

-- Verify
SELECT id, name, email, role, is_active FROM users WHERE email = 'admin@dealflow360.com';
