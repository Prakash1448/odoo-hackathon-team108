import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;

export async function getDatabase() {
  if (!pool) {
    // First connect without database to create it
    const initialConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root'
    });

    // Create database if it doesn't exist
    await initialConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'dealflow360'}\``);
    await initialConnection.end();

    // Now create pool with database
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
    // Unified Users table (for role-based access)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        user_role ENUM('CUSTOMER', 'SALESPERSON', 'SALES_MANAGER', 'ADMIN') NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (user_role)
      )
    `);

    // Customers table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX idx_user (user_id)
      )
    `);

    // Salespersons table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS salespersons (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        max_discount_percent DECIMAL(5, 2) DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX idx_user (user_id)
      )
    `);

    // Sales Managers table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sales_managers (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX idx_user (user_id)
      )
    `);

    // Sales Requests table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sales_requests (
        id VARCHAR(50) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        salesperson_id VARCHAR(36),
        request_title VARCHAR(255) NOT NULL,
        product_requirement VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        specifications LONGTEXT,
        additional_notes LONGTEXT,
        expected_delivery_date VARCHAR(50),
        status VARCHAR(50) DEFAULT 'SUBMITTED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (salesperson_id) REFERENCES salespersons(id),
        INDEX idx_customer (customer_id),
        INDEX idx_salesperson (salesperson_id),
        INDEX idx_status (status)
      )
    `);

    // Quotations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quotations (
        id VARCHAR(36) PRIMARY KEY,
        request_id VARCHAR(50) NOT NULL,
        customer_id VARCHAR(36) NOT NULL,
        salesperson_id VARCHAR(36) NOT NULL,
        quotation_status VARCHAR(50) DEFAULT 'DRAFT',
        quotation_number VARCHAR(50) UNIQUE,
        total_amount DECIMAL(15, 2),
        discount_percent DECIMAL(5, 2) DEFAULT 0,
        final_discount_percent DECIMAL(5, 2),
        tax_amount DECIMAL(15, 2),
        notes LONGTEXT,
        valid_until VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES sales_requests(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (salesperson_id) REFERENCES salespersons(id),
        INDEX idx_request (request_id),
        INDEX idx_customer (customer_id),
        INDEX idx_salesperson (salesperson_id),
        INDEX idx_status (quotation_status)
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
        salesperson_id VARCHAR(36) NOT NULL,
        requested_discount_percent DECIMAL(5, 2) NOT NULL,
        current_discount_percent DECIMAL(5, 2),
        reason LONGTEXT NOT NULL,
        customer_message LONGTEXT,
        status VARCHAR(50) DEFAULT 'PENDING_SALESPERSON_REVIEW',
        requires_manager_approval BOOLEAN DEFAULT FALSE,
        manager_id VARCHAR(36),
        manager_approval_status VARCHAR(50),
        manager_response LONGTEXT,
        salesperson_response LONGTEXT,
        counter_offer_discount_percent DECIMAL(5, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (salesperson_id) REFERENCES salespersons(id),
        FOREIGN KEY (manager_id) REFERENCES sales_managers(id),
        INDEX idx_quotation (quotation_id),
        INDEX idx_customer (customer_id),
        INDEX idx_salesperson (salesperson_id),
        INDEX idx_status (status),
        INDEX idx_manager_approval (requires_manager_approval)
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

    // Audit Logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        user_role VARCHAR(50) NOT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id VARCHAR(36),
        details LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX idx_user (user_id),
        INDEX idx_action (action),
        INDEX idx_created (created_at)
      )
    `);

    // Discount Limits Configuration table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS discount_limits (
        id VARCHAR(36) PRIMARY KEY,
        role VARCHAR(50) NOT NULL UNIQUE,
        max_discount_percent DECIMAL(5, 2) NOT NULL,
        requires_approval_above_percent DECIMAL(5, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
