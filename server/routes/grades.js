const express = require('express');
const router = express.Router();
const db = require('../db');

function calculateGrade(marks, max) {
  const percentage = (marks / max) * 100;
  if (percentage >= 90) return { grade: 'A+', gpa: 4.0, status: 'Distinction' };
  if (percentage >= 80) return { grade: 'A', gpa: 3.7, status: 'Excellent' };
  if (percentage >= 70) return { grade: 'B', gpa: 3.0, status: 'Good' };
  if (percentage >= 60) return { grade: 'C', gpa: 2.0, status: 'Satisfactory' };
  if (percentage >= 50) return { grade: 'D', gpa: 1.0, status: 'Pass' };
  return { grade: 'F', gpa: 0.0, status: 'Fail' };
}

// GET /api/grades/exams - List all exams
router.get('/exams', async (req, res) => {
  try {
    const exams = await db.all('SELECT * FROM exams ORDER BY id DESC');
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/grades/exams - Create exam
router.post('/exams', async (req, res) => {
  try {
    const { name, term, session_year, start_date, end_date } = req.body;
    if (!name || !term || !session_year) {
      return res.status(400).json({ error: 'Name, term, and session year are required' });
    }

    const result = await db.run(`
      INSERT INTO exams (name, term, session_year, start_date, end_date)
      VALUES (?, ?, ?, ?, ?)
    `, [name, term, session_year, start_date || null, end_date || null]);

    const newExam = await db.get('SELECT * FROM exams WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(newExam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/grades/marks - List marks filtered by exam & class
router.get('/marks', async (req, res) => {
  try {
    const { exam_id, class_id, subject_id } = req.query;
    let query = `
      SELECT 
        m.*,
        s.first_name,
        s.last_name,
        s.roll_no,
        s.admission_no,
        sub.name as subject_name,
        sub.code as subject_code,
        e.name as exam_name
      FROM marks m
      JOIN students s ON m.student_id = s.id
      JOIN subjects sub ON m.subject_id = sub.id
      JOIN exams e ON m.exam_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (exam_id) {
      query += ` AND m.exam_id = ?`;
      params.push(exam_id);
    }
    if (class_id) {
      query += ` AND s.class_id = ?`;
      params.push(class_id);
    }
    if (subject_id) {
      query += ` AND m.subject_id = ?`;
      params.push(subject_id);
    }

    query += ` ORDER BY s.roll_no, sub.name`;
    const marks = await db.all(query, params);

    const enriched = marks.map(m => {
      const g = calculateGrade(Number(m.marks_obtained), Number(m.max_marks));
      return {
        ...m,
        percentage: ((Number(m.marks_obtained) / Number(m.max_marks)) * 100).toFixed(1),
        grade_letter: g.grade,
        gpa: g.gpa
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/grades/marks - Enter or update marks
router.post('/marks', async (req, res) => {
  try {
    const { student_id, exam_id, subject_id, marks_obtained, max_marks, remarks } = req.body;
    if (!student_id || !exam_id || !subject_id || marks_obtained === undefined) {
      return res.status(400).json({ error: 'Student ID, Exam ID, Subject ID and Marks are required' });
    }

    await db.run(`
      INSERT INTO marks (student_id, exam_id, subject_id, marks_obtained, max_marks, remarks)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        marks_obtained = VALUES(marks_obtained),
        max_marks = VALUES(max_marks),
        remarks = VALUES(remarks)
    `, [student_id, exam_id, subject_id, marks_obtained, max_marks || 100, remarks || null]);

    res.json({ message: 'Mark recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/grades/report-card/:studentId - Academic report card
router.get('/report-card/:studentId', async (req, res) => {
  try {
    const student = await db.get(`
      SELECT s.*, c.name as class_name, c.section as class_section
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.id = ?
    `, [req.params.studentId]);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const marks = await db.all(`
      SELECT 
        m.*,
        sub.name as subject_name,
        sub.code as subject_code,
        e.name as exam_name,
        e.term
      FROM marks m
      JOIN subjects sub ON m.subject_id = sub.id
      JOIN exams e ON m.exam_id = e.id
      WHERE m.student_id = ?
    `, [req.params.studentId]);

    let totalMarks = 0;
    let totalMax = 0;
    let totalGpa = 0;

    const subjectsGraded = marks.map(m => {
      const g = calculateGrade(Number(m.marks_obtained), Number(m.max_marks));
      totalMarks += Number(m.marks_obtained);
      totalMax += Number(m.max_marks);
      totalGpa += g.gpa;

      return {
        ...m,
        percentage: ((Number(m.marks_obtained) / Number(m.max_marks)) * 100).toFixed(1),
        grade: g.grade,
        gpa: g.gpa,
        performance: g.status
      };
    });

    const averagePercentage = totalMax > 0 ? ((totalMarks / totalMax) * 100).toFixed(2) : 0;
    const overallGpa = marks.length > 0 ? (totalGpa / marks.length).toFixed(2) : 0;

    res.json({
      student,
      results: subjectsGraded,
      summary: {
        totalSubjects: marks.length,
        totalMarksObtained: totalMarks,
        totalMaximumMarks: totalMax,
        averagePercentage: parseFloat(averagePercentage),
        overallGpa: parseFloat(overallGpa),
        overallGrade: calculateGrade(totalMarks, totalMax || 1).grade
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
