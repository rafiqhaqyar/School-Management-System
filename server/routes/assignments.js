const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/assignments
router.get('/', async (req, res) => {
  try {
    const { class_id, teacher_id, type } = req.query;
    let query = `
      SELECT 
        a.*,
        c.name as class_name,
        c.section as class_section,
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name
      FROM assignments_tests a
      JOIN classes c ON a.class_id = c.id
      LEFT JOIN teachers t ON a.teacher_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (class_id) {
      query += ' AND a.class_id = ?';
      params.push(class_id);
    }
    if (teacher_id) {
      query += ' AND a.teacher_id = ?';
      params.push(teacher_id);
    }
    if (type) {
      query += ' AND a.type = ?';
      params.push(type);
    }

    query += ' ORDER BY a.test_date DESC, a.id DESC';
    const items = await db.all(query, params);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assignments - Create test or assignment (Teacher / Admin)
router.post('/', async (req, res) => {
  try {
    const {
      class_id,
      teacher_id,
      subject_name,
      title,
      test_topic,
      test_date,
      submission_date,
      total_marks,
      type,
      instructions
    } = req.body;

    if (!class_id || !title || !test_topic || !test_date) {
      return res.status(400).json({ error: 'Class, title, test topic, and test date are required' });
    }

    const result = await db.run(`
      INSERT INTO assignments_tests (
        class_id, teacher_id, subject_name, title, test_topic,
        test_date, submission_date, total_marks, type, instructions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      class_id,
      teacher_id || null,
      subject_name || 'General',
      title,
      test_topic,
      test_date,
      submission_date || null,
      total_marks || 25,
      type || 'Test',
      instructions || null
    ]);

    const newItem = await db.get(`
      SELECT a.*, c.name as class_name, c.section as class_section
      FROM assignments_tests a
      JOIN classes c ON a.class_id = c.id
      WHERE a.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assignments/submit - Student submits assignment to chosen teacher
router.post('/submit', async (req, res) => {
  try {
    const {
      assignment_id,
      student_id,
      teacher_id,
      submission_title,
      submission_content
    } = req.body;

    if (!assignment_id || !student_id || !teacher_id || !submission_content) {
      return res.status(400).json({ error: 'Assignment, student, teacher, and submission content are required' });
    }

    const result = await db.run(`
      INSERT INTO assignment_submissions (
        assignment_id, student_id, teacher_id, submission_title, submission_content, status
      ) VALUES (?, ?, ?, ?, ?, 'Submitted')
    `, [
      assignment_id,
      student_id,
      teacher_id,
      submission_title || 'Assignment Submission',
      submission_content
    ]);

    const newSub = await db.get(`
      SELECT 
        s.*,
        a.title as assignment_title,
        a.subject_name,
        st.first_name as student_first_name,
        st.last_name as student_last_name,
        st.roll_no as student_roll_no,
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name
      FROM assignment_submissions s
      JOIN assignments_tests a ON s.assignment_id = a.id
      JOIN students st ON s.student_id = st.id
      JOIN teachers t ON s.teacher_id = t.id
      WHERE s.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json({
      success: true,
      message: `Assignment submitted successfully to teacher ${newSub.teacher_first_name} ${newSub.teacher_last_name}!`,
      submission: newSub
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assignments/submissions - List submissions (Filtered by student or teacher)
router.get('/submissions', async (req, res) => {
  try {
    const { student_id, teacher_id, assignment_id } = req.query;
    let query = `
      SELECT 
        s.*,
        a.title as assignment_title,
        a.subject_name,
        a.total_marks,
        st.first_name as student_first_name,
        st.last_name as student_last_name,
        st.roll_no as student_roll_no,
        c.name as class_name,
        c.section as class_section,
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name
      FROM assignment_submissions s
      JOIN assignments_tests a ON s.assignment_id = a.id
      JOIN students st ON s.student_id = st.id
      JOIN classes c ON st.class_id = c.id
      JOIN teachers t ON s.teacher_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (student_id) {
      query += ' AND s.student_id = ?';
      params.push(student_id);
    }
    if (teacher_id) {
      query += ' AND s.teacher_id = ?';
      params.push(teacher_id);
    }
    if (assignment_id) {
      query += ' AND s.assignment_id = ?';
      params.push(assignment_id);
    }

    query += ' ORDER BY s.submitted_at DESC';
    const rows = await db.all(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/assignments/submissions/:id - Teacher grades or gives feedback
router.put('/submissions/:id', async (req, res) => {
  try {
    const { status, teacher_feedback, grade_score } = req.body;
    await db.run(`
      UPDATE assignment_submissions SET
        status = COALESCE(?, status),
        teacher_feedback = COALESCE(?, teacher_feedback),
        grade_score = COALESCE(?, grade_score)
      WHERE id = ?
    `, [status, teacher_feedback, grade_score, req.params.id]);

    const updated = await db.get('SELECT * FROM assignment_submissions WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/assignments/:id - Edit assignment, test topic, test date
router.put('/:id', async (req, res) => {
  try {
    const {
      class_id,
      subject_name,
      title,
      test_topic,
      test_date,
      submission_date,
      total_marks,
      type,
      instructions
    } = req.body;

    await db.run(`
      UPDATE assignments_tests SET
        class_id = COALESCE(?, class_id),
        subject_name = COALESCE(?, subject_name),
        title = COALESCE(?, title),
        test_topic = COALESCE(?, test_topic),
        test_date = COALESCE(?, test_date),
        submission_date = COALESCE(?, submission_date),
        total_marks = COALESCE(?, total_marks),
        type = COALESCE(?, type),
        instructions = COALESCE(?, instructions)
      WHERE id = ?
    `, [
      class_id,
      subject_name,
      title,
      test_topic,
      test_date,
      submission_date,
      total_marks,
      type,
      instructions,
      req.params.id
    ]);

    const updated = await db.get(`
      SELECT a.*, c.name as class_name, c.section as class_section
      FROM assignments_tests a
      JOIN classes c ON a.class_id = c.id
      WHERE a.id = ?
    `, [req.params.id]);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/assignments/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.run('DELETE FROM assignments_tests WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Assignment/Test removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
