const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/classes - List all classes with student counts
router.get('/', async (req, res) => {
  try {
    const classes = await db.all(`
      SELECT 
        c.*,
        COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id
      GROUP BY c.id
      ORDER BY c.name, c.section
    `);

    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/classes/:id - Class details with students list and subjects
router.get('/:id', async (req, res) => {
  try {
    const cls = await db.get('SELECT * FROM classes WHERE id = ?', [req.params.id]);
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const students = await db.all('SELECT * FROM students WHERE class_id = ? ORDER BY roll_no, first_name', [req.params.id]);
    const subjects = await db.all(`
      SELECT sub.*, t.first_name as teacher_first_name, t.last_name as teacher_last_name
      FROM subjects sub
      LEFT JOIN teachers t ON sub.teacher_id = t.id
      WHERE sub.class_id = ?
    `, [req.params.id]);

    res.json({
      ...cls,
      students,
      subjects
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/classes - Create new class
router.post('/', async (req, res) => {
  try {
    const { name, section, room_number, capacity } = req.body;
    if (!name || !section) {
      return res.status(400).json({ error: 'Class name and section are required' });
    }

    const result = await db.run(`
      INSERT INTO classes (name, section, room_number, capacity)
      VALUES (?, ?, ?, ?)
    `, [name, section, room_number || null, capacity || 40]);

    const newClass = await db.get('SELECT * FROM classes WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(newClass);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
