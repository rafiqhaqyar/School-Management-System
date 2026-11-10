const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };

  console.log(`Connecting to MySQL at ${config.host} as ${config.user}...`);
  const connection = await mysql.createConnection(config);

  try {
    const dbName = process.env.DB_NAME || 'school-management-system';
    console.log(`Ensuring database \`${dbName}\` exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.changeUser({ database: dbName });

    const sqlPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log(`Executing schema.sql in \`${dbName}\`...`);
    await connection.query(sql);

    console.log('Running data synchronization & seed script...');
    await connection.end();

    // Run upgrade-db to populate default seed data
    require('./upgrade-db');

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
