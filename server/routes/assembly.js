const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/assembly
router.get('/', async (req, res) => {
  try {
    const records = await db.all('SELECT * FROM assembly_schedules ORDER BY assembly_date DESC, id DESC');
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assembly - Arrange morning assembly (PT Sir)
router.post('/', async (req, res) => {
  try {
    const {
      assembly_date,
      pt_sir_name,
      tilawat_student,
      naat_student,
      speech_topic,
      drill_activity,
      special_announcement,
      discipline_rating
    } = req.body;

    if (!assembly_date) {
      return res.status(400).json({ error: 'Assembly date is required' });
    }

    const result = await db.run(`
      INSERT INTO assembly_schedules (
        assembly_date, pt_sir_name, tilawat_student, naat_student,
        speech_topic, drill_activity, special_announcement, discipline_rating
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        pt_sir_name = VALUES(pt_sir_name),
        tilawat_student = VALUES(tilawat_student),
        naat_student = VALUES(naat_student),
        speech_topic = VALUES(speech_topic),
        drill_activity = VALUES(drill_activity),
        special_announcement = VALUES(special_announcement),
        discipline_rating = VALUES(discipline_rating)
    `, [
      assembly_date,
      pt_sir_name || 'Tariq Mehmood (PT Sir)',
      tilawat_student || 'Muhammad Ali',
      naat_student || 'Ahmad Hassan',
      speech_topic || 'Importance of Discipline & Physical Fitness',
      drill_activity || 'Morning PT Exercises & March-Past Drill',
      special_announcement || null,
      discipline_rating || 'Excellent'
    ]);

    const record = await db.get('SELECT * FROM assembly_schedules WHERE assembly_date = ?', [assembly_date]);
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/assembly/:id
router.put('/:id', async (req, res) => {
  try {
    const {
      assembly_date,
      pt_sir_name,
      tilawat_student,
      naat_student,
      speech_topic,
      drill_activity,
      special_announcement,
      discipline_rating
    } = req.body;

    await db.run(`
      UPDATE assembly_schedules SET
        assembly_date = COALESCE(?, assembly_date),
        pt_sir_name = COALESCE(?, pt_sir_name),
        tilawat_student = COALESCE(?, tilawat_student),
        naat_student = COALESCE(?, naat_student),
        speech_topic = COALESCE(?, speech_topic),
        drill_activity = COALESCE(?, drill_activity),
        special_announcement = COALESCE(?, special_announcement),
        discipline_rating = COALESCE(?, discipline_rating)
      WHERE id = ?
    `, [
      assembly_date,
      pt_sir_name,
      tilawat_student,
      naat_student,
      speech_topic,
      drill_activity,
      special_announcement,
      discipline_rating,
      req.params.id
    ]);

    const updated = await db.get('SELECT * FROM assembly_schedules WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/assembly/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.run('DELETE FROM assembly_schedules WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Assembly record not found' });
    }
    res.json({ message: 'Assembly record removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

