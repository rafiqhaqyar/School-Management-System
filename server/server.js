require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Ensure database and uploads directory exist
require('./db');
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/students', require('./routes/students'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/rules', require('./routes/rules'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/assembly', require('./routes/assembly'));
app.use('/api/timetable', require('./routes/timetable'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: 'School Management System',
    currency: 'PKR',
    developer: 'Rafiq Haqyar (+92 322-9594616)'
  });
});

// SPA fallback
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Auto-verify and setup attached database on startup
async function startServer() {
  try {
    const db = require('./db');
    const tables = await db.all('SHOW TABLES');
    if (!tables || tables.length === 0) {
      console.log('Database tables not detected. Initializing attached schema...');
      const setupDatabase = require('./setup-db');
      await setupDatabase();
    }
  } catch (err) {
    console.log('Database connection check:', err.message);
    try {
      const setupDatabase = require('./setup-db');
      await setupDatabase();
    } catch (setupErr) {
      console.warn('Note: Ensure MySQL server is running or configure .env credentials.');
    }
  }

  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🎓 School Management System Server Running!`);
    console.log(`📍 Local URL: http://localhost:${PORT}`);
    console.log(`⚡ Developer: Rafiq Haqyar (923229594616)`);
    console.log(`===================================================`);
  });
}

startServer();

module.exports = app;
