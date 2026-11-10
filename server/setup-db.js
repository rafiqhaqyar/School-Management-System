/**
 * School Management System - Automated Database Setup & Installer
 * Creates database, runs schema.sql, seeds initial data, and verifies installation.
 * Developer: Rafiq Haqyar (Contact: 923229594616, Email: rafiqhaqyar524@gmail.com)
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// 1. Ensure .env exists with sensible defaults
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('Creating default .env configuration file...');
  const defaultEnv = `PORT=3000\nNODE_ENV=development\nDB_HOST=127.0.0.1\nDB_PORT=3306\nDB_USER=root\nDB_PASSWORD=\nDB_NAME=school-management-system\n`;
  fs.writeFileSync(envPath, defaultEnv, 'utf8');
}
require('dotenv').config();

const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = parseInt(process.env.DB_PORT, 10) || 3306;
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'school-management-system';

async function setupDatabase() {
  console.log('========================================================');
  console.log('  School Management System - Database Installer');
  console.log('  Developer: Rafiq Haqyar (Email: rafiqhaqyar524@gmail.com)');
  console.log('========================================================');
  console.log(`Connecting to MySQL server at ${dbHost}:${dbPort} as user "${dbUser}"...`);

  let rootConn;
  try {
    rootConn = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      multipleStatements: true
    });
  } catch (err) {
    console.error('\n❌ Could not connect to MySQL server:');
    console.error(`   ${err.message}`);
    console.error('\nPlease ensure MySQL / MariaDB / XAMPP is installed and running on your system.');
    console.error(`You can configure your MySQL credentials in the .env file (Host: ${dbHost}, Port: ${dbPort}, User: ${dbUser}).\n`);
    process.exit(1);
  }

  try {
    console.log(`Ensuring database \`${dbName}\` exists...`);
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConn.query(`USE \`${dbName}\`;`);

    // Check if tables already exist
    const [existingTables] = await rootConn.query('SHOW TABLES');
    if (existingTables.length > 0) {
      console.log(`Database \`${dbName}\` already has ${existingTables.length} tables.`);
    } else {
      console.log(`Database \`${dbName}\` is empty. Importing attached schema and seed data...`);
    }

    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const sqlContent = fs.readFileSync(schemaPath, 'utf8');
    console.log('Executing database schema and initial seed data...');
    await rootConn.query(sqlContent);

    // Verify installation
    const [finalTables] = await rootConn.query('SHOW TABLES');
    const [users] = await rootConn.query('SELECT username, role, display_name FROM users ORDER BY FIELD(role, "admin", "principal", "teacher", "student")');
    const [classes] = await rootConn.query('SELECT COUNT(*) as count FROM classes');
    const [students] = await rootConn.query('SELECT COUNT(*) as count FROM students');
    const [teachers] = await rootConn.query('SELECT COUNT(*) as count FROM teachers');

    console.log('\n========================================================');
    console.log('  ✅ DATABASE INSTALLATION COMPLETED SUCCESSFULLY!');
    console.log('========================================================');
    console.log(`  Database Name:  ${dbName}`);
    console.log(`  Total Tables:   ${finalTables.length}`);
    console.log(`  Classes Seeded: ${classes[0].count} (Prep A, Prep B to Class 8)`);
    console.log(`  Teachers:       ${teachers[0].count} (including Principal Musharaf Khan & PT Sir)`);
    console.log(`  Students:       ${students[0].count}`);
    console.log('\n  Ready-to-use Login Accounts:');
    console.log('  ------------------------------------------------------');
    console.log('  Role         Username      Password     Display Name');
    console.log('  ------------------------------------------------------');
    users.forEach(u => {
      console.log(`  ${(u.role).padEnd(12)} ${(u.username).padEnd(13)} ${(u.username + '123').padEnd(12)} ${u.display_name}`);
    });
    console.log('  ------------------------------------------------------');
    console.log('\n  You can now start the application:');
    console.log('    -> Run: npm start');
    console.log('    -> Or double-click: start.bat');
    console.log('    -> Open in browser: http://localhost:3000\n');

  } catch (err) {
    console.error('❌ Error executing database setup:', err.message);
    process.exit(1);
  } finally {
    if (rootConn) await rootConn.end();
  }
}

// Execute setup if run directly
if (require.main === module) {
  setupDatabase().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = setupDatabase;
