import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing Backend Connection...\n');

console.log('Configuration:');
console.log('  DB Host:', process.env.DB_HOST || 'localhost');
console.log('  DB Port:', process.env.DB_PORT || 3306);
console.log('  DB User:', process.env.DB_USER || 'root');
console.log('  DB Name:', process.env.DB_NAME || 'dealflow360');
console.log('  API Port:', process.env.PORT || 5000);
console.log('\n');

async function testConnection() {
  try {
    console.log('1️⃣  Testing MySQL connection...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root'
    });
    console.log('✅ Connected to MySQL!\n');

    console.log('2️⃣  Creating database if not exists...');
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'dealflow360'}\``);
    console.log('✅ Database ready!\n');

    console.log('3️⃣  Selecting database...');
    await connection.execute(`USE \`${process.env.DB_NAME || 'dealflow360'}\``);
    console.log('✅ Database selected!\n');

    console.log('4️⃣  Testing users table...');
    const [tables] = await connection.execute(`SHOW TABLES LIKE 'users'`);
    if (tables.length > 0) {
      console.log('✅ Users table exists!\n');
    } else {
      console.log('⚠️  Users table does not exist yet\n');
    }

    console.log('5️⃣  Closing connection...');
    await connection.end();
    console.log('✅ Connection closed!\n');

    console.log('✅ All tests passed! Backend should work.\n');
    console.log('📝 Next steps:');
    console.log('  1. Start backend: npm run server');
    console.log('  2. Start frontend: cd frontend && npm run dev');
    console.log('  3. Open http://localhost:5173');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\n🔧 Possible solutions:');
    console.error('  1. Make sure MySQL is running');
    console.error('  2. Check database credentials in .env');
    console.error('  3. Verify DB_PASSWORD is correct');
    console.error('  4. Try: mysql -u root -p (to verify password)');
    process.exit(1);
  }
}

testConnection();
