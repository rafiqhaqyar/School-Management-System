const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/meetings
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM meetings WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY meeting_date ASC, id DESC';
    const meetings = await db.all(query, params);
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/meetings - Arrange new meeting (Principal Authority)
router.post('/', async (req, res) => {
  try {
    const { title, agenda, meeting_date, meeting_time, venue, attendees, status, arranged_by } = req.body;
    if (!title || !agenda || !meeting_date || !meeting_time) {
      return res.status(400).json({ error: 'Title, agenda, date, and time are required' });
    }

    const result = await db.run(`
      INSERT INTO meetings (title, agenda, meeting_date, meeting_time, venue, attendees, status, arranged_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      agenda,
      meeting_date,
      meeting_time,
      venue || 'Principal Office',
      attendees || 'All Teachers',
      status || 'Scheduled',
      arranged_by || 'Principal Musharaf Khan'
    ]);

    const newMeeting = await db.get('SELECT * FROM meetings WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(newMeeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/meetings/:id - Update meeting status / details
router.put('/:id', async (req, res) => {
  try {
    const { title, agenda, meeting_date, meeting_time, venue, attendees, status } = req.body;
    await db.run(`
      UPDATE meetings SET
        title = COALESCE(?, title),
        agenda = COALESCE(?, agenda),
        meeting_date = COALESCE(?, meeting_date),
        meeting_time = COALESCE(?, meeting_time),
        venue = COALESCE(?, venue),
        attendees = COALESCE(?, attendees),
        status = COALESCE(?, status)
      WHERE id = ?
    `, [title, agenda, meeting_date, meeting_time, venue, attendees, status, req.params.id]);

    const updated = await db.get('SELECT * FROM meetings WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/meetings/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.run('DELETE FROM meetings WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    res.json({ message: 'Meeting cancelled and deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

