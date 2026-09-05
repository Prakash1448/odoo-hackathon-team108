import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;

export async function getDatabase() {
  if (!pool) {
    pool = await mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'dealflow360',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('MySQL Pool created successfully');
  }
  return pool;
}

export async function initializeDatabase() {
  const pool = await getDatabase();
  const connection = await pool.getConnection();

  try {
    // Customers table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(36) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Sales Requests table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sales_requests (
        id VARCHAR(50) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        request_title VARCHAR(255) NOT NULL,
        product_requirement VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        specifications LONGTEXT,
        additional_notes LONGTEXT,
        expected_delivery_date VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Submitted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        INDEX idx_customer (customer_id)
      )
    `);

    // Quotations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quotations (
        id VARCHAR(36) PRIMARY KEY,
        request_id VARCHAR(50) NOT NULL,
        customer_id VARCHAR(36) NOT NULL,
        quotation_status VARCHAR(50) DEFAULT 'Awaiting Customer Response',
        notes LONGTEXT,
        valid_until VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES sales_requests(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        INDEX idx_request (request_id),
        INDEX idx_customer (customer_id)
      )
    `);

    // Quotation Line Items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quotation_line_items (
        id VARCHAR(36) PRIMARY KEY,
        quotation_id VARCHAR(36) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(12, 2) NOT NULL,
        subtotal DECIMAL(12, 2) NOT NULL,
        discount_percent DECIMAL(5, 2) DEFAULT 0,
        discount_amount DECIMAL(12, 2) DEFAULT 0,
        tax_amount DECIMAL(12, 2) DEFAULT 0,
        total_amount DECIMAL(12, 2) NOT NULL,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id),
        INDEX idx_quotation (quotation_id)
      )
    `);

    // Discount Requests table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS discount_requests (
        id VARCHAR(36) PRIMARY KEY,
        quotation_id VARCHAR(36) NOT NULL,
        customer_id VARCHAR(36) NOT NULL,
        requested_discount_percent DECIMAL(5, 2) NOT NULL,
        current_discount_percent DECIMAL(5, 2),
        reason LONGTEXT NOT NULL,
        customer_message LONGTEXT,
        status VARCHAR(50) DEFAULT 'Pending Review',
        salesperson_response LONGTEXT,
        manager_approval_status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        INDEX idx_quotation (quotation_id),
        INDEX idx_customer (customer_id)
      )
    `);

    // Quotation Acceptances table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quotation_acceptances (
        id VARCHAR(36) PRIMARY KEY,
        quotation_id VARCHAR(36) NOT NULL,
        customer_id VARCHAR(36) NOT NULL,
        acceptance_status VARCHAR(50) DEFAULT 'Accepted',
        accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        INDEX idx_quotation (quotation_id),
        INDEX idx_customer (customer_id)
      )
    `);

    console.log('MySQL tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function run(sql, params = []) {
  const pool = await getDatabase();
  const connection = await pool.getConnection();

  try {
    const [result] = await connection.execute(sql, params);
    return { lastID: result.insertId, changes: result.affectedRows };
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
}

export async function get(sql, params = []) {
  const pool = await getDatabase();
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.execute(sql, params);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
}

export async function all(sql, params = []) {
  const pool = await getDatabase();
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.execute(sql, params);
    return rows || [];
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
