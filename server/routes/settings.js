const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage for logo uploads from SSD / system storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const safeName = `school-logo-${Date.now()}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowed = /jpeg|jpg|png|gif|svg|webp/i;
    const isMimeValid = allowed.test(file.mimetype);
    const isExtValid = allowed.test(path.extname(file.originalname).toLowerCase());
    if (isMimeValid || isExtValid) {
      return cb(null, true);
    }
    cb(new Error('Only image files (PNG, JPG, JPEG, GIF, SVG, WEBP) are allowed!'));
  }
});

// GET /api/settings - Fetch current school profile & configuration
router.get('/', async (req, res) => {
  try {
    const settings = await db.get('SELECT * FROM school_settings WHERE id = 1');
    res.json(settings || {
      school_name: 'EduPulse Academy',
      tagline: 'Excellence in Academic and Character Development',
      logo_icon: '🎓',
      logo_url: null,
      phone: '+92 322-9594616',
      email: 'rafiqhaqyar524@gmail.com',
      address: 'Bajaur / Main Campus',
      sports_week_date: 'Nov 18 - Nov 24, 2026',
      recess_break_minutes: 30,
      recess_break_label: '30-Minute Break (Tea & Student Rest)',
      developer_name: 'Rafiq Haqyar',
      developer_phone: '923229594616',
      developer_email: 'rafiqhaqyar524@gmail.com'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings - Update school profile & configuration
router.put('/', async (req, res) => {
  try {
    const {
      school_name,
      tagline,
      logo_icon,
      logo_url,
      phone,
      email,
      address,
      sports_week_date,
      recess_break_minutes,
      recess_break_label
    } = req.body;

    await db.run(`
      UPDATE school_settings SET
        school_name = COALESCE(?, school_name),
        tagline = COALESCE(?, tagline),
        logo_icon = COALESCE(?, logo_icon),
        logo_url = COALESCE(?, logo_url),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        address = COALESCE(?, address),
        sports_week_date = COALESCE(?, sports_week_date),
        recess_break_minutes = COALESCE(?, recess_break_minutes),
        recess_break_label = COALESCE(?, recess_break_label)
      WHERE id = 1
    `, [
      school_name,
      tagline,
      logo_icon,
      logo_url,
      phone,
      email,
      address,
      sports_week_date,
      recess_break_minutes,
      recess_break_label
    ]);

    const updated = await db.get('SELECT * FROM school_settings WHERE id = 1');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/logo - Upload custom school logo image directly from local storage/SSD
router.post('/logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const logoUrl = `/uploads/${req.file.filename}`;
    await db.run('UPDATE school_settings SET logo_url = ? WHERE id = 1', [logoUrl]);

    const updated = await db.get('SELECT * FROM school_settings WHERE id = 1');
    res.json({
      success: true,
      message: 'School logo uploaded and updated successfully!',
      logo_url: logoUrl,
      settings: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/settings/logo - Reset school logo back to default icon
router.delete('/logo', async (req, res) => {
  try {
    await db.run('UPDATE school_settings SET logo_url = NULL WHERE id = 1');
    const updated = await db.get('SELECT * FROM school_settings WHERE id = 1');
    res.json({
      success: true,
      message: 'School logo reset to default icon',
      settings: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
