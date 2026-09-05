import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { get } from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dealflow360_customer_module_secret_key_change_in_production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateToken(customerId) {
  return jwt.sign({ customerId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch customer to ensure they still exist
    const customer = await get('SELECT id, full_name, company_name, email FROM customers WHERE id = ?', [decoded.customerId]);
    
    if (!customer) {
      return res.status(401).json({ error: 'Customer not found' });
    }

    req.customer = customer;
    req.customerId = decoded.customerId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // Password must be at least 8 characters with at least one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

export const validatePhone = (phone) => {
  // Basic phone validation - at least 10 digits
  const phoneRegex = /^\d{10,}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};
