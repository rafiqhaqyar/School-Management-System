const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/timetable/:classId - Get full timetable for a class
router.get('/:classId', async (req, res) => {
  try {
    const slots = await db.all(`
      SELECT t.*, c.name as class_name, c.section as class_section
      FROM class_timetable t
      JOIN classes c ON t.class_id = c.id
      WHERE t.class_id = ?
      ORDER BY t.period_number ASC
    `, [req.params.classId]);

    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/timetable - Add new timetable slot / period
router.post('/', async (req, res) => {
  try {
    const {
      class_id,
      day_of_week,
      period_number,
      start_time,
      end_time,
      subject_name,
      teacher_name,
      is_break,
      break_label
    } = req.body;

    if (!class_id || !period_number || !start_time || !end_time) {
      return res.status(400).json({ error: 'Class, period number, start and end times are required' });
    }

    const result = await db.run(`
      INSERT INTO class_timetable (
        class_id, day_of_week, period_number, start_time, end_time,
        subject_name, teacher_name, is_break, break_label
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      class_id,
      day_of_week || 'Daily (Mon-Sat)',
      period_number,
      start_time,
      end_time,
      subject_name || (is_break ? 'Recess / Tea Break' : 'General'),
      teacher_name || (is_break ? 'All Faculty & Students' : 'Faculty'),
      is_break ? 1 : 0,
      break_label || null
    ]);

    const created = await db.get('SELECT * FROM class_timetable WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/timetable/:id - Update timetable slot
router.put('/:id', async (req, res) => {
  try {
    const {
      start_time,
      end_time,
      subject_name,
      teacher_name,
      is_break,
      break_label
    } = req.body;

    await db.run(`
      UPDATE class_timetable SET
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        subject_name = COALESCE(?, subject_name),
        teacher_name = COALESCE(?, teacher_name),
        is_break = COALESCE(?, is_break),
        break_label = COALESCE(?, break_label)
      WHERE id = ?
    `, [start_time, end_time, subject_name, teacher_name, is_break, break_label, req.params.id]);

    const updated = await db.get('SELECT * FROM class_timetable WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/timetable/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.run('DELETE FROM class_timetable WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Timetable slot not found' });
    }
    res.json({ message: 'Timetable slot removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

