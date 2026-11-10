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
      ORDER BY 
        CASE 
          WHEN LOWER(c.name) LIKE 'prep%a' THEN 1
          WHEN LOWER(c.name) LIKE 'prep%b' THEN 2
          WHEN LOWER(c.name) LIKE 'prep%' THEN 3
          WHEN LOWER(c.name) LIKE 'nursery%' THEN 4
          WHEN LOWER(c.name) LIKE 'kg%' THEN 5
          WHEN LOWER(c.name) REGEXP '^class [0-9]+' THEN 10 + CAST(SUBSTRING(c.name, 7) AS UNSIGNED)
          ELSE 100
        END ASC,
        c.name ASC,
        c.section ASC
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

    const students = await db.all('SELECT * FROM students WHERE class_id = ? ORDER BY CAST(roll_no AS UNSIGNED) ASC, roll_no, first_name', [req.params.id]);
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
    const { name, section, room_number, capacity, monthly_fee } = req.body;
    if (!name || !section) {
      return res.status(400).json({ error: 'Class name and section are required' });
    }

    const cleanName = name.trim();
    const cleanSection = section.trim().toUpperCase();

    // Check duplicate
    const existing = await db.get('SELECT id FROM classes WHERE name = ? AND section = ?', [cleanName, cleanSection]);
    if (existing) {
      return res.status(400).json({ error: `Class "${cleanName} (${cleanSection})" already exists.` });
    }

    const result = await db.run(`
      INSERT INTO classes (name, section, room_number, capacity, monthly_fee)
      VALUES (?, ?, ?, ?, ?)
    `, [
      cleanName,
      cleanSection,
      room_number ? room_number.trim() : null,
      capacity ? Math.min(100, Math.max(1, parseInt(capacity))) : 40,
      monthly_fee ? parseFloat(monthly_fee) : 900.00
    ]);

    const newClass = await db.get('SELECT * FROM classes WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(newClass);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/classes/:id - Update class details
router.put('/:id', async (req, res) => {
  try {
    const classId = req.params.id;
    const { name, section, room_number, capacity, monthly_fee } = req.body;

    const cls = await db.get('SELECT * FROM classes WHERE id = ?', [classId]);
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    await db.run(`
      UPDATE classes SET
        name = COALESCE(?, name),
        section = COALESCE(?, section),
        room_number = COALESCE(?, room_number),
        capacity = COALESCE(?, capacity),
        monthly_fee = COALESCE(?, monthly_fee)
      WHERE id = ?
    `, [
      name ? name.trim() : null,
      section ? section.trim().toUpperCase() : null,
      room_number ? room_number.trim() : null,
      capacity !== undefined ? Math.min(100, Math.max(1, parseInt(capacity))) : null,
      monthly_fee !== undefined ? parseFloat(monthly_fee) : null,
      classId
    ]);

    const updated = await db.get('SELECT * FROM classes WHERE id = ?', [classId]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/classes/:id - Remove class (with cleanup for mistakenly created classes)
router.delete('/:id', async (req, res) => {
  try {
    const classId = req.params.id;
    const cls = await db.get('SELECT * FROM classes WHERE id = ?', [classId]);
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // 1. Unassign enrolled students (set class_id = NULL)
    await db.run('UPDATE students SET class_id = NULL WHERE class_id = ?', [classId]);

    // 2. Unassign teachers
    await db.run('UPDATE teachers SET assigned_class_id = NULL WHERE assigned_class_id = ?', [classId]);

    // 3. Unassign users
    await db.run('UPDATE users SET managed_class_id = NULL WHERE managed_class_id = ?', [classId]);

    // 4. Unassign subjects
    await db.run('UPDATE subjects SET class_id = NULL WHERE class_id = ?', [classId]);

    // 5. Delete timetables for this class
    await db.run('DELETE FROM class_timetable WHERE class_id = ?', [classId]);

    // 6. Delete assignments/tests for this class
    await db.run('DELETE FROM assignments_tests WHERE class_id = ?', [classId]);

    // 7. Delete the class itself
    await db.run('DELETE FROM classes WHERE id = ?', [classId]);

    res.json({
      success: true,
      message: `Class "${cls.name} (${cls.section})" has been removed successfully.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
