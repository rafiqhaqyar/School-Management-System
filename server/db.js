require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'school-management-system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true
});

const db = {
  pool,

  async all(sql, params = []) {
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async get(sql, params = []) {
    const [rows] = await pool.query(sql, params);
    return rows[0] || null;
  },

  async run(sql, params = []) {
    const [result] = await pool.query(sql, params);
    return {
      lastInsertRowid: result.insertId,
      changes: result.affectedRows,
      insertId: result.insertId,
      affectedRows: result.affectedRows
    };
  },

  async execute(sql, params = []) {
    return this.run(sql, params);
  }
};

module.exports = db;
