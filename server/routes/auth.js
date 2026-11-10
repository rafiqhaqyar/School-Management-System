const express = require('express');
const router = express.Router();
const db = require('../db');

// In-memory brute-force prevention and failed attempt tracker
// Key: IP::username, Value: { attempts: number, lockoutUntil: number, streak: number }
const loginAttemptStore = new Map();

function getClientKey(req, username) {
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
  const user = (username || '').trim().toLowerCase();
  return `${ip}::${user || 'unknown'}`;
}

function normalizeRecoveryPhone(value) {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.startsWith('0092')) return digits.slice(2);
  if (digits.startsWith('0')) return `92${digits.slice(1)}`;
  return digits;
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const clientKey = getClientKey(req, username);
    const now = Date.now();
    let tracker = loginAttemptStore.get(clientKey);

    // Check if the user is currently locked out
    if (tracker && tracker.lockoutUntil) {
      if (tracker.lockoutUntil > now) {
        const remainingSeconds = Math.ceil((tracker.lockoutUntil - now) / 1000);
        const lockDurationName = (tracker.streak > 1) ? '5 minutes' : '1 minute';
        return res.status(429).json({
          error: `Too many failed login attempts (5/5). Account locked for ${lockDurationName}. Please wait ${remainingSeconds}s before trying again.`,
          locked: true,
          remainingSeconds,
          streak: tracker.streak || 1,
          attempts: tracker.attempts || 5,
          maxAttempts: 5
        });
      } else {
        // Lockout expired: reset attempts counter for next 5 attempts
        tracker.lockoutUntil = null;
        tracker.attempts = 0;
        loginAttemptStore.set(clientKey, tracker);
      }
    }

    const user = await db.get('SELECT * FROM users WHERE username = ?', [username.trim()]);
    
    // Check credentials
    if (!user || user.password !== password) {
      if (!tracker) {
        tracker = { attempts: 0, lockoutUntil: null, streak: 0 };
      }
      tracker.attempts = (tracker.attempts || 0) + 1;

      // 5 Failed Attempts Threshold reached!
      if (tracker.attempts >= 5) {
        tracker.streak = (tracker.streak || 0) + 1;
        // 1st lockout: 1 minute (60s). 2nd+ consecutive lockout: 5 minutes (300s)
        const lockSeconds = tracker.streak === 1 ? 60 : 300;
        tracker.lockoutUntil = now + (lockSeconds * 1000);
        loginAttemptStore.set(clientKey, tracker);

        const lockTimeDesc = lockSeconds === 60 ? '1 minute' : '5 minutes';
        return res.status(429).json({
          error: `Too many failed attempts (5/5). You are locked out for ${lockTimeDesc}. Name and password entry is not allowed until timer finishes.`,
          locked: true,
          remainingSeconds: lockSeconds,
          streak: tracker.streak,
          attempts: 5,
          maxAttempts: 5
        });
      } else {
        loginAttemptStore.set(clientKey, tracker);
        const remaining = 5 - tracker.attempts;
        return res.status(401).json({
          error: `Incorrect username or password. Please try again. (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`,
          attempts: tracker.attempts,
          remainingAttempts: remaining,
          maxAttempts: 5
        });
      }
    }

    // Credentials are correct: reset the failed attempt tracker
    loginAttemptStore.delete(clientKey);

    // Enriched user details based on role
    let extra = {};
    if (user.role === 'teacher') {
      const teacher = await db.get(`
        SELECT t.*, c.name as class_name, c.section as class_section
        FROM teachers t
        LEFT JOIN classes c ON t.assigned_class_id = c.id
        WHERE t.id = ?
      `, [user.ref_id]);
      if (teacher) {
        extra = {
          teacherId: teacher.id,
          employeeId: teacher.employee_id,
          managedClassId: teacher.assigned_class_id || user.managed_class_id,
          managedClassName: teacher.class_name ? `${teacher.class_name} (${teacher.class_section})` : null,
          designation: teacher.role_designation || 'Teacher'
        };
      }
    } else if (user.role === 'student') {
      const student = await db.get(`
        SELECT s.*, c.name as class_name, c.section as class_section, c.monthly_fee
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.id = ?
      `, [user.ref_id]);
      if (student) {
        extra = {
          studentId: student.id,
          admissionNo: student.admission_no,
          classId: student.class_id,
          className: student.class_name ? `${student.class_name} (${student.class_section})` : null,
          rollNo: student.roll_no,
          monthlyFee: student.monthly_fee,
          parentPhone: student.parent_phone
        };
      }
    } else if (user.role === 'principal') {
      extra = {
        title: 'School Principal',
        fullName: 'Principal Musharaf Khan',
        authorities: ['Manage Meetings', 'School Rules & Policies', 'Academic Oversight', 'Morning Assembly Inspection']
      };
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        displayName: user.display_name,
        managedClassId: user.managed_class_id || extra.managedClassId || null,
        ...extra
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register - Register new student, teacher, or user account
router.post('/register', async (req, res) => {
  try {
    const {
      username,
      password,
      role = 'student',
      fullName,
      // For student:
      classId,
      parentName,
      parentPhone,
      gender = 'Male',
      // For teacher:
      subjectSpecialization,
      phone,
      qualification,
      designation
    } = req.body;

    if (!username || !password || !fullName) {
      return res.status(400).json({ error: 'Username, password, and full name are required' });
    }

    const cleanUsername = username.trim();
    const existing = await db.get('SELECT id FROM users WHERE username = ?', [cleanUsername]);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists. Please choose a different username.' });
    }

    let refId = null;
    let managedClassId = null;

    if (role === 'student') {
      if (!parentPhone) {
        return res.status(400).json({ error: "Father's contact number is mandatory for student registration." });
      }
      const targetClassId = classId || 16; // default Class 8 if not provided

      // Calculate sequential roll number within this class
      const maxRoll = await db.get('SELECT MAX(roll_no) as max_roll FROM students WHERE class_id = ?', [targetClassId]);
      const nextRoll = (maxRoll && maxRoll.max_roll) ? (parseInt(maxRoll.max_roll) + 1) : 1;
      const admissionNo = `ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const parts = fullName.trim().split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ') || 'Student';

      const studentRes = await db.run(`
        INSERT INTO students (
          admission_no, first_name, last_name, gender,
          class_id, roll_no, parent_name, parent_phone,
          status, admission_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active', CURDATE())
      `, [
        admissionNo, firstName, lastName, gender,
        targetClassId, nextRoll, parentName || 'Father', parentPhone
      ]);

      refId = studentRes.lastInsertRowid;
      managedClassId = targetClassId;

    } else if (role === 'teacher') {
      const empId = `TCH-${Math.floor(1000 + Math.random() * 9000)}`;
      const parts = fullName.trim().split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ') || 'Teacher';
      const desig = designation || 'Teacher';

      const teacherRes = await db.run(`
        INSERT INTO teachers (
          employee_id, first_name, last_name, email, phone,
          subject_specialization, qualification, salary, status,
          role_designation, assigned_class_id, due_classes, completed_classes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 50000, 'Active', ?, ?, 24, 0)
      `, [
        empId, firstName, lastName, `${cleanUsername}@school.edu.pk`,
        phone || null, subjectSpecialization || 'General',
        qualification || 'B.Ed / M.Sc', desig, classId || null
      ]);

      const userEmail = email ? email.trim() : (phone || null);
      refId = teacherRes.lastInsertRowid;
      managedClassId = classId || null;
    }

    const regEmail = (email || (role === 'teacher' ? `${cleanUsername}@school.edu.pk` : null));
    const regPhone = (phone || parentPhone || null);
    const regSecret = (secretWord || 'pakistan').trim();

    const userRes = await db.run(`
      INSERT INTO users (username, password, role, display_name, email, phone, secret_word, ref_id, managed_class_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      cleanUsername, password.trim(), role, fullName.trim(), regEmail, regPhone, regSecret, refId, managedClassId
    ]);

    const newUser = await db.get('SELECT id, username, role, display_name, managed_class_id FROM users WHERE id = ?', [userRes.lastInsertRowid]);

    res.status(201).json({
      success: true,
      message: `Account registered successfully! You can now log in as ${cleanUsername}.`,
      user: newUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/forgot-password - Recover & Reset Password via Gmail, Mobile, or Secret Word
router.post('/forgot-password', async (req, res) => {
  try {
    const { username, method, verification_value, new_password } = req.body;

    if (!username || !method || !verification_value || !new_password) {
      return res.status(400).json({ error: 'Username, verification method, confirmation value, and new password are required' });
    }

    if (new_password.trim().length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters long' });
    }

    const cleanUser = username.trim();
    const user = await db.get('SELECT * FROM users WHERE username = ?', [cleanUser]);
    if (!user) {
      return res.status(404).json({ error: `Account with username "${cleanUser}" was not found.` });
    }

    // Retrieve full linked info if student or teacher
    let linkedStudent = null;
    let linkedTeacher = null;
    if (user.role === 'student' && user.ref_id) {
      linkedStudent = await db.get('SELECT * FROM students WHERE id = ?', [user.ref_id]);
    } else if (user.role === 'teacher' && user.ref_id) {
      linkedTeacher = await db.get('SELECT * FROM teachers WHERE id = ?', [user.ref_id]);
    }

    let isMatch = false;
    let methodLabel = '';

    if (method === 'email') {
      methodLabel = 'Gmail / Email Address';
      const inputEmail = verification_value.trim().toLowerCase();
      const possibleEmails = [
        (user.email || '').trim().toLowerCase(),
        (linkedTeacher?.email || '').trim().toLowerCase(),
        (linkedStudent?.parent_email || '').trim().toLowerCase()
      ].filter(Boolean);

      isMatch = possibleEmails.some(email => email === inputEmail);
    } else if (method === 'phone') {
      methodLabel = 'Mobile Phone Number';
      const inputPhoneNorm = normalizeRecoveryPhone(verification_value);

      const possiblePhones = [
        normalizeRecoveryPhone(user.phone),
        normalizeRecoveryPhone(linkedTeacher?.phone),
        normalizeRecoveryPhone(linkedStudent?.parent_phone)
      ].filter(Boolean);

      isMatch = inputPhoneNorm.length >= 7 && possiblePhones.some(phone => phone === inputPhoneNorm);
    } else if (method === 'secret_word') {
      methodLabel = 'Secret Security Word';
      const inputWord = verification_value.trim().toLowerCase();
      const storedWord = (user.secret_word || '').trim().toLowerCase();
      isMatch = Boolean(storedWord) && inputWord === storedWord;
    } else {
      return res.status(400).json({ error: 'Invalid verification method. Choose email, phone, or secret_word.' });
    }

    if (!isMatch) {
      return res.status(400).json({
        error: `Verification failed. The provided ${methodLabel} does not match the registered records for "${cleanUser}". Please try another confirmation method.`
      });
    }

    // Verification succeeded: update password
    await db.run('UPDATE users SET password = ? WHERE id = ?', [new_password.trim(), user.id]);

    // Clear any active lockout timers for this user
    for (const [key] of loginAttemptStore.entries()) {
      if (key.endsWith(`::${cleanUser.toLowerCase()}`)) {
        loginAttemptStore.delete(key);
      }
    }

    res.json({
      success: true,
      message: `Password reset successfully for ${user.display_name}! You can now sign in with your new password.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/profile - Change username & password in database for student, teacher, or any user
router.put('/profile', async (req, res) => {
  try {
    const { userId, username, newUsername, newPassword, currentPassword, displayName, email, phone, secretWord } = req.body;
    
    // Locate user by userId or username
    let user = null;
    if (userId) {
      user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    } else if (username) {
      user = await db.get('SELECT * FROM users WHERE username = ?', [username.trim()]);
    }

    if (!user) {
      return res.status(404).json({ error: 'User account not found in database.' });
    }

    // Verify current password if provided
    if (currentPassword && user.password !== currentPassword.trim()) {
      return res.status(401).json({ error: 'Current password does not match.' });
    }

    const updates = [];
    const params = [];
    const oldUsername = user.username;

    // Handle Username Change
    const targetUsername = (newUsername || (userId ? null : username))?.trim();
    if (targetUsername && targetUsername !== user.username) {
      const checkUsername = await db.get('SELECT id FROM users WHERE username = ? AND id != ?', [targetUsername, user.id]);
      if (checkUsername) {
        return res.status(400).json({ error: `Username "${targetUsername}" is already taken by another account. Please choose another.` });
      }
      updates.push('username = ?');
      params.push(targetUsername);
    }

    // Handle Password Change - directly persisted to MySQL database
    if (newPassword && newPassword.trim().length > 0) {
      const trimmedPass = newPassword.trim();
      if (trimmedPass.length < 4) {
        return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
      }
      updates.push('password = ?');
      params.push(trimmedPass);
    }

    // Optional Display Name
    if (displayName && displayName.trim().length > 0) {
      updates.push('display_name = ?');
      params.push(displayName.trim());
    }

    // Optional Email
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email ? email.trim() : null);
    }

    // Optional Phone
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone ? phone.trim() : null);
    }

    // Optional Secret Word
    if (secretWord !== undefined && secretWord.trim().length > 0) {
      updates.push('secret_word = ?');
      params.push(secretWord.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No changes provided. Please enter a new username, password, or contact information.' });
    }

    params.push(user.id);
    await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    // Sync linked teacher or student profile if contact info updated
    if (user.role === 'teacher' && user.ref_id) {
      await db.run('UPDATE teachers SET phone = COALESCE(?, phone), email = COALESCE(?, email) WHERE id = ?', [
        phone ? phone.trim() : null,
        email ? email.trim() : null,
        user.ref_id
      ]);
    } else if (user.role === 'student' && user.ref_id) {
      await db.run('UPDATE students SET parent_phone = COALESCE(?, parent_phone), parent_email = COALESCE(?, parent_email) WHERE id = ?', [
        phone ? phone.trim() : null,
        email ? email.trim() : null,
        user.ref_id
      ]);
    }

    // Clear any active lockout timers in memory for this user
    for (const [key] of loginAttemptStore.entries()) {
      if (key.endsWith(`::${oldUsername.toLowerCase()}`) || (targetUsername && key.endsWith(`::${targetUsername.toLowerCase()}`))) {
        loginAttemptStore.delete(key);
      }
    }

    const updatedUser = await db.get('SELECT id, username, role, display_name, email, phone, managed_class_id FROM users WHERE id = ?', [user.id]);
    res.json({
      success: true,
      message: 'Username and password updated in database successfully!',
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/users/:id/password - Direct password update by ID (Admin or User)
router.put('/users/:id/password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found in database.' });
    }

    await db.run('UPDATE users SET password = ? WHERE id = ?', [newPassword.trim(), user.id]);

    // Clear lockout
    for (const [key] of loginAttemptStore.entries()) {
      if (key.endsWith(`::${user.username.toLowerCase()}`)) {
        loginAttemptStore.delete(key);
      }
    }

    res.json({
      success: true,
      message: `Password updated in database successfully for user "${user.username}".`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/users - List available roles & credentials for quick login
router.get('/users', async (req, res) => {
  try {
    const users = await db.all(`
      SELECT 
        u.id, u.username, u.role, u.display_name, u.managed_class_id,
        c.name as class_name, c.section as class_section
      FROM users u
      LEFT JOIN classes c ON u.managed_class_id = c.id
      ORDER BY FIELD(u.role, 'admin', 'principal', 'teacher', 'student'), u.id
    `);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
