const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/teachers - List teachers with workload and attendance
router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = `
      SELECT 
        t.*,
        GREATEST(0, COALESCE(t.due_classes, 24) - COALESCE(t.completed_classes, 0)) as remaining_classes,
        c.name as managed_class_name,
        c.section as managed_class_section,
        (
          SELECT status FROM teacher_attendance ta 
          WHERE ta.teacher_id = t.id AND ta.date = CURDATE() 
          ORDER BY ta.id DESC LIMIT 1
        ) as today_attendance
      FROM teachers t
      LEFT JOIN classes c ON t.assigned_class_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (t.first_name LIKE ? OR t.last_name LIKE ? OR t.employee_id LIKE ? OR t.subject_specialization LIKE ? OR t.role_designation LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY FIELD(t.role_designation, 'Principal', 'PT Instructor', 'Teacher'), t.id ASC`;
    const teachers = await db.all(query, params);
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/teachers/:id - Teacher details with assigned subjects & classes
router.get('/:id', async (req, res) => {
  try {
    const teacher = await db.get(`
      SELECT 
        t.*,
        GREATEST(0, COALESCE(t.due_classes, 24) - COALESCE(t.completed_classes, 0)) as remaining_classes,
        c.name as managed_class_name,
        c.section as managed_class_section
      FROM teachers t
      LEFT JOIN classes c ON t.assigned_class_id = c.id
      WHERE t.id = ?
    `, [req.params.id]);

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
      status,
      role_designation,
      assigned_class_id,
      due_classes,
      completed_classes
    } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    const empId = employee_id || `TCH-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await db.run(`
      INSERT INTO teachers (
        employee_id, first_name, last_name, email, phone,
        subject_specialization, qualification, joining_date, salary, status,
        role_designation, assigned_class_id, due_classes, completed_classes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      status || 'Active',
      role_designation || 'Teacher',
      assigned_class_id || null,
      due_classes !== undefined ? parseInt(due_classes) : 24,
      completed_classes !== undefined ? parseInt(completed_classes) : 0
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
      status,
      role_designation,
      assigned_class_id,
      due_classes,
      completed_classes
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
        status = COALESCE(?, status),
        role_designation = COALESCE(?, role_designation),
        assigned_class_id = COALESCE(?, assigned_class_id),
        due_classes = COALESCE(?, due_classes),
        completed_classes = COALESCE(?, completed_classes)
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
      role_designation,
      assigned_class_id,
      due_classes !== undefined ? parseInt(due_classes) : null,
      completed_classes !== undefined ? parseInt(completed_classes) : null,
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
