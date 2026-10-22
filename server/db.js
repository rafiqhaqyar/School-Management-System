const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH 
  ? path.resolve(__dirname, '..', process.env.DB_PATH)
  : path.join(dataDir, 'school.db');

const db = new Database(dbPath);

// Enable WAL mode for high concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database schema
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      section TEXT NOT NULL,
      room_number TEXT,
      capacity INTEGER DEFAULT 40,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(name, section)
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      subject_specialization TEXT,
      qualification TEXT,
      joining_date DATE,
      salary REAL,
      status TEXT CHECK(status IN ('Active', 'On Leave', 'Inactive')) DEFAULT 'Active',
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      class_id INTEGER,
      teacher_id INTEGER,
      FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE SET NULL,
      FOREIGN KEY(teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admission_no TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
      dob DATE,
      class_id INTEGER,
      roll_no TEXT,
      parent_name TEXT,
      parent_phone TEXT,
      parent_email TEXT,
      address TEXT,
      status TEXT CHECK(status IN ('Active', 'Graduated', 'Suspended', 'Transferred')) DEFAULT 'Active',
      admission_date DATE,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date DATE NOT NULL,
      status TEXT CHECK(status IN ('Present', 'Absent', 'Late', 'Excused')) DEFAULT 'Present',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, date),
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      term TEXT NOT NULL,
      session_year TEXT NOT NULL,
      start_date DATE,
      end_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      exam_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      marks_obtained REAL NOT NULL,
      max_marks REAL DEFAULT 100,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, exam_id, subject_id),
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE,
      FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no TEXT UNIQUE NOT NULL,
      student_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date DATE NOT NULL,
      status TEXT CHECK(status IN ('Paid', 'Pending', 'Overdue')) DEFAULT 'Pending',
      paid_date DATE,
      payment_method TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      audience TEXT CHECK(audience IN ('All', 'Students', 'Teachers', 'Parents')) DEFAULT 'All',
      priority TEXT CHECK(priority IN ('Normal', 'Important', 'Urgent')) DEFAULT 'Normal',
      date DATE DEFAULT (DATE('now')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if data already exists, if not, seed realistic demonstration records
  const classCount = db.prepare('SELECT COUNT(*) as count FROM classes').get().count;
  if (classCount === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  const insertClass = db.prepare('INSERT INTO classes (name, section, room_number, capacity) VALUES (?, ?, ?, ?)');
  const c1 = insertClass.run('Grade 9', 'A', 'Room 101', 35).lastInsertRowid;
  const c2 = insertClass.run('Grade 9', 'B', 'Room 102', 35).lastInsertRowid;
  const c3 = insertClass.run('Grade 10', 'A', 'Room 201', 35).lastInsertRowid;
  const c4 = insertClass.run('Grade 10', 'B', 'Room 202', 35).lastInsertRowid;
  const c5 = insertClass.run('Grade 11 - Science', 'A', 'Lab 301', 30).lastInsertRowid;
  const c6 = insertClass.run('Grade 12 - Science', 'A', 'Lab 302', 30).lastInsertRowid;

  const insertTeacher = db.prepare(`
    INSERT INTO teachers (employee_id, first_name, last_name, email, phone, subject_specialization, qualification, joining_date, salary, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const t1 = insertTeacher.run('TCH-1001', 'David', 'Miller', 'david.miller@school.edu', '+1 555-0101', 'Mathematics', 'M.Sc Mathematics', '2021-08-15', 54000, 'Active').lastInsertRowid;
  const t2 = insertTeacher.run('TCH-1002', 'Sarah', 'Jenkins', 'sarah.j@school.edu', '+1 555-0102', 'Physics', 'Ph.D Physics', '2020-03-10', 58000, 'Active').lastInsertRowid;
  const t3 = insertTeacher.run('TCH-1003', 'Robert', 'Alvarez', 'robert.a@school.edu', '+1 555-0103', 'English Literature', 'M.A English', '2019-09-01', 52000, 'Active').lastInsertRowid;
  const t4 = insertTeacher.run('TCH-1004', 'Elena', 'Rostova', 'elena.r@school.edu', '+1 555-0104', 'Computer Science', 'M.S Computer Science', '2022-01-15', 62000, 'Active').lastInsertRowid;
  const t5 = insertTeacher.run('TCH-1005', 'Marcus', 'Chen', 'marcus.chen@school.edu', '+1 555-0105', 'Chemistry', 'M.Sc Chemistry', '2023-08-20', 51000, 'Active').lastInsertRowid;

  const insertSubject = db.prepare('INSERT INTO subjects (code, name, class_id, teacher_id) VALUES (?, ?, ?, ?)');
  const sub1 = insertSubject.run('MATH-10', 'Advanced Mathematics', c3, t1).lastInsertRowid;
  const sub2 = insertSubject.run('PHY-10', 'General Physics', c3, t2).lastInsertRowid;
  const sub3 = insertSubject.run('ENG-10', 'World Literature', c3, t3).lastInsertRowid;
  const sub4 = insertSubject.run('CS-10', 'Computer Programming', c3, t4).lastInsertRowid;
  const sub5 = insertSubject.run('CHEM-10', 'Introductory Chemistry', c3, t5).lastInsertRowid;

  const insertStudent = db.prepare(`
    INSERT INTO students (admission_no, first_name, last_name, gender, dob, class_id, roll_no, parent_name, parent_phone, parent_email, address, status, admission_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const studentsData = [
    ['ADM-2024-001', 'Alexander', 'Wright', 'Male', '2008-05-14', c3, '10A-01', 'Thomas Wright', '+1 555-0201', 't.wright@mail.com', '742 Evergreen Terrace, Springfield', 'Active', '2023-09-01'],
    ['ADM-2024-002', 'Sophia', 'Martinez', 'Female', '2008-09-22', c3, '10A-02', 'Carlos Martinez', '+1 555-0202', 'carlos.m@mail.com', '124 Conch Street, Riverdale', 'Active', '2023-09-01'],
    ['ADM-2024-003', 'Liam', 'Johnson', 'Male', '2008-11-03', c3, '10A-03', 'Karen Johnson', '+1 555-0203', 'karen.j@mail.com', '43 Oakwood Avenue, Brookline', 'Active', '2023-09-01'],
    ['ADM-2024-004', 'Emma', 'Watson', 'Female', '2008-04-18', c3, '10A-04', 'George Watson', '+1 555-0204', 'g.watson@mail.com', '98 Baker Street, Londonway', 'Active', '2023-09-01'],
    ['ADM-2024-005', 'Noah', 'Patel', 'Male', '2008-07-30', c3, '10A-05', 'Amit Patel', '+1 555-0205', 'amit.patel@mail.com', '15 Maple Lane, Sunnyvale', 'Active', '2023-09-01'],
    ['ADM-2024-006', 'Olivia', 'Kim', 'Female', '2008-02-11', c3, '10A-06', 'Sun-Woo Kim', '+1 555-0206', 'sw.kim@mail.com', '512 Pinecrest Blvd, Cambridge', 'Active', '2023-09-01'],
    ['ADM-2024-007', 'Ethan', 'Brooks', 'Male', '2008-12-05', c3, '10A-07', 'Diana Brooks', '+1 555-0207', 'dbrooks@mail.com', '88 High Street, Oxford', 'Active', '2023-09-01'],
    ['ADM-2024-008', 'Mia', 'Gomez', 'Female', '2008-08-19', c3, '10A-08', 'Luis Gomez', '+1 555-0208', 'lgomez@mail.com', '33 Sunset Blvd, Pasadena', 'Active', '2023-09-01'],
    ['ADM-2024-009', 'Lucas', 'Silva', 'Male', '2009-01-15', c1, '9A-01', 'Mateo Silva', '+1 555-0209', 'msilva@mail.com', '19 Horizon Way, Austin', 'Active', '2024-09-01'],
    ['ADM-2024-010', 'Isabella', 'Rossi', 'Female', '2007-06-25', c5, '11A-01', 'Marco Rossi', '+1 555-0210', 'mrossi@mail.com', '702 Cedar Drive, Seattle', 'Active', '2022-09-01']
  ];

  const studentIds = [];
  for (const s of studentsData) {
    const res = insertStudent.run(...s);
    studentIds.push(res.lastInsertRowid);
  }

  // Seed Attendance for recent days
  const insertAtt = db.prepare('INSERT OR IGNORE INTO attendance (student_id, date, status, notes) VALUES (?, ?, ?, ?)');
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    for (let j = 0; j < studentIds.length; j++) {
      const sid = studentIds[j];
      let status = 'Present';
      if ((j + i) % 9 === 0) status = 'Absent';
      else if ((j + i) % 7 === 0) status = 'Late';
      insertAtt.run(sid, dateStr, status, status === 'Late' ? 'Traffic delay' : null);
    }
  }

  // Seed Exams and Marks
  const insertExam = db.prepare('INSERT INTO exams (name, term, session_year, start_date, end_date) VALUES (?, ?, ?, ?, ?)');
  const examId = insertExam.run('Mid-Term Examinations 2026', 'Term 1', '2025-2026', '2026-03-10', '2026-03-24').lastInsertRowid;

  const insertMark = db.prepare('INSERT INTO marks (student_id, exam_id, subject_id, marks_obtained, max_marks, remarks) VALUES (?, ?, ?, ?, ?, ?)');
  const sampleScores = [
    [studentIds[0], examId, sub1, 92, 100, 'Outstanding analytical ability'],
    [studentIds[0], examId, sub2, 88, 100, 'Excellent lab work'],
    [studentIds[0], examId, sub3, 85, 100, 'Very good essay structure'],
    [studentIds[0], examId, sub4, 96, 100, 'Exceptional coding logic'],
    [studentIds[1], examId, sub1, 89, 100, 'Great problem solving'],
    [studentIds[1], examId, sub2, 94, 100, 'Top physics scorer'],
    [studentIds[1], examId, sub3, 91, 100, 'Fluent and articulate'],
    [studentIds[1], examId, sub4, 88, 100, 'Good project demonstration'],
    [studentIds[2], examId, sub1, 74, 100, 'Consistent effort'],
    [studentIds[2], examId, sub2, 79, 100, 'Solid understanding of concepts'],
    [studentIds[3], examId, sub1, 95, 100, 'Flawless math calculations'],
    [studentIds[4], examId, sub1, 82, 100, 'Active participation']
  ];
  for (const m of sampleScores) {
    insertMark.run(...m);
  }

  // Seed Fees
  const insertFee = db.prepare(`
    INSERT INTO fees (invoice_no, student_id, title, amount, due_date, status, paid_date, payment_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertFee.run('INV-2026-001', studentIds[0], 'Tuition Fee - Q1 2026', 1250, '2026-01-31', 'Paid', '2026-01-20', 'Bank Transfer');
  insertFee.run('INV-2026-002', studentIds[1], 'Tuition Fee - Q1 2026', 1250, '2026-01-31', 'Paid', '2026-01-18', 'Credit Card');
  insertFee.run('INV-2026-003', studentIds[2], 'Tuition Fee - Q1 2026', 1250, '2026-01-31', 'Pending', null, null);
  insertFee.run('INV-2026-004', studentIds[3], 'Tuition Fee - Q1 2026', 1250, '2026-01-31', 'Paid', '2026-01-25', 'Online Portal');
  insertFee.run('INV-2026-005', studentIds[4], 'Tuition Fee - Q1 2026', 1250, '2026-02-15', 'Overdue', null, null);
  insertFee.run('INV-2026-006', studentIds[5], 'Tuition Fee - Q1 2026', 1250, '2026-01-31', 'Paid', '2026-01-22', 'Bank Transfer');

  // Seed Notices
  const insertNotice = db.prepare('INSERT INTO notices (title, content, audience, priority, date) VALUES (?, ?, ?, ?, ?)');
  insertNotice.run(
    'Annual Science & Innovation Fair 2026',
    'We are delighted to announce that our Annual Science Fair will be hosted on November 14th in the main auditorium. Students are encouraged to submit project proposals by next Friday.',
    'All',
    'Important',
    '2026-10-20'
  );
  insertNotice.run(
    'Parent-Teacher Conference Scheduled',
    'First term Parent-Teacher consultations will occur this Saturday from 9:00 AM to 3:00 PM. Appointment booking is available via the parent portal.',
    'Parents',
    'Urgent',
    '2026-10-22'
  );
  insertNotice.run(
    'Curriculum Workshop for Faculty',
    'Mandatory professional development workshop on STEM integration on Friday afternoon at 2:00 PM in Conference Room A.',
    'Teachers',
    'Normal',
    '2026-10-18'
  );
}

initSchema();

module.exports = db;
