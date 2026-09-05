import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'database.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
});

console.log('\n========== DATABASE VIEWER ==========\n');

// Get all tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }

  if (!tables || tables.length === 0) {
    console.log('No tables found in database');
    db.close();
    process.exit(0);
  }

  console.log('Tables:', tables.map(t => t.name).join(', '));
  console.log('\n========================================\n');

  let completed = 0;

  tables.forEach(table => {
    const tableName = table.name;
    console.log(`\n📋 TABLE: ${tableName.toUpperCase()}`);
    console.log('─'.repeat(60));

    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (err) {
        console.error(`Error fetching ${tableName}:`, err);
      } else if (!rows || rows.length === 0) {
        console.log('(No data)');
      } else {
        console.table(rows);
      }

      completed++;
      if (completed === tables.length) {
        console.log('\n========================================\n');
        db.close();
        process.exit(0);
      }
    });
  });
});
