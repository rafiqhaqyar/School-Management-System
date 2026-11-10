const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school-management-system',
    multipleStatements: true
  });

  console.log('Connected to MySQL. Adding school settings, teacher attendance, and timetable...');

  // 1. School Settings table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS school_settings (
      id INT PRIMARY KEY DEFAULT 1,
      school_name VARCHAR(200) NOT NULL DEFAULT 'EduPulse Academy',
      tagline VARCHAR(255) DEFAULT 'Excellence in Academic and Character Development',
      logo_icon VARCHAR(50) DEFAULT '🎓',
      phone VARCHAR(50) DEFAULT '+92 322-9594616',
      email VARCHAR(150) DEFAULT 'rafiqhaqyar524@gmail.com',
      address TEXT,
      sports_week_date VARCHAR(100) DEFAULT 'Nov 18 - Nov 24, 2026',
      recess_break_minutes INT DEFAULT 30,
      recess_break_label VARCHAR(100) DEFAULT '30-Minute Break (Tea & Student Rest)',
      developer_name VARCHAR(100) DEFAULT 'Rafiq Haqyar',
      developer_phone VARCHAR(50) DEFAULT '923229594616',
      developer_email VARCHAR(100) DEFAULT 'rafiqhaqyar524@gmail.com',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Ensure default row exists
  const [sets] = await pool.query('SELECT id FROM school_settings WHERE id = 1');
  if (sets.length === 0) {
    await pool.query(`
      INSERT INTO school_settings (
        id, school_name, tagline, logo_icon, phone, email, address, sports_week_date,
        recess_break_minutes, recess_break_label, developer_name, developer_phone, developer_email
      ) VALUES (
        1, 'EduPulse Academy', 'Excellence in Academic and Character Development', '🎓',
        '+92 322-9594616', 'rafiqhaqyar524@gmail.com', 'Bajaur / Main Campus', 'Nov 18 - Nov 24, 2026',
        30, '30-Minute Break (Tea & Student Rest)', 'Rafiq Haqyar', '923229594616', 'rafiqhaqyar524@gmail.com'
      )
    `);
    console.log('Default school_settings seeded.');
  }

  // 2. Teacher Attendance table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS teacher_attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      teacher_id INT NOT NULL,
      date DATE NOT NULL,
      status ENUM('Present', 'Absent', 'Leave', 'Late') DEFAULT 'Present',
      notes VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_teacher_date (teacher_id, date),
      KEY idx_teacher_att_date (date),
      CONSTRAINT fk_teacher_att FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('teacher_attendance table ready.');

  // Seed sample teacher attendance for today
  await pool.query(`
    INSERT IGNORE INTO teacher_attendance (teacher_id, date, status, notes) VALUES
    (1, CURDATE(), 'Present', 'Class 8 Incharge - On time'),
    (2, CURDATE(), 'Present', 'Class 7 Incharge'),
    (3, CURDATE(), 'Present', 'English Dept'),
    (4, CURDATE(), 'Leave', 'Approved Casual Leave'),
    (7, CURDATE(), 'Present', 'Principal Musharaf Khan in office'),
    (8, CURDATE(), 'Present', 'PT Sir Tariq Mehmood - Led Morning Assembly')
  `);

  // 3. Class Timetable table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS class_timetable (
      id INT AUTO_INCREMENT PRIMARY KEY,
      class_id INT NOT NULL,
      day_of_week VARCHAR(20) NOT NULL,
      period_number INT NOT NULL,
      start_time VARCHAR(20) NOT NULL,
      end_time VARCHAR(20) NOT NULL,
      subject_name VARCHAR(150) NOT NULL,
      teacher_id INT DEFAULT NULL,
      teacher_name VARCHAR(150) DEFAULT NULL,
      is_break BOOLEAN DEFAULT 0,
      break_label VARCHAR(100) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_timetable_class (class_id),
      CONSTRAINT fk_timetable_class FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('class_timetable table ready.');

  // Seed default timetable schedule with 30-min tea break for classes
  const [classes] = await pool.query('SELECT id, name FROM classes');
  for (const c of classes) {
    const [existing] = await pool.query('SELECT id FROM class_timetable WHERE class_id = ? LIMIT 1', [c.id]);
    if (existing.length === 0) {
      // 5 periods + 30-minute tea break
      await pool.query(`
        INSERT INTO class_timetable (class_id, day_of_week, period_number, start_time, end_time, subject_name, teacher_name, is_break, break_label) VALUES
        (?, 'Daily (Mon-Sat)', 1, '08:00 AM', '08:45 AM', 'Mathematics', 'David Miller', 0, NULL),
        (?, 'Daily (Mon-Sat)', 2, '08:45 AM', '09:30 AM', 'General Science', 'Sarah Jenkins', 0, NULL),
        (?, 'Daily (Mon-Sat)', 3, '09:30 AM', '10:15 AM', 'English Literature', 'Robert Alvarez', 0, NULL),
        (?, 'Daily (Mon-Sat)', 4, '10:15 AM', '10:45 AM', 'Recess / Tea Break', 'All Faculty & Students', 1, '30-Minute Rest & Tea Break'),
        (?, 'Daily (Mon-Sat)', 5, '10:45 AM', '11:30 AM', 'Urdu / Islamiat', 'Marcus Chen', 0, NULL),
        (?, 'Daily (Mon-Sat)', 6, '11:30 AM', '12:15 PM', 'Physical Drill & Sports', 'Tariq Mehmood (PT Sir)', 0, NULL)
      `, [c.id, c.id, c.id, c.id, c.id, c.id]);
    }
  }
  console.log('Class timetables seeded with 30-min tea break.');

  // 4. Ensure students have sequential roll numbers per class
  for (const c of classes) {
    const [students] = await pool.query('SELECT id FROM students WHERE class_id = ? ORDER BY id ASC', [c.id]);
    let roll = 1;
    for (const s of students) {
      await pool.query('UPDATE students SET roll_no = ? WHERE id = ?', [String(roll), s.id]);
      roll++;
    }
  }
  console.log('Students sequential roll numbers initialized.');

  // 5. Ensure father phone exists for all students
  await pool.query("UPDATE students SET parent_phone = '+92 322-9594616' WHERE parent_phone IS NULL OR parent_phone = ''");

  await pool.end();
  console.log('Database upgrade 2 completed successfully!');
}

run().catch(e => {
  console.error('Upgrade 2 error:', e);
  process.exit(1);
});

