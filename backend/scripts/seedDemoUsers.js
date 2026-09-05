import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { get, run, initializeDatabase } from '../database.js';
import { hashPassword } from '../auth.js';

dotenv.config();

const demoPassword = process.env.DEMO_PASSWORD;

if (!demoPassword) {
  throw new Error('DEMO_PASSWORD must be set in the environment');
}

const demoUsers = [
  {
    email: 'customer@dealflow360.com',
    role: 'CUSTOMER',
    name: 'Demo Customer',
    company: 'DealFlow360 Demo',
    phone: '9999999999'
  },
  {
    email: 'sales@dealflow360.com',
    role: 'SALESPERSON',
    name: 'Demo Salesperson'
  },
  {
    email: 'manager@dealflow360.com',
    role: 'SALES_MANAGER',
    name: 'Demo Sales Manager'
  },
  {
    email: 'admin@dealflow360.com',
    role: 'ADMIN',
    name: 'Demo Admin'
  }
];

await initializeDatabase();
const passwordHash = await hashPassword(demoPassword);

for (const demoUser of demoUsers) {
  const existingUser = await get('SELECT id FROM users WHERE email = ?', [demoUser.email]);
  if (existingUser) {
    console.log(`Skipped existing demo user: ${demoUser.email}`);
    continue;
  }

  const userId = uuidv4();
  await run(
    'INSERT INTO users (id, user_role, email, password_hash) VALUES (?, ?, ?, ?)',
    [userId, demoUser.role, demoUser.email, passwordHash]
  );

  if (demoUser.role === 'CUSTOMER') {
    await run(
      `INSERT INTO customers
       (id, user_id, full_name, company_name, email, phone_number, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), userId, demoUser.name, demoUser.company, demoUser.email, demoUser.phone, passwordHash]
    );
  }

  if (demoUser.role === 'SALESPERSON') {
    await run(
      `INSERT INTO salespersons
       (id, user_id, full_name, email, password_hash, max_discount_percent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), userId, demoUser.name, demoUser.email, passwordHash, 10]
    );
  }

  if (demoUser.role === 'SALES_MANAGER') {
    await run(
      `INSERT INTO sales_managers
       (id, user_id, full_name, email, password_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), userId, demoUser.name, demoUser.email, passwordHash]
    );
  }

  console.log(`Created demo user: ${demoUser.email}`);
}

console.log('Demo user seeding complete');
process.exit(0);
