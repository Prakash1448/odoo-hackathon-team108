import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('Testing MySQL connection...');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Port: ${process.env.DB_PORT}`);
  console.log(`User: ${process.env.DB_USER}`);
  console.log(`Database: ${process.env.DB_NAME}`);

  try {
    // First, connect without specifying a database to create it
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root'
    });

    console.log('✓ Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    console.log(`✓ Database ${process.env.DB_NAME} ready`);

    // Now connect to the specific database
    await connection.execute(`USE \`${process.env.DB_NAME}\``);
    console.log(`✓ Using database ${process.env.DB_NAME}`);

    // Test query
    const [result] = await connection.execute('SELECT 1 as test');
    console.log('✓ Query successful:', result);

    await connection.end();
    console.log('✓ Connection closed');
    console.log('\n✅ All tests passed! MySQL is ready.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    console.error('Code:', error.code);
    process.exit(1);
  }
}

testConnection();
