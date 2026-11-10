const express = require('express');
const router = express.Router();
const db = require('../db');

function calculateGrade(marks, max) {
  const percentage = (marks / max) * 100;

  // 33 marks or below: Paper is declared Fail
  if (marks <= 33 || percentage < 33) {
    return { grade: 'Fail', status: 'Fail (Needs Father Consultation)', isPass: false };
  }
  if (percentage >= 80) return { grade: 'A+', status: 'Outstanding', isPass: true };
  if (percentage >= 70) return { grade: 'A', status: 'Excellent', isPass: true };
  if (percentage >= 60) return { grade: 'B', status: 'Good', isPass: true };
  if (percentage >= 50) return { grade: 'C', status: 'Satisfactory', isPass: true };
  return { grade: 'D', status: 'Pass', isPass: true };
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
    const { exam_id, class_id, subject_id, student_id } = req.query;
    let query = `
      SELECT 
        m.*,
        s.first_name,
        s.last_name,
        s.roll_no,
        s.admission_no,
        s.parent_phone,
        s.class_id,
        c.name as class_name,
        c.section as class_section,
        sub.name as subject_name,
        sub.code as subject_code,
        e.name as exam_name
      FROM marks m
      JOIN students s ON m.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
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
    if (student_id) {
      query += ` AND m.student_id = ?`;
      params.push(student_id);
    }

    query += ` ORDER BY CAST(s.roll_no AS UNSIGNED) ASC, sub.name ASC`;
    const marks = await db.all(query, params);

    const enriched = marks.map(m => {
      const g = calculateGrade(Number(m.marks_obtained), Number(m.max_marks));
      return {
        ...m,
        percentage: ((Number(m.marks_obtained) / Number(m.max_marks)) * 100).toFixed(1),
        grade_letter: g.grade,
        is_pass: g.isPass,
        status: g.status
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/grades/marks - Enter or update marks (Teacher can only enter their class)
router.post('/marks', async (req, res) => {
  try {
    const { student_id, exam_id, subject_id, marks_obtained, max_marks, remarks, requesting_role, managed_class_id } = req.body;
    if (!student_id || !exam_id || !subject_id || marks_obtained === undefined) {
      return res.status(400).json({ error: 'Student ID, Exam ID, Subject ID and Marks are required' });
    }

    // Role check: If teacher, verify student belongs to their managed class
    if (requesting_role === 'teacher' && managed_class_id) {
      const student = await db.get('SELECT class_id, first_name, last_name FROM students WHERE id = ?', [student_id]);
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      if (String(student.class_id) !== String(managed_class_id)) {
        return res.status(403).json({
          error: `Permission Denied: As a teacher, you are only authorized to record marks for students in your managed class!`
        });
      }
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

// GET /api/grades/report-card/:studentId - Academic report card (Grades ONLY, No GPA; Fail Notice if <= 33)
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
    let hasFailedAnySubject = false;

    const subjectsGraded = marks.map(m => {
      const g = calculateGrade(Number(m.marks_obtained), Number(m.max_marks));
      totalMarks += Number(m.marks_obtained);
      totalMax += Number(m.max_marks);
      if (!g.isPass) hasFailedAnySubject = true;

      return {
        ...m,
        percentage: ((Number(m.marks_obtained) / Number(m.max_marks)) * 100).toFixed(1),
        grade: g.grade,
        performance: g.status,
        isPass: g.isPass
      };
    });

    const averagePercentage = totalMax > 0 ? ((totalMarks / totalMax) * 100).toFixed(2) : 0;
    const overallGradeObj = calculateGrade(totalMarks, totalMax || 1);
    const overallGrade = hasFailedAnySubject ? 'Fail' : overallGradeObj.grade;

    res.json({
      student,
      results: subjectsGraded,
      summary: {
        totalSubjects: marks.length,
        totalMarksObtained: totalMarks,
        totalMaximumMarks: totalMax,
        averagePercentage: parseFloat(averagePercentage),
        overallGrade: overallGrade,
        hasFailed: hasFailedAnySubject,
        fatherConsultationRequired: hasFailedAnySubject || parseFloat(averagePercentage) < 33,
        fatherNotice: (hasFailedAnySubject || parseFloat(averagePercentage) < 33) 
          ? '⚠️ NOTICE: Student scored 33 marks or below in one or more subjects. The student MUST bring their father to meet the Class Teacher & Principal.'
          : null
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
