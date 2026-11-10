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

  console.log('Connected to MySQL. Updating schema and seed data...');

  // 1. Alter classes table to add monthly_fee
  try {
    await pool.query("ALTER TABLE `classes` ADD COLUMN `monthly_fee` DECIMAL(10,2) DEFAULT 900.00");
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') console.warn('monthly_fee notice:', e.message);
  }

  // 2. Alter teachers table to add role_designation, assigned_class_id
  try {
    await pool.query("ALTER TABLE `teachers` ADD COLUMN `role_designation` VARCHAR(100) DEFAULT 'Teacher'");
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') console.warn(e.message);
  }

  try {
    await pool.query("ALTER TABLE `teachers` ADD COLUMN `assigned_class_id` INT DEFAULT NULL");
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') console.warn(e.message);
  }

  // 3. Create users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`username\` VARCHAR(100) NOT NULL UNIQUE,
      \`password\` VARCHAR(255) NOT NULL,
      \`role\` ENUM('admin', 'principal', 'teacher', 'student') NOT NULL,
      \`display_name\` VARCHAR(150) NOT NULL,
      \`ref_id\` INT DEFAULT NULL,
      \`managed_class_id\` INT DEFAULT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 4. Create meetings table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`meetings\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`title\` VARCHAR(200) NOT NULL,
      \`agenda\` TEXT NOT NULL,
      \`meeting_date\` DATE NOT NULL,
      \`meeting_time\` VARCHAR(50) NOT NULL,
      \`venue\` VARCHAR(100) DEFAULT 'Principal Office',
      \`attendees\` VARCHAR(100) DEFAULT 'All Teachers',
      \`status\` ENUM('Scheduled', 'Completed', 'Postponed') DEFAULT 'Scheduled',
      \`arranged_by\` VARCHAR(100) DEFAULT 'Principal Musharaf Khan',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 5. Create school_rules table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`school_rules\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`title\` VARCHAR(200) NOT NULL,
      \`category\` ENUM('Discipline', 'Dress Code', 'Examinations', 'Fee Policy', 'General Conduct') DEFAULT 'General Conduct',
      \`description\` TEXT NOT NULL,
      \`penalty_or_note\` VARCHAR(255) DEFAULT NULL,
      \`approved_by\` VARCHAR(100) DEFAULT 'Principal Musharaf Khan',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 6. Create assignments_tests table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`assignments_tests\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`class_id\` INT NOT NULL,
      \`teacher_id\` INT DEFAULT NULL,
      \`subject_name\` VARCHAR(150) NOT NULL,
      \`title\` VARCHAR(200) NOT NULL,
      \`test_topic\` VARCHAR(255) NOT NULL,
      \`test_date\` DATE NOT NULL,
      \`submission_date\` DATE DEFAULT NULL,
      \`total_marks\` DECIMAL(5,2) DEFAULT 25.00,
      \`type\` ENUM('Test', 'Assignment') DEFAULT 'Test',
      \`instructions\` TEXT DEFAULT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY \`idx_assign_class\` (\`class_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 7. Create assembly_schedules table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`assembly_schedules\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`assembly_date\` DATE NOT NULL UNIQUE,
      \`pt_sir_name\` VARCHAR(100) DEFAULT 'Tariq Mehmood (PT Sir)',
      \`tilawat_student\` VARCHAR(150) DEFAULT 'Muhammad Ali',
      \`naat_student\` VARCHAR(150) DEFAULT 'Ahmad Hassan',
      \`speech_topic\` VARCHAR(255) DEFAULT 'Importance of Punctuality & Physical Fitness',
      \`drill_activity\` VARCHAR(255) DEFAULT 'Morning PT & March-Past Drill',
      \`special_announcement\` TEXT DEFAULT NULL,
      \`discipline_rating\` VARCHAR(50) DEFAULT 'Excellent',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 8. Populate / Synchronize clean classes: Prep A, Prep B, Class 1 to Class 8
  const desiredClasses = [
    { name: 'Prep', section: 'A', room: 'Room 01', capacity: 30, fee: 450.00 },
    { name: 'Prep', section: 'B', room: 'Room 02', capacity: 30, fee: 500.00 },
    { name: 'Class 1', section: 'A', room: 'Room 101', capacity: 40, fee: 550.00 },
    { name: 'Class 2', section: 'A', room: 'Room 102', capacity: 40, fee: 600.00 },
    { name: 'Class 3', section: 'A', room: 'Room 103', capacity: 40, fee: 650.00 },
    { name: 'Class 4', section: 'A', room: 'Room 104', capacity: 40, fee: 700.00 },
    { name: 'Class 5', section: 'A', room: 'Room 105', capacity: 40, fee: 750.00 },
    { name: 'Class 6', section: 'A', room: 'Room 106', capacity: 40, fee: 800.00 },
    { name: 'Class 7', section: 'A', room: 'Room 107', capacity: 40, fee: 850.00 },
    { name: 'Class 8', section: 'A', room: 'Room 108', capacity: 40, fee: 900.00 }
  ];

  for (const c of desiredClasses) {
    const [existing] = await pool.query('SELECT id FROM classes WHERE name = ? AND section = ?', [c.name, c.section]);
    if (existing.length > 0) {
      await pool.query('UPDATE classes SET monthly_fee = ?, room_number = ?, capacity = ? WHERE id = ?', [c.fee, c.room, c.capacity, existing[0].id]);
    } else {
      await pool.query('INSERT INTO classes (name, section, room_number, capacity, monthly_fee) VALUES (?, ?, ?, ?, ?)', [c.name, c.section, c.room, c.capacity, c.fee]);
    }
  }

  // Get new class IDs
  const [prepARow] = await pool.query("SELECT id FROM classes WHERE name = 'Prep' AND section = 'A'");
  const [prepBRow] = await pool.query("SELECT id FROM classes WHERE name = 'Prep' AND section = 'B'");
  const [class1Row] = await pool.query("SELECT id FROM classes WHERE name = 'Class 1' LIMIT 1");
  const [class2Row] = await pool.query("SELECT id FROM classes WHERE name = 'Class 2' LIMIT 1");
  const [class3Row] = await pool.query("SELECT id FROM classes WHERE name = 'Class 3' LIMIT 1");
  const [class4Row] = await pool.query("SELECT id FROM classes WHERE name = 'Class 4' LIMIT 1");
  const [class5Row] = await pool.query("SELECT id FROM classes WHERE name = 'Class 5' LIMIT 1");
  const [class6Row] = await pool.query("SELECT id FROM classes WHERE name = 'Class 6' LIMIT 1");
  const [class7Row] = await pool.query("SELECT id FROM classes WHERE name = 'Class 7' LIMIT 1");
  const [class8Row] = await pool.query("SELECT id FROM classes WHERE name = 'Class 8' LIMIT 1");

  const prepAId = prepARow[0]?.id;
  const prepBId = prepBRow[0]?.id;
  const class1Id = class1Row[0]?.id;
  const class2Id = class2Row[0]?.id;
  const class3Id = class3Row[0]?.id;
  const class4Id = class4Row[0]?.id;
  const class5Id = class5Row[0]?.id;
  const class6Id = class6Row[0]?.id;
  const class7Id = class7Row[0]?.id;
  const class8Id = class8Row[0]?.id;

  // Re-map students if assigned to old legacy classes
  await pool.query("UPDATE students SET class_id = ? WHERE class_id IN (SELECT id FROM classes WHERE name LIKE 'Class %st')", [class1Id]);
  await pool.query("UPDATE students SET class_id = ? WHERE class_id IN (SELECT id FROM classes WHERE name LIKE 'Class %nd')", [class2Id]);
  await pool.query("UPDATE students SET class_id = ? WHERE class_id IN (SELECT id FROM classes WHERE name LIKE 'Class %rd') AND id IN (1, 2, 3)", [class8Id]);
  await pool.query("UPDATE students SET class_id = ? WHERE class_id IN (SELECT id FROM classes WHERE name LIKE 'Class %rd') AND id IN (4, 5)", [class7Id]);
  await pool.query("UPDATE students SET class_id = ? WHERE class_id IN (SELECT id FROM classes WHERE name LIKE 'Class %rd')", [class3Id]);
  await pool.query("UPDATE students SET class_id = ? WHERE class_id IN (SELECT id FROM classes WHERE name LIKE 'Class %th' AND name NOT LIKE 'Class 7%' AND name NOT LIKE 'Class 8%') AND id IN (10)", [class5Id]);

  // Ensure students have realistic classes
  await pool.query("UPDATE students SET class_id = ? WHERE id = 1", [class8Id]); // Alexander Wright in Class 8
  await pool.query("UPDATE students SET class_id = ? WHERE id = 2", [class8Id]); // Sophia Martinez in Class 8
  await pool.query("UPDATE students SET class_id = ? WHERE id = 3", [class7Id]); // Liam in Class 7
  await pool.query("UPDATE students SET class_id = ? WHERE id = 4", [class6Id]); // Emma in Class 6
  await pool.query("UPDATE students SET class_id = ? WHERE id = 5", [class5Id]); // Noah in Class 5
  await pool.query("UPDATE students SET class_id = ? WHERE id = 6", [class4Id]); // Olivia in Class 4
  await pool.query("UPDATE students SET class_id = ? WHERE id = 7", [class3Id]); // Ethan in Class 3
  await pool.query("UPDATE students SET class_id = ? WHERE id = 8", [class2Id]); // Mia in Class 2
  await pool.query("UPDATE students SET class_id = ? WHERE id = 9", [class1Id]); // Lucas in Class 1
  await pool.query("UPDATE students SET class_id = ? WHERE id = 10", [prepBId]); // Isabella in Prep B
  await pool.query("UPDATE students SET class_id = ? WHERE id = 11", [prepAId]); // Rafiq Ullah in Prep A

  // Clean out legacy classes
  await pool.query("DELETE FROM classes WHERE name LIKE '%st' OR name LIKE '%nd' OR name LIKE '%rd' OR name LIKE '%th' OR name LIKE 'Grade %'");

  // Update subjects to point to Class 8
  await pool.query("UPDATE subjects SET class_id = ? WHERE id BETWEEN 1 AND 5", [class8Id]);

  // 9. Principal Musharaf Khan & PT Sir
  let [prn] = await pool.query("SELECT id FROM teachers WHERE email = 'principal.musharaf@school.edu'");
  let prnId;
  if (prn.length === 0) {
    const [res] = await pool.query(`
      INSERT INTO teachers (
        employee_id, first_name, last_name, email, phone,
        subject_specialization, qualification, joining_date, salary, status, role_designation
      ) VALUES (
        'PRN-1001', 'Musharaf', 'Khan', 'principal.musharaf@school.edu', '+92 300-1234567',
        'Academic Leadership & Administration', 'M.Ed, M.Phil Educational Administration', '2018-01-10', 85000.00, 'Active', 'Principal'
      )
    `);
    prnId = res.insertId;
  } else {
    prnId = prn[0].id;
    await pool.query("UPDATE teachers SET role_designation = 'Principal', first_name = 'Musharaf', last_name = 'Khan', salary = 85000.00 WHERE id = ?", [prnId]);
  }

  // PT Sir
  let [pt] = await pool.query("SELECT id FROM teachers WHERE email = 'pt.tariq@school.edu'");
  let ptId;
  if (pt.length === 0) {
    const [res] = await pool.query(`
      INSERT INTO teachers (
        employee_id, first_name, last_name, email, phone,
        subject_specialization, qualification, joining_date, salary, status, role_designation
      ) VALUES (
        'PT-1002', 'Tariq', 'Mehmood (PT Sir)', 'pt.tariq@school.edu', '+92 312-9876543',
        'Physical Education, Sports & Assembly Drills', 'B.P.Ed (Physical Education)', '2019-03-15', 45000.00, 'Active', 'PT Instructor'
      )
    `);
    ptId = res.insertId;
  } else {
    ptId = pt[0].id;
    await pool.query("UPDATE teachers SET role_designation = 'PT Instructor', salary = 45000.00 WHERE id = ?", [ptId]);
  }

  // Update teacher 1 (David Miller) to manage Class 8
  await pool.query("UPDATE teachers SET assigned_class_id = ?, salary = 55000.00, role_designation = 'Class 8 Incharge / Math Teacher' WHERE id = 1", [class8Id]);
  await pool.query("UPDATE teachers SET assigned_class_id = ?, salary = 52000.00, role_designation = 'Class 7 Incharge / Science Teacher' WHERE id = 2", [class7Id]);
  await pool.query("UPDATE teachers SET assigned_class_id = ?, salary = 50000.00, role_designation = 'Class 6 Incharge / English Teacher' WHERE id = 3", [class6Id]);
  await pool.query("UPDATE teachers SET salary = 50000.00 WHERE id = 6");

  // 10. Seed Users for Auth
  const defaultUsers = [
    { username: 'admin', pass: 'admin123', role: 'admin', name: 'System Administrator', ref: null, classId: null },
    { username: 'principal', pass: 'principal123', role: 'principal', name: 'Principal Musharaf Khan', ref: prnId, classId: null },
    { username: 'musharaf', pass: 'musharaf123', role: 'principal', name: 'Principal Musharaf Khan', ref: prnId, classId: null },
    { username: 'teacher', pass: 'teacher123', role: 'teacher', name: 'David Miller (Class 8)', ref: 1, classId: class8Id },
    { username: 'ptsir', pass: 'ptsir123', role: 'teacher', name: 'Tariq Mehmood (PT Sir)', ref: ptId, classId: null },
    { username: 'student', pass: 'student123', role: 'student', name: 'Alexander Wright (Class 8)', ref: 1, classId: class8Id }
  ];

  for (const u of defaultUsers) {
    const [uExist] = await pool.query('SELECT id FROM users WHERE username = ?', [u.username]);
    if (uExist.length === 0) {
      await pool.query('INSERT INTO users (username, password, role, display_name, ref_id, managed_class_id) VALUES (?, ?, ?, ?, ?, ?)', [
        u.username, u.pass, u.role, u.name, u.ref, u.classId
      ]);
    } else {
      await pool.query('UPDATE users SET password = ?, role = ?, display_name = ?, ref_id = ?, managed_class_id = ? WHERE id = ?', [
        u.pass, u.role, u.name, u.ref, u.classId, uExist[0].id
      ]);
    }
  }

  // 11. Seed Principal Meetings
  const [meetingCount] = await pool.query('SELECT COUNT(*) as cnt FROM meetings');
  if (meetingCount[0].cnt === 0) {
    await pool.query(`
      INSERT INTO meetings (title, agenda, meeting_date, meeting_time, venue, attendees, status, arranged_by) VALUES
      ('Monthly Academic & Syllabus Review', 'Review curriculum progress for Prep through Class 8, discuss upcoming mid-term exam schedule and student discipline.', CURDATE() + INTERVAL 2 DAY, '10:30 AM', 'Principal Conference Room', 'All Teachers', 'Scheduled', 'Principal Musharaf Khan'),
      ('Parent-Teacher Advisory Council', 'Address student attendance, academic improvement plans, and PKR fee collection schedules.', CURDATE() + INTERVAL 5 DAY, '11:00 AM', 'Main School Auditorium', 'Parents & Faculty', 'Scheduled', 'Principal Musharaf Khan'),
      ('Morning Assembly & Drill Enhancement', 'Coordination with PT Sir Tariq Mehmood regarding weekly physical exercises and national anthem discipline.', CURDATE() - INTERVAL 3 DAY, '09:00 AM', 'Principal Office', 'PT Instructor & Discipline Committee', 'Completed', 'Principal Musharaf Khan')
    `);
  }

  // 12. Seed School Rules
  const [rulesCount] = await pool.query('SELECT COUNT(*) as cnt FROM school_rules');
  if (rulesCount[0].cnt === 0) {
    await pool.query(`
      INSERT INTO school_rules (title, category, description, penalty_or_note, approved_by) VALUES
      ('Morning Assembly & Punctuality', 'General Conduct', 'All students and teachers must assemble in the ground promptly at 7:45 AM. PT Sir will lead drill exercises and national anthem.', 'Latecomers must report to Discipline Incharge', 'Principal Musharaf Khan'),
      ('Approved School Uniform Code', 'Dress Code', 'Students must wear neat, pressed uniform with school badge and polished black shoes. PT uniform on designated exercise days.', 'Uniform inspection held every morning during assembly', 'Principal Musharaf Khan'),
      ('Tuition Fee Submission Policy', 'Fee Policy', 'School fees are tiered from Prep (PKR 450) up to Class 8 (PKR 900 max). Due date is the 10th of every calendar month in PKR.', 'Late fee surcharge of PKR 50 applies after due date', 'Principal Musharaf Khan'),
      ('Classroom & Examination Integrity', 'Examinations', 'Strict zero tolerance towards copying, cheating, or whispering during class tests and term examinations.', 'Paper cancellation and guardian call for severe infractions', 'Principal Musharaf Khan'),
      ('Prohibition of Unauthorized Devices', 'Discipline', 'Mobile phones, electronic gadgets, and non-academic items are strictly prohibited inside classrooms.', 'Devices will be confiscated and returned only to parents', 'Principal Musharaf Khan')
    `);
  }

  // 13. Seed Assembly Schedule
  const [assemblyCount] = await pool.query('SELECT COUNT(*) as cnt FROM assembly_schedules');
  if (assemblyCount[0].cnt === 0) {
    await pool.query(`
      INSERT INTO assembly_schedules (assembly_date, pt_sir_name, tilawat_student, naat_student, speech_topic, drill_activity, special_announcement, discipline_rating) VALUES
      (CURDATE(), 'Tariq Mehmood (PT Sir)', 'Muhammad Bilal (Class 8)', 'Ahmad Raza (Class 7)', 'The Role of Physical Fitness and Discipline in Student Life', 'Jumping Jacks, Arm Rotations, March-Past in Sections', 'Mid-Term Exam Date Sheet announced by Principal Musharaf Khan', 'Outstanding'),
      (CURDATE() - INTERVAL 1 DAY, 'Tariq Mehmood (PT Sir)', 'Usman Tariq (Class 6)', 'Hamza Khan (Class 5)', 'Respect for Teachers and School Property', 'Morning Calisthenics & Deep Breathing Exercises', 'Inter-class Cricket Tournament begins this Friday', 'Excellent')
    `);
  }

  // 14. Seed Assignments & Tests
  const [assignCount] = await pool.query('SELECT COUNT(*) as cnt FROM assignments_tests');
  if (assignCount[0].cnt === 0) {
    await pool.query(`
      INSERT INTO assignments_tests (class_id, teacher_id, subject_name, title, test_topic, test_date, submission_date, total_marks, type, instructions) VALUES
      (?, 1, 'Mathematics', 'Linear Equations Test', 'Chapter 4: Linear Equations & Graphs', CURDATE() + INTERVAL 3 DAY, NULL, 25.00, 'Test', 'Bring geometry box and scientific calculators.'),
      (?, 1, 'Mathematics', 'Algebra Homework Assignment', 'Exercise 3.2: Factorization Problem Set', CURDATE() + INTERVAL 1 DAY, CURDATE() + INTERVAL 4 DAY, 15.00, 'Assignment', 'Complete all questions neatly in mathematics homework notebook.')
    `, [class8Id, class8Id]);
  }

  // 15. Update existing fees to sequential PKR
  // Student 1 (Class 8) = 900 PKR
  // Student 2 (Class 8) = 900 PKR
  // Student 3 (Class 7) = 850 PKR
  // Student 4 (Class 6) = 800 PKR
  // Student 5 (Class 5) = 750 PKR
  // Student 6 (Class 4) = 700 PKR
  // Student 7 (Class 3) = 650 PKR
  // Student 8 (Class 2) = 600 PKR
  // Student 9 (Class 1) = 550 PKR
  // Student 10 (Prep B) = 500 PKR
  // Student 11 (Prep A) = 450 PKR
  await pool.query("UPDATE fees SET amount = 900.00 WHERE student_id IN (1, 2)");
  await pool.query("UPDATE fees SET amount = 850.00 WHERE student_id = 3");
  await pool.query("UPDATE fees SET amount = 800.00 WHERE student_id = 4");
  await pool.query("UPDATE fees SET amount = 750.00 WHERE student_id = 5");
  await pool.query("UPDATE fees SET amount = 700.00 WHERE student_id = 6");

  // Ensure fees exist for other students too
  const [f7] = await pool.query("SELECT id FROM fees WHERE student_id = 7");
  if (f7.length === 0) {
    await pool.query("INSERT INTO fees (invoice_no, student_id, title, amount, due_date, status) VALUES ('INV-2026-007', 7, 'Tuition Fee - Monthly', 650.00, '2026-11-10', 'Paid')");
  }
  const [f11] = await pool.query("SELECT id FROM fees WHERE student_id = 11");
  if (f11.length === 0) {
    await pool.query("INSERT INTO fees (invoice_no, student_id, title, amount, due_date, status) VALUES ('INV-2026-011', 11, 'Tuition Fee - Monthly', 450.00, '2026-11-10', 'Pending')");
  }

  const [classes] = await pool.query("SELECT id, name, section, monthly_fee FROM classes ORDER BY monthly_fee ASC");
  console.log('Final Classes & Sequential Fees (PKR):');
  classes.forEach(c => {
    console.log(` - [ID ${c.id}] ${c.name} (${c.section}) => Monthly Fee: PKR ${c.monthly_fee}`);
  });

  await pool.end();
  console.log('Database upgrade completed cleanly!');
}

run().catch(e => {
  console.error('Migration error:', e);
  process.exit(1);
});
