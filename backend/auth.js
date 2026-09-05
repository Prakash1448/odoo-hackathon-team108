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

// Unified token generation supporting all roles
export function generateToken(userId, role, roleId) {
  return jwt.sign({ userId, role, roleId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

// Legacy functions - kept for backward compatibility
export function generateSalespersonToken(salespersonId) {
  return jwt.sign({ salespersonId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Unified auth middleware supporting all roles
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

    // Support both new unified tokens and legacy tokens
    if (decoded.role === 'CUSTOMER' || decoded.customerId) {
      const customerId = decoded.roleId || decoded.customerId;
      const customer = await get('SELECT id, full_name, company_name, email FROM customers WHERE id = ?', [customerId]);
      
      if (!customer) {
        return res.status(401).json({ error: 'Customer not found' });
      }

      req.customer = customer;
      req.customerId = customerId;
      req.userType = 'customer';
      req.userId = decoded.userId;
      req.userRole = 'CUSTOMER';
      next();
    } else {
      return res.status(403).json({ error: 'Invalid user role for this endpoint' });
    }
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Salesperson middleware - updated to support unified tokens
export const salespersonAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Support both new unified tokens and legacy tokens
    if (decoded.role === 'SALESPERSON' || decoded.salespersonId) {
      const salespersonId = decoded.roleId || decoded.salespersonId;
      const salesperson = await get('SELECT id, full_name, email, max_discount_percent FROM salespersons WHERE id = ?', [salespersonId]);
      
      if (!salesperson) {
        return res.status(401).json({ error: 'Salesperson not found' });
      }

      req.salesperson = salesperson;
      req.salespersonId = salespersonId;
      req.userType = 'salesperson';
      req.userId = decoded.userId;
      req.userRole = 'SALESPERSON';
      next();
    } else {
      return res.status(403).json({ error: 'Invalid user role for this endpoint' });
    }
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Sales Manager middleware
export const managerAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (decoded.role !== 'SALES_MANAGER') {
      return res.status(403).json({ error: 'Manager role required' });
    }

    const manager = await get('SELECT id, full_name, email FROM sales_managers WHERE id = ?', [decoded.roleId]);
    
    if (!manager) {
      return res.status(401).json({ error: 'Manager not found' });
    }

    req.manager = manager;
    req.managerId = decoded.roleId;
    req.userId = decoded.userId;
    req.userRole = 'SALES_MANAGER';
    req.userType = 'manager';
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
