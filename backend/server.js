import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { getDatabase, initializeDatabase } from './database.js';
import authRoutes from './routes/auth.js';
import salespersonAuthRoutes from './routes/salesperson-auth.js';
import managerAuthRoutes from './routes/manager-auth.js';
import managerRoutes from './routes/manager.js';
import customerRoutes from './routes/customer.js';
import quotationRoutes from './routes/quotation.js';
import salespersonRoutes from './routes/salesperson.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/auth/salesperson', salespersonAuthRoutes);
app.use('/auth/manager', managerAuthRoutes);
app.use('/customer', customerRoutes);
app.use('/quotations', quotationRoutes);
app.use('/salesperson', salespersonRoutes);
app.use('/manager', managerRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    const database = await getDatabase();
    await database.query('SELECT 1');
    res.json({
      status: 'OK',
      api: 'running',
      mysql: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check database error:', error);
    res.status(503).json({ status: 'ERROR', api: 'running', mysql: 'disconnected' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Customer Module Server running on http://localhost:${PORT}`);
    console.log(`Client URL: ${CLIENT_URL}`);
  });
}).catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});
