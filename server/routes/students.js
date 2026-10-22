const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/students - List students with search and filter
router.get('/', async (req, res) => {
  try {
    const { search, class_id, status } = req.query;
    let query = `
      SELECT s.*, c.name as class_name, c.section as class_section
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_no LIKE ? OR s.roll_no LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (class_id) {
      query += ` AND s.class_id = ?`;
      params.push(class_id);
    }

    if (status) {
      query += ` AND s.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY s.id DESC`;
    const students = await db.all(query, params);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/:id - Student complete profile with metrics
router.get('/:id', async (req, res) => {
  try {
    const student = await db.get(`
      SELECT s.*, c.name as class_name, c.section as class_section
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.id = ?
    `, [req.params.id]);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Attendance summary
    const attSummary = await db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent
      FROM attendance
      WHERE student_id = ?
    `, [req.params.id]);

    // Recent marks
    const marks = await db.all(`
      SELECT m.*, e.name as exam_name, sub.name as subject_name, sub.code as subject_code
      FROM marks m
      JOIN exams e ON m.exam_id = e.id
      JOIN subjects sub ON m.subject_id = sub.id
      WHERE m.student_id = ?
      ORDER BY m.id DESC
    `, [req.params.id]);

    // Fee invoices
    const fees = await db.all(`
      SELECT * FROM fees WHERE student_id = ? ORDER BY due_date DESC
    `, [req.params.id]);

    res.json({
      ...student,
      attendance_summary: attSummary,
      marks,
      fees
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students - Register/Enroll student
router.post('/', async (req, res) => {
  try {
    const {
      admission_no,
      first_name,
      last_name,
      gender,
      dob,
      class_id,
      roll_no,
      parent_name,
      parent_phone,
      parent_email,
      address,
      status,
      admission_date
    } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    const admNo = admission_no || `ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await db.run(`
      INSERT INTO students (
        admission_no, first_name, last_name, gender, dob, class_id,
        roll_no, parent_name, parent_phone, parent_email, address,
        status, admission_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      admNo,
      first_name,
      last_name,
      gender || 'Other',
      dob || null,
      class_id || null,
      roll_no || null,
      parent_name || null,
      parent_phone || null,
      parent_email || null,
      address || null,
      status || 'Active',
      admission_date || new Date().toISOString().split('T')[0]
    ]);

    const newStudent = await db.get('SELECT * FROM students WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(newStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/students/:id - Update student
router.put('/:id', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      gender,
      dob,
      class_id,
      roll_no,
      parent_name,
      parent_phone,
      parent_email,
      address,
      status
    } = req.body;

    await db.run(`
      UPDATE students SET
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        gender = COALESCE(?, gender),
        dob = COALESCE(?, dob),
        class_id = COALESCE(?, class_id),
        roll_no = COALESCE(?, roll_no),
        parent_name = COALESCE(?, parent_name),
        parent_phone = COALESCE(?, parent_phone),
        parent_email = COALESCE(?, parent_email),
        address = COALESCE(?, address),
        status = COALESCE(?, status)
      WHERE id = ?
    `, [
      first_name,
      last_name,
      gender,
      dob,
      class_id,
      roll_no,
      parent_name,
      parent_phone,
      parent_email,
      address,
      status,
      req.params.id
    ]);

    const updated = await db.get('SELECT * FROM students WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/students/:id - Delete student
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.run('DELETE FROM students WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
