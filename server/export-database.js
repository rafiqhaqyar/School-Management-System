const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function exportFullDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school-management-system'
  });

  console.log('Connected to MySQL. Generating complete standalone database dump...');

  let sql = `-- ========================================================\n`;
  sql += `-- School Management System (SMS) - Self-Contained Database\n`;
  sql += `-- Auto-Installer & Attached Standalone Schema\n`;
  sql += `-- Currency: PKR (Pakistani Rupee)\n`;
  sql += `-- Developer: Rafiq Haqyar (Contact: 923229594616, Email: rafiqhaqyar524@gmail.com)\n`;
  sql += `-- Target: MySQL 5.7+ / MariaDB / phpMyAdmin / XAMPP / WampServer\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += `-- ========================================================\n\n`;

  sql += `CREATE DATABASE IF NOT EXISTS \`school-management-system\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
  sql += `USE \`school-management-system\`;\n\n`;
  sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

  const [tables] = await connection.query('SHOW TABLES');
  const tableNames = tables.map(t => Object.values(t)[0]);

  for (const table of tableNames) {
    console.log(`Exporting table: ${table}...`);
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- Table structure for \`${table}\`\n`;
    sql += `-- --------------------------------------------------------\n`;
    sql += `DROP TABLE IF EXISTS \`${table}\`;\n`;

    const [[createRes]] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
    sql += `${createRes['Create Table']};\n\n`;

    const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
    if (rows.length > 0) {
      sql += `-- Dumping seed data for table \`${table}\` (${rows.length} rows)\n`;
      const cols = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
      sql += `INSERT INTO \`${table}\` (${cols}) VALUES\n`;

      const valueRows = rows.map(r => {
        const vals = Object.values(r).map(val => {
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number') return val;
          if (typeof val === 'boolean') return val ? 1 : 0;
          if (val instanceof Date) {
            // Check if date or datetime
            const iso = val.toISOString();
            return `'${iso.slice(0, 19).replace('T', ' ')}'`;
          }
          const str = String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
          return `'${str}'`;
        });
        return `(${vals.join(', ')})`;
      });

      sql += valueRows.join(',\n') + ';\n\n';
    }
  }

  sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;

  const targetPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const backupPath = path.join(__dirname, '..', 'database', 'database-backup.sql');

  fs.writeFileSync(targetPath, sql, 'utf8');
  fs.writeFileSync(backupPath, sql, 'utf8');

  console.log(`✅ Standalone database exported successfully to:`);
  console.log(`   - ${targetPath}`);
  console.log(`   - ${backupPath}`);

  await connection.end();
  process.exit(0);
}

exportFullDatabase().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
