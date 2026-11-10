const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/rules
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM school_rules WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY id ASC';
    const rules = await db.all(query, params);
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rules - Publish school rule (Principal Authority)
router.post('/', async (req, res) => {
  try {
    const { title, category, description, penalty_or_note, approved_by } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const result = await db.run(`
      INSERT INTO school_rules (title, category, description, penalty_or_note, approved_by)
      VALUES (?, ?, ?, ?, ?)
    `, [
      title,
      category || 'General Conduct',
      description,
      penalty_or_note || null,
      approved_by || 'Principal Musharaf Khan'
    ]);

    const newRule = await db.get('SELECT * FROM school_rules WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(newRule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/rules/:id
router.put('/:id', async (req, res) => {
  try {
    const { title, category, description, penalty_or_note } = req.body;
    await db.run(`
      UPDATE school_rules SET
        title = COALESCE(?, title),
        category = COALESCE(?, category),
        description = COALESCE(?, description),
        penalty_or_note = COALESCE(?, penalty_or_note)
      WHERE id = ?
    `, [title, category, description, penalty_or_note, req.params.id]);

    const updated = await db.get('SELECT * FROM school_rules WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/rules/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.run('DELETE FROM school_rules WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    res.json({ message: 'Rule removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

