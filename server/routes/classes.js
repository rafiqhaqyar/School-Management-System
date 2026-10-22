const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/classes - List all classes with student counts
router.get('/', (req, res) => {
  try {
    const classes = db.prepare(`
      SELECT 
        c.*,
        COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id
      GROUP BY c.id
      ORDER BY c.name, c.section
    `).all();

    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/classes/:id - Class details with students list and subjects
router.get('/:id', (req, res) => {
  try {
    const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const students = db.prepare('SELECT * FROM students WHERE class_id = ? ORDER BY roll_no, first_name').all(req.params.id);
    const subjects = db.prepare(`
      SELECT sub.*, t.first_name as teacher_first_name, t.last_name as teacher_last_name
      FROM subjects sub
      LEFT JOIN teachers t ON sub.teacher_id = t.id
      WHERE sub.class_id = ?
    `).all(req.params.id);

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
router.post('/', (req, res) => {
  try {
    const { name, section, room_number, capacity } = req.body;
    if (!name || !section) {
      return res.status(400).json({ error: 'Class name and section are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO classes (name, section, room_number, capacity)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(name, section, room_number || null, capacity || 40);
    const newClass = db.prepare('SELECT * FROM classes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newClass);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
