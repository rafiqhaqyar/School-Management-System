const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/teachers - List teachers
router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = `SELECT * FROM teachers WHERE 1=1`;
    const params = [];

    if (search) {
      query += ` AND (first_name LIKE ? OR last_name LIKE ? OR employee_id LIKE ? OR subject_specialization LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY id DESC`;
    const teachers = await db.all(query, params);
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/teachers/:id - Teacher details with assigned subjects & classes
router.get('/:id', async (req, res) => {
  try {
    const teacher = await db.get('SELECT * FROM teachers WHERE id = ?', [req.params.id]);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const subjects = await db.all(`
      SELECT s.*, c.name as class_name, c.section as class_section
      FROM subjects s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.teacher_id = ?
    `, [req.params.id]);

    res.json({
      ...teacher,
      subjects
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/teachers - Add new teacher
router.post('/', async (req, res) => {
  try {
    const {
      employee_id,
      first_name,
      last_name,
      email,
      phone,
      subject_specialization,
      qualification,
      joining_date,
      salary,
      status
    } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    const empId = employee_id || `TCH-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await db.run(`
      INSERT INTO teachers (
        employee_id, first_name, last_name, email, phone,
        subject_specialization, qualification, joining_date, salary, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      empId,
      first_name,
      last_name,
      email,
      phone || null,
      subject_specialization || null,
      qualification || null,
      joining_date || new Date().toISOString().split('T')[0],
      salary || 0,
      status || 'Active'
    ]);

    const newTeacher = await db.get('SELECT * FROM teachers WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(newTeacher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/teachers/:id - Update teacher
router.put('/:id', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      subject_specialization,
      qualification,
      salary,
      status
    } = req.body;

    await db.run(`
      UPDATE teachers SET
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        subject_specialization = COALESCE(?, subject_specialization),
        qualification = COALESCE(?, qualification),
        salary = COALESCE(?, salary),
        status = COALESCE(?, status)
      WHERE id = ?
    `, [
      first_name,
      last_name,
      email,
      phone,
      subject_specialization,
      qualification,
      salary,
      status,
      req.params.id
    ]);

    const updated = await db.get('SELECT * FROM teachers WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/teachers/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.run('DELETE FROM teachers WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    res.json({ message: 'Teacher deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
