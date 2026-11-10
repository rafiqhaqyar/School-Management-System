const db = require('./db');

async function upgrade() {
  try {
    console.log('--- Upgrading Database for Password Recovery & Security ---');
    const cols = await db.all('DESCRIBE users');
    const fieldNames = cols.map(c => c.Field);

    if (!fieldNames.includes('email')) {
      await db.run('ALTER TABLE users ADD COLUMN email VARCHAR(150) NULL');
      console.log('✓ Added `email` column to users table');
    }
    if (!fieldNames.includes('phone')) {
      await db.run('ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL');
      console.log('✓ Added `phone` column to users table');
    }
    if (!fieldNames.includes('secret_word')) {
      await db.run("ALTER TABLE users ADD COLUMN secret_word VARCHAR(100) NULL DEFAULT 'pakistan'");
      console.log('✓ Added `secret_word` column to users table');
    }

    // Populate recovery data for legacy demo accounts without replacing custom values.
    await db.run("UPDATE users SET email = COALESCE(NULLIF(email, ''), 'rafiqhaqyar524@gmail.com'), phone = COALESCE(NULLIF(phone, ''), '+92 322-9594616'), secret_word = CASE WHEN secret_word IS NULL OR secret_word = '' OR secret_word = 'pakistan' THEN 'admin' ELSE secret_word END WHERE username = 'admin'");
    await db.run("UPDATE users SET email = COALESCE(NULLIF(email, ''), 'musharaf@school.edu.pk'), phone = COALESCE(NULLIF(phone, ''), '+92 300-1234567'), secret_word = CASE WHEN secret_word IS NULL OR secret_word = '' OR secret_word = 'pakistan' THEN 'principal' ELSE secret_word END WHERE username IN ('principal', 'musharaf')");
    await db.run("UPDATE users SET email = COALESCE(NULLIF(email, ''), 'david.miller@school.edu.pk'), phone = COALESCE(NULLIF(phone, ''), '+92 333-5550201'), secret_word = CASE WHEN secret_word IS NULL OR secret_word = '' OR secret_word = 'pakistan' THEN 'teacher' ELSE secret_word END WHERE username = 'teacher'");
    await db.run("UPDATE users SET email = COALESCE(NULLIF(email, ''), 'tariq.pt@school.edu.pk'), phone = COALESCE(NULLIF(phone, ''), '+92 333-8889999'), secret_word = CASE WHEN secret_word IS NULL OR secret_word = '' OR secret_word = 'pakistan' THEN 'ptsir' ELSE secret_word END WHERE username = 'ptsir'");
    await db.run("UPDATE users SET email = COALESCE(NULLIF(email, ''), 'alexander@student.school.edu.pk'), phone = COALESCE(NULLIF(phone, ''), '+1 555-0201'), secret_word = CASE WHEN secret_word IS NULL OR secret_word = '' OR secret_word = 'pakistan' THEN 'student' ELSE secret_word END WHERE username = 'student'");

    console.log('✓ Recovery fields are ready for available demo accounts.');
    console.log('--- Upgrade DB5 Completed Successfully ---');
    process.exit(0);
  } catch (err) {
    console.error('Upgrade DB5 Error:', err);
    process.exit(1);
  }
}

upgrade();
