const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/notices - List all notices
router.get('/', async (req, res) => {
  try {
    const { audience } = req.query;
    let query = 'SELECT * FROM notices WHERE 1=1';
    const params = [];

    if (audience && audience !== 'All') {
      query += " AND (audience = ? OR audience = 'All')";
      params.push(audience);
    }

    query += ' ORDER BY id DESC';
    const notices = await db.all(query, params);
    res.json(notices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notices - Create new notice
router.post('/', async (req, res) => {
  try {
    const { title, content, audience, priority, date } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const result = await db.run(`
      INSERT INTO notices (title, content, audience, priority, date)
      VALUES (?, ?, ?, ?, ?)
    `, [
      title,
      content,
      audience || 'All',
      priority || 'Normal',
      date || new Date().toISOString().split('T')[0]
    ]);

    const newNotice = await db.get('SELECT * FROM notices WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(newNotice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notices/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.run('DELETE FROM notices WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Notice not found' });
    }
    res.json({ message: 'Notice deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
