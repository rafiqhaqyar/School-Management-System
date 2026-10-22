const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/attendance - Query attendance by date & optional class_id
router.get('/', async (req, res) => {
  try {
    const { date, class_id } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    let query = `
      SELECT 
        s.id as student_id,
        s.first_name,
        s.last_name,
        s.admission_no,
        s.roll_no,
        c.name as class_name,
        c.section as class_section,
        COALESCE(a.status, 'Unmarked') as status,
        a.notes,
        a.id as attendance_id
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
      WHERE s.status = 'Active'
    `;
    const params = [targetDate];

    if (class_id) {
      query += ` AND s.class_id = ?`;
      params.push(class_id);
    }

    query += ` ORDER BY s.roll_no, s.first_name`;
    const records = await db.all(query, params);

    // Summary counts for this date
    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'Present').length,
      absent: records.filter(r => r.status === 'Absent').length,
      late: records.filter(r => r.status === 'Late').length,
      unmarked: records.filter(r => r.status === 'Unmarked').length
    };

    res.json({
      date: targetDate,
      summary,
      records
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/mark - Batch record attendance
router.post('/mark', async (req, res) => {
  try {
    const { date, records } = req.body;
    if (!date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Date and records array are required' });
    }

    for (const row of records) {
      await db.run(`
        INSERT INTO attendance (student_id, date, status, notes)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          notes = VALUES(notes)
      `, [
        row.student_id,
        date,
        row.status || 'Present',
        row.notes || null
      ]);
    }

    res.json({ message: 'Attendance recorded successfully', count: records.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
