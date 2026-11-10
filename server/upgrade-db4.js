const db = require('./db');

async function upgrade() {
  console.log('🔄 Creating assignment_submissions table...');
  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        assignment_id INT NOT NULL,
        student_id INT NOT NULL,
        teacher_id INT NOT NULL,
        submission_title VARCHAR(255) NOT NULL,
        submission_content TEXT NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'Submitted',
        teacher_feedback TEXT DEFAULT NULL,
        grade_score VARCHAR(50) DEFAULT NULL,
        FOREIGN KEY (assignment_id) REFERENCES assignments_tests(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created assignment_submissions table successfully!');
  } catch (err) {
    console.error('Error creating assignment_submissions table:', err);
  } finally {
    process.exit(0);
  }
}

upgrade();

