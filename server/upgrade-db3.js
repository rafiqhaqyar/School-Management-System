const db = require('./db');

async function upgrade() {
  console.log('🔄 Applying DB migrations for Logo Upload, Teacher Workload, and Class Capacity...');

  try {
    // 1. Add logo_url to school_settings if not present
    const settingsCols = await db.all('DESCRIBE school_settings');
    const hasLogoUrl = settingsCols.some(c => c.Field === 'logo_url');
    if (!hasLogoUrl) {
      await db.run('ALTER TABLE school_settings ADD COLUMN logo_url VARCHAR(255) DEFAULT NULL');
      console.log('✅ Added logo_url column to school_settings');
    }

    // 2. Add due_classes and completed_classes to teachers if not present
    const teacherCols = await db.all('DESCRIBE teachers');
    const hasDueClasses = teacherCols.some(c => c.Field === 'due_classes');
    if (!hasDueClasses) {
      await db.run('ALTER TABLE teachers ADD COLUMN due_classes INT DEFAULT 24');
      await db.run('ALTER TABLE teachers ADD COLUMN completed_classes INT DEFAULT 18');
      console.log('✅ Added due_classes and completed_classes to teachers');
    }

    // Update teacher periods with sensible realistic defaults
    await db.run('UPDATE teachers SET due_classes = 24, completed_classes = 18 WHERE due_classes IS NULL OR due_classes = 0');
    // Principal Musharaf Khan: Executive oversight (0 due teaching periods, or administrative)
    await db.run("UPDATE teachers SET due_classes = 12, completed_classes = 10 WHERE role_designation = 'Principal'");
    // PT Sir Tariq Mehmood: Daily drill + sports sessions
    await db.run("UPDATE teachers SET due_classes = 20, completed_classes = 16 WHERE role_designation = 'PT Instructor'");

    // 3. Update class capacities to 100 as requested
    await db.run('UPDATE classes SET capacity = 100 WHERE capacity < 100');
    console.log('✅ Updated class capacities to 100');

    // 4. Verify school_settings data
    const settings = await db.get('SELECT * FROM school_settings WHERE id = 1');
    if (!settings) {
      await db.run(`
        INSERT INTO school_settings (
          id, school_name, tagline, logo_icon, phone, email, address,
          sports_week_date, recess_break_minutes, recess_break_label,
          developer_name, developer_phone, developer_email
        ) VALUES (
          1, 'EduPulse Academy', 'Excellence in Academic and Character Development',
          '🎓', '+92 322-9594616', 'rafiqhaqyar524@gmail.com', 'Bajaur / Main Campus',
          'Nov 18 - Nov 24, 2026', 30, '30-Minute Break (Tea & Student Rest)',
          'Rafiq Haqyar', '923229594616', 'rafiqhaqyar524@gmail.com'
        )
      `);
      console.log('✅ Seeded default school_settings');
    }

    console.log('🎉 DB Upgrade 3 complete!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit(0);
  }
}

upgrade();

