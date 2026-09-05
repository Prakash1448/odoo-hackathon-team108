import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { 
  hashPassword, 
  verifyPassword, 
  generateToken,
  generateSalespersonToken, 
  validateEmail, 
  validatePassword
} from '../auth.js';
import { run, get } from '../database.js';

const router = express.Router();

// POST /auth/salesperson/register
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
      [userId, 'SALESPERSON', email, passwordHash]
    );

    // Create salesperson
    const salespersonId = uuidv4();
    await run(
      `INSERT INTO salespersons (id, user_id, full_name, email, password_hash, max_discount_percent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [salespersonId, userId, fullName, email, passwordHash, 10]
    );

    // Generate unified token
    const token = generateToken(userId, 'SALESPERSON', salespersonId);

    res.status(201).json({
      message: 'Registration successful',
      token,
      salesperson: {
        id: salespersonId,
        fullName,
        email,
        role: 'SALESPERSON'
      }
    });
  } catch (error) {
    console.error('Salesperson registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /auth/salesperson/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check user table for SALESPERSON role
    const user = await get('SELECT * FROM users WHERE email = ? AND user_role = ?', [email, 'SALESPERSON']);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get salesperson details
    const salesperson = await get('SELECT id, full_name, email, max_discount_percent FROM salespersons WHERE user_id = ?', [user.id]);

    if (!salesperson) {
      return res.status(401).json({ error: 'Salesperson profile not found' });
    }

    const token = generateToken(user.id, 'SALESPERSON', salesperson.id);

    res.json({
      message: 'Login successful',
      token,
      salesperson: {
        id: salesperson.id,
        fullName: salesperson.full_name,
        email: salesperson.email,
        maxDiscountPercent: salesperson.max_discount_percent,
        role: 'SALESPERSON'
      }
    });
  } catch (error) {
    console.error('Salesperson login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /auth/salesperson/logout
router.post('/logout', (req, res) => {
  // Token is invalidated on frontend; backend doesn't maintain a blacklist for simplicity
  res.json({ message: 'Logout successful' });
});

export default router;
