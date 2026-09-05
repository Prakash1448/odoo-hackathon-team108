import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  validateEmail, 
  validatePassword 
} from '../auth.js';
import { run, get } from '../database.js';

const router = express.Router();

// POST /auth/manager/register
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
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
      [userId, 'SALES_MANAGER', email, passwordHash]
    );

    // Create manager record
    const managerId = uuidv4();
    await run(
      `INSERT INTO sales_managers (id, user_id, full_name, email, password_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [managerId, userId, fullName, email, passwordHash]
    );

    // Generate token
    const token = generateToken(userId, 'SALES_MANAGER', managerId);

    res.status(201).json({
      message: 'Manager registration successful',
      token,
      access_token: token,
      token_type: 'bearer',
      user: {
        id: managerId,
        name: fullName,
        email,
        role: 'SALES_MANAGER'
      },
      manager: {
        id: managerId,
        fullName,
        email
      }
    });
  } catch (error) {
    console.error('Manager registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /auth/manager/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check user table for SALES_MANAGER role
    const user = await get('SELECT * FROM users WHERE email = ? AND user_role = ?', [email, 'SALES_MANAGER']);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get manager details
    const manager = await get('SELECT id, full_name, email FROM sales_managers WHERE user_id = ?', [user.id]);

    if (!manager) {
      return res.status(401).json({ error: 'Manager profile not found' });
    }

    const token = generateToken(user.id, 'SALES_MANAGER', manager.id);

    res.json({
      message: 'Login successful',
      token,
      access_token: token,
      token_type: 'bearer',
      user: {
        id: manager.id,
        name: manager.full_name,
        email: manager.email,
        role: 'SALES_MANAGER'
      },
      manager: {
        id: manager.id,
        fullName: manager.full_name,
        email: manager.email
      }
    });
  } catch (error) {
    console.error('Manager login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
