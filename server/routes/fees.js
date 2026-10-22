const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/fees - List fees with filter by status
router.get('/', async (req, res) => {
  try {
    const { status, student_id } = req.query;
    let query = `
      SELECT f.*, s.first_name, s.last_name, s.admission_no, c.name as class_name, c.section as class_section
      FROM fees f
      JOIN students s ON f.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND f.status = ?`;
      params.push(status);
    }
    if (student_id) {
      query += ` AND f.student_id = ?`;
      params.push(student_id);
    }

    query += ` ORDER BY f.due_date DESC, f.id DESC`;
    const fees = await db.all(query, params);
    res.json(fees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fees/stats - Financial summaries
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.get(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_invoiced,
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END), 0) as total_collected,
        COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END), 0) as total_pending,
        COALESCE(SUM(CASE WHEN status = 'Overdue' THEN amount ELSE 0 END), 0) as total_overdue,
        COUNT(CASE WHEN status = 'Paid' THEN 1 END) as count_paid,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as count_pending,
        COUNT(CASE WHEN status = 'Overdue' THEN 1 END) as count_overdue
      FROM fees
    `);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fees - Create fee invoice
router.post('/', async (req, res) => {
  try {
    const { student_id, title, amount, due_date, status, payment_method } = req.body;
    if (!student_id || !title || !amount || !due_date) {
      return res.status(400).json({ error: 'Student ID, title, amount and due date are required' });
    }

    const invoiceNo = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const paidDate = status === 'Paid' ? new Date().toISOString().split('T')[0] : null;

    const result = await db.run(`
      INSERT INTO fees (invoice_no, student_id, title, amount, due_date, status, paid_date, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [invoiceNo, student_id, title, amount, due_date, status || 'Pending', paidDate, payment_method || null]);

    const newInvoice = await db.get('SELECT * FROM fees WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(newInvoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/fees/:id/pay - Mark invoice as paid
router.put('/:id/pay', async (req, res) => {
  try {
    const { payment_method } = req.body;
    const today = new Date().toISOString().split('T')[0];

    await db.run(`
      UPDATE fees SET
        status = 'Paid',
        paid_date = ?,
        payment_method = COALESCE(?, 'Cash')
      WHERE id = ?
    `, [today, payment_method || 'Cash', req.params.id]);

    const updated = await db.get('SELECT * FROM fees WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
