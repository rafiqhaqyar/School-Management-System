const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/attendance - Query student attendance by date & optional class_id
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
        s.parent_phone,
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

    query += ` ORDER BY CAST(s.roll_no AS UNSIGNED) ASC, s.first_name ASC`;
    const records = await db.all(query, params);

    // Summary counts for this date
    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'Present').length,
      absent: records.filter(r => r.status === 'Absent').length,
      leave: records.filter(r => r.status === 'Excused' || r.status === 'Leave').length,
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

// POST /api/attendance/mark - Batch record student attendance
router.post('/mark', async (req, res) => {
  try {
    const { date, records } = req.body;
    if (!date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Date and records array are required' });
    }

    for (const row of records) {
      let statusVal = row.status || 'Present';
      if (statusVal === 'Leave') statusVal = 'Excused';

      await db.run(`
        INSERT INTO attendance (student_id, date, status, notes)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          notes = VALUES(notes)
      `, [
        row.student_id,
        date,
        statusVal,
        row.notes || null
      ]);
    }

    res.json({ message: 'Attendance recorded successfully', count: records.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/class-monthly - Full monthly attendance report for all students in a class
router.get('/class-monthly', async (req, res) => {
  try {
    const { class_id, month } = req.query;
    // Default to current month YYYY-MM
    const currentMonth = month || new Date().toISOString().substring(0, 7);

    let query = `
      SELECT 
        s.id as student_id,
        s.roll_no,
        s.first_name,
        s.last_name,
        s.admission_no,
        s.parent_phone,
        c.name as class_name,
        c.section as class_section,
        COUNT(a.id) as total_days,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN a.status = 'Excused' OR a.status = 'Leave' THEN 1 ELSE 0 END) as leave_days,
        SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) as late_days
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN attendance a ON a.student_id = s.id AND DATE_FORMAT(a.date, '%Y-%m') = ?
      WHERE s.status = 'Active'
    `;
    const params = [currentMonth];

    if (class_id) {
      query += ` AND s.class_id = ?`;
      params.push(class_id);
    }

    query += `
      GROUP BY s.id, s.roll_no, s.first_name, s.last_name, s.admission_no, s.parent_phone, c.name, c.section
      ORDER BY CAST(s.roll_no AS UNSIGNED) ASC, s.first_name ASC
    `;

    const rows = await db.all(query, params);

    const report = rows.map(r => {
      const total = Number(r.total_days) || 0;
      const present = Number(r.present_days) || 0;
      const absent = Number(r.absent_days) || 0;
      const leave = Number(r.leave_days) || 0;
      const late = Number(r.late_days) || 0;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 100;

      let standing = 'Normal';
      if (percentage >= 90) standing = 'Excellent';
      else if (percentage >= 75) standing = 'Good';
      else if (percentage >= 60) standing = 'Low';
      else standing = 'Critical';

      return {
        student_id: r.student_id,
        roll_no: r.roll_no,
        name: `${r.first_name} ${r.last_name}`.trim(),
        admission_no: r.admission_no,
        parent_phone: r.parent_phone,
        class_name: `${r.class_name} (${r.class_section})`,
        month: currentMonth,
        total_days: total,
        present_days: present,
        absent_days: absent,
        leave_days: leave,
        late_days: late,
        percentage,
        standing
      };
    });

    res.json({
      month: currentMonth,
      class_id: class_id || 'all',
      total_students: report.length,
      report
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/student-monthly/:studentId - Monthly attendance summary for student
router.get('/student-monthly/:studentId', async (req, res) => {
  try {
    const records = await db.all(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month_year,
        COUNT(*) as total_recorded,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'Excused' OR status = 'Leave' THEN 1 ELSE 0 END) as leave_days,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_days
      FROM attendance
      WHERE student_id = ?
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month_year DESC
    `, [req.params.studentId]);

    const formatted = records.map(r => ({
      month: r.month_year,
      totalDays: Number(r.total_recorded),
      present: Number(r.present_days),
      absent: Number(r.absent_days),
      leave: Number(r.leave_days),
      late: Number(r.late_days),
      rate: Number(r.total_recorded) > 0 ? Math.round((Number(r.present_days) / Number(r.total_recorded)) * 100) : 100
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/teachers - Query teacher attendance
router.get('/teachers', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const records = await db.all(`
      SELECT 
        t.id as teacher_id,
        t.employee_id,
        t.first_name,
        t.last_name,
        t.role_designation,
        t.phone,
        t.due_classes,
        t.completed_classes,
        GREATEST(0, COALESCE(t.due_classes, 24) - COALESCE(t.completed_classes, 0)) as remaining_classes,
        c.name as managed_class_name,
        c.section as managed_class_section,
        COALESCE(ta.status, 'Unmarked') as status,
        ta.notes,
        ta.id as attendance_id
      FROM teachers t
      LEFT JOIN classes c ON t.assigned_class_id = c.id
      LEFT JOIN teacher_attendance ta ON ta.teacher_id = t.id AND ta.date = ?
      WHERE t.status = 'Active'
      ORDER BY FIELD(t.role_designation, 'Principal', 'PT Instructor', 'Teacher'), t.first_name ASC
    `, [targetDate]);

    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'Present').length,
      absent: records.filter(r => r.status === 'Absent').length,
      leave: records.filter(r => r.status === 'Leave').length,
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

// POST /api/attendance/teachers/mark - Mark teacher attendance
router.post('/teachers/mark', async (req, res) => {
  try {
    const { date, records } = req.body;
    if (!date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Date and records array are required' });
    }

    for (const row of records) {
      await db.run(`
        INSERT INTO teacher_attendance (teacher_id, date, status, notes)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          notes = VALUES(notes)
      `, [
        row.teacher_id,
        date,
        row.status || 'Present',
        row.notes || null
      ]);
    }

    res.json({ message: 'Teacher attendance recorded successfully', count: records.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
