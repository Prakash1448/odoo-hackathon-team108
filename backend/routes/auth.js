import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  validateEmail, 
  validatePassword, 
  validatePhone 
} from '../auth.js';
import { run, get } from '../database.js';

const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { fullName, companyName, email, phoneNumber, password, confirmPassword } = req.body;

    // Validation
    if (!fullName || !companyName || !email || !phoneNumber || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters with uppercase, lowercase, and number' });
    }

    if (!validatePhone(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    // Check if email already exists in users table
    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user record
    const userId = uuidv4();
    await run(
      `INSERT INTO users (id, user_role, email, password_hash)
       VALUES (?, ?, ?, ?)`,
      [userId, 'CUSTOMER', email, passwordHash]
    );

    // Create customer
    const customerId = uuidv4();
    await run(
      `INSERT INTO customers (id, user_id, full_name, company_name, email, phone_number, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customerId, userId, fullName, companyName, email, phoneNumber, passwordHash]
    );

    // Generate unified token
    const token = generateToken(userId, 'CUSTOMER', customerId);

    res.status(201).json({
      message: 'Registration successful',
      token,
      access_token: token,
      token_type: 'bearer',
      user: {
        id: userId,
        name: fullName,
        email,
        role: 'CUSTOMER'
      },
      customer: {
        id: customerId,
        fullName,
        companyName,
        email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check user table for CUSTOMER role
    const user = await get('SELECT * FROM users WHERE email = ? AND user_role = ?', [email, 'CUSTOMER']);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get customer details
    const customer = await get('SELECT id, full_name, company_name, email FROM customers WHERE user_id = ?', [user.id]);

    if (!customer) {
      return res.status(401).json({ error: 'Customer profile not found' });
    }

    const token = generateToken(user.id, 'CUSTOMER', customer.id);

    res.json({
      message: 'Login successful',
      token,
      access_token: token,
      token_type: 'bearer',
      user: {
        id: customer.id,
        name: customer.full_name,
        email: customer.email,
        role: 'CUSTOMER'
      },
      customer: {
        id: customer.id,
        fullName: customer.full_name,
        companyName: customer.company_name,
        email: customer.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /auth/logout (frontend-initiated, backend validates token)
router.post('/logout', (req, res) => {
  // Token is invalidated on frontend; backend doesn't maintain a blacklist for simplicity
  // In production, consider implementing token blacklist
  res.json({ message: 'Logout successful' });
});

export default router;
