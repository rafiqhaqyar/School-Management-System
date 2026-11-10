/**
 * School Management System - Main Interactive Application Logic
 * Developer: Rafiq Haqyar (Contact: 923229594616, Email: rafiqhaqyar524@gmail.com)
 * Multi-Role: Admin, Principal Musharaf Khan, Class Teacher, Student
 * Currency: PKR (Pakistani Rupee)
 * Classes: Prep A, Prep B to Class 8 (Sequential Fees: Max 900 down to 450 PKR)
 */

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  currentView: 'dashboard',
  currentUser: null,
  schoolSettings: null,
  activeAttendanceTab: 'students', // 'students' or 'teachers'
  activeHubClassId: null,
  activeHubTab: 'daily-att', // 'daily-att', 'monthly-att', 'fees', 'results', 'assignments', 'timetable'
  hubAttendanceRecords: [],
  selectedLogoFile: null,
  teacherViewTab: 'workload', // 'workload' or 'attendance'
  noticeBoardTab: 'bulletins', // 'bulletins', 'meetings', 'rules'
  classesList: [],
  teachersList: [],
  studentsList: [],
  examsList: [],
  activeAttendanceRecords: [],
  activeTeacherAttendanceRecords: [],

  async init() {
    this.setupTheme();
    this.setupNavigation();
    this.setupGlobalEvents();
    this.setupSearch();
    await this.loadSchoolSettings();
    await this.preloadCommonData();
    this.initAuth();
  },

  // -------------------------------------------------------------
  // SCHOOL SETTINGS, BRANDING & LOGO UPLOAD (FROM SSD / DISK)
  // -------------------------------------------------------------
  renderLogoElement(el, s) {
    if (!el) return;
    if (s && s.logo_url) {
      el.innerHTML = `<img src="${s.logo_url}?t=${Date.now()}" alt="School Logo" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
    } else {
      el.textContent = (s && s.logo_icon) || '🎓';
    }
  },

  async loadSchoolSettings() {
    try {
      this.schoolSettings = await API.getSettings();
      const s = this.schoolSettings || {};

      // Update Branding Everywhere
      document.title = `${s.school_name || 'EduPulse Academy'} | School Management System`;
      
      const sidebarName = document.getElementById('sidebarSchoolName');
      const sidebarTag = document.getElementById('sidebarTagline');
      const dashGreeting = document.getElementById('dashSchoolGreeting');
      const authSchoolName = document.getElementById('authModalSchoolName');
      const sportsWeekText = document.getElementById('headerSportsWeekText');
      const ttBreakText = document.getElementById('ttBreakText');

      if (sidebarName) sidebarName.textContent = s.school_name || 'EduPulse';
      if (sidebarTag) sidebarTag.textContent = s.tagline || 'School System';
      if (dashGreeting) dashGreeting.textContent = `${s.school_name || 'EduPulse'} Overview Dashboard`;
      if (authSchoolName) authSchoolName.textContent = s.school_name || 'EduPulse Multi-Role Portal';
      if (sportsWeekText) sportsWeekText.textContent = s.sports_week_date || 'Nov 18 - Nov 24, 2026';
      if (ttBreakText) ttBreakText.textContent = `${s.recess_break_minutes || 30}-Minute Rest & Tea Break included in daily routine.`;

      // Render School Logo on All Badges (image from SSD or fallback emoji)
      this.renderLogoElement(document.getElementById('sidebarLogoIcon'), s);
      this.renderLogoElement(document.getElementById('dashLogoBox'), s);
      this.renderLogoElement(document.getElementById('authModalLogo'), s);
      this.renderLogoElement(document.getElementById('officialLogoPreviewBox'), s);
      this.renderLogoElement(document.getElementById('modalLogoPreviewBox'), s);
      this.renderLogoElement(document.getElementById('reportCardSchoolLogo'), s);

      // Fill Dashboard Official Banner Contacts
      const setTxt = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
      };
      setTxt('dashSchoolName', s.school_name || 'EduPulse Academy');
      setTxt('dashTagline', s.tagline || 'Excellence in Academic and Character Development');
      setTxt('dashPhone', s.phone || '+92 322-9594616');
      setTxt('dashEmail', s.email || 'rafiqhaqyar524@gmail.com');
      setTxt('dashAddress', s.address || 'Bajaur / Main Campus');
      setTxt('dashSportsWeek', s.sports_week_date || 'Nov 18 - Nov 24, 2026');
      setTxt('dashRecessBreak', `${s.recess_break_minutes || 30} Minutes Daily`);

      // Fill Settings Modal
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
      };
      setVal('setSchoolName', s.school_name || 'EduPulse Academy');
      setVal('setSchoolLogo', s.logo_icon || '🎓');
      setVal('setSchoolTagline', s.tagline || '');
      setVal('setSchoolPhone', s.phone || '+92 322-9594616');
      setVal('setSchoolEmail', s.email || 'rafiqhaqyar524@gmail.com');
      setVal('setSportsWeek', s.sports_week_date || 'Nov 18 - Nov 24, 2026');
      const recessBreakEl = document.getElementById('setRecessBreak');
      if (recessBreakEl) recessBreakEl.value = s.recess_break_minutes || 30;
      setVal('setSchoolAddress', s.address || '');

      // Fill Official Contact Page Fields
      setVal('offSchoolName', s.school_name || 'EduPulse Academy');
      setVal('offLogoIcon', s.logo_icon || '🎓');
      setVal('offSchoolTagline', s.tagline || '');
      setVal('offSchoolPhone', s.phone || '+92 322-9594616');
      setVal('offSchoolEmail', s.email || 'rafiqhaqyar524@gmail.com');
      setVal('offSportsWeek', s.sports_week_date || 'Nov 18 - Nov 24, 2026');
      const offRecessEl = document.getElementById('offRecessBreak');
      if (offRecessEl) offRecessEl.value = s.recess_break_minutes || 30;
      setVal('offSchoolAddress', s.address || '');
    } catch (err) {
      console.warn('Could not load school settings:', err);
    }
  },

  handleLogoFileSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (file) {
      this.selectedLogoFile = file;
      const previewBox = document.getElementById('officialLogoPreviewBox');
      if (previewBox) {
        const url = URL.createObjectURL(file);
        previewBox.innerHTML = `<img src="${url}" alt="Logo Preview" style="width:100%; height:100%; object-fit:cover;">`;
      }
    }
  },

  async uploadSelectedLogo() {
    if (!this.selectedLogoFile) {
      this.toast('Please choose a logo image file from your computer / SSD first!', 'error');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('logo', this.selectedLogoFile);
      const res = await API.uploadLogo(formData);
      this.toast(res.message || 'School logo uploaded and saved successfully!');
      this.selectedLogoFile = null;
      await this.loadSchoolSettings();
    } catch (err) {
      this.toast(err.message || 'Failed to upload logo', 'error');
    }
  },

  async handleModalLogoFileSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await API.uploadLogo(formData);
      this.toast('Logo image uploaded successfully from your storage!');
      await this.loadSchoolSettings();
    } catch (err) {
      this.toast(err.message || 'Failed to upload logo', 'error');
    }
  },

  async resetSchoolLogo() {
    if (!confirm('Are you sure you want to reset the school logo to the default emoji icon?')) return;
    try {
      await API.resetLogo();
      this.toast('School logo reset to default icon');
      await this.loadSchoolSettings();
    } catch (err) {
      this.toast(err.message || 'Failed to reset logo', 'error');
    }
  },

  async handleSaveSchoolSettings(e) {
    e.preventDefault();
    const data = {
      school_name: document.getElementById('setSchoolName').value.trim(),
      logo_icon: document.getElementById('setSchoolLogo').value.trim(),
      tagline: document.getElementById('setSchoolTagline').value.trim(),
      phone: document.getElementById('setSchoolPhone').value.trim(),
      email: document.getElementById('setSchoolEmail').value.trim(),
      sports_week_date: document.getElementById('setSportsWeek').value.trim(),
      recess_break_minutes: parseInt(document.getElementById('setRecessBreak').value, 10) || 30,
      address: document.getElementById('setSchoolAddress').value.trim()
    };

    try {
      await API.updateSettings(data);
      this.toast('School settings & branding updated successfully!');
      this.closeModal('schoolSettingsModal');
      await this.loadSchoolSettings();
    } catch (err) {
      this.toast(err.message || 'Failed to update school settings', 'error');
    }
  },

  async handleSaveOfficialProfile(e) {
    e.preventDefault();
    const data = {
      school_name: document.getElementById('offSchoolName').value.trim(),
      logo_icon: document.getElementById('offLogoIcon').value.trim() || '🎓',
      tagline: document.getElementById('offSchoolTagline').value.trim(),
      phone: document.getElementById('offSchoolPhone').value.trim(),
      email: document.getElementById('offSchoolEmail').value.trim(),
      sports_week_date: document.getElementById('offSportsWeek').value.trim(),
      recess_break_minutes: parseInt(document.getElementById('offRecessBreak').value, 10) || 30,
      address: document.getElementById('offSchoolAddress').value.trim()
    };

    try {
      await API.updateSettings(data);
      this.toast('Official school contact and profile updated successfully!');
      await this.loadSchoolSettings();
    } catch (err) {
      this.toast(err.message || 'Failed to update profile', 'error');
    }
  },

  // -------------------------------------------------------------
  // AUTHENTICATION & MULTI-ROLE LOGIC
  // -------------------------------------------------------------
  initAuth() {
    this.loginFailedAttempts = parseInt(localStorage.getItem('sms_login_failed_attempts') || '0', 10);
    this.checkLoginLockout();

    const savedUser = localStorage.getItem('sms_current_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        this.applyCurrentUser();
      } catch (e) {
        this.showLogin();
      }
    } else {
      this.showLogin();
    }
  },

  showLogin() {
    this.currentUser = null;
    localStorage.removeItem('sms_current_user');

    // Ensure inputs are completely empty
    const uInp = document.getElementById('authUsername');
    const pInp = document.getElementById('authPassword');
    if (uInp && !uInp.disabled) uInp.value = '';
    if (pInp && !pInp.disabled) pInp.value = '';

    const errBox = document.getElementById('authLoginError');
    if (errBox) errBox.style.display = 'none';

    this.checkLoginLockout();

    const overlay = document.getElementById('authOverlay');
    if (overlay) overlay.classList.remove('hidden');
  },

  checkLoginLockout() {
    const lockoutUntil = parseInt(localStorage.getItem('sms_login_lockout_until') || '0', 10);
    const now = Date.now();

    if (lockoutUntil > now) {
      const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
      const streak = parseInt(localStorage.getItem('sms_login_lockout_streak') || '1', 10);
      this.activateLockoutUI(remainingSeconds, streak);
      return true;
    } else if (lockoutUntil > 0) {
      localStorage.removeItem('sms_login_lockout_until');
      this.deactivateLockoutUI();
      return false;
    }
    return false;
  },

  activateLockoutUI(remainingSeconds, streak = 1) {
    if (this.lockoutInterval) clearInterval(this.lockoutInterval);

    const uInp = document.getElementById('authUsername');
    const pInp = document.getElementById('authPassword');
    const sBtn = document.getElementById('authSubmitBtn');
    const banner = document.getElementById('authLockoutBanner');
    const timerEl = document.getElementById('authLockoutTimer');
    const msgEl = document.getElementById('authLockoutMessage');
    const errBox = document.getElementById('authLoginError');

    // Disable inputs & submit button completely - not allowed to enter credentials
    if (uInp) { uInp.disabled = true; uInp.value = ''; }
    if (pInp) { pInp.disabled = true; pInp.value = ''; }
    if (sBtn) sBtn.disabled = true;

    if (errBox) errBox.style.display = 'none';
    if (banner) banner.style.display = 'block';

    const durationText = streak > 1 ? '5 minutes' : '1 minute';
    if (msgEl) {
      msgEl.textContent = `Too many failed attempts (5/5). Account temporarily locked for ${durationText}. You are not allowed to enter username or password until the cooldown finishes.`;
    }

    const formatTimer = (secs) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    let secondsLeft = remainingSeconds;
    if (timerEl) timerEl.textContent = formatTimer(secondsLeft);

    this.lockoutInterval = setInterval(() => {
      secondsLeft--;
      if (timerEl) timerEl.textContent = formatTimer(Math.max(0, secondsLeft));

      if (secondsLeft <= 0) {
        clearInterval(this.lockoutInterval);
        localStorage.removeItem('sms_login_lockout_until');
        this.deactivateLockoutUI();
        this.toast('Cooldown timer finished. You may now enter your username and password.', 'info');
      }
    }, 1000);
  },

  deactivateLockoutUI() {
    if (this.lockoutInterval) clearInterval(this.lockoutInterval);

    const uInp = document.getElementById('authUsername');
    const pInp = document.getElementById('authPassword');
    const sBtn = document.getElementById('authSubmitBtn');
    const banner = document.getElementById('authLockoutBanner');

    if (uInp) { uInp.disabled = false; uInp.value = ''; }
    if (pInp) { pInp.disabled = false; pInp.value = ''; }
    if (sBtn) sBtn.disabled = false;
    if (banner) banner.style.display = 'none';

    this.loginFailedAttempts = 0;
    localStorage.removeItem('sms_login_failed_attempts');
  },

  showLoginError(message) {
    const errBox = document.getElementById('authLoginError');
    const errTxt = document.getElementById('authLoginErrorText');
    if (errBox && errTxt) {
      errTxt.textContent = message;
      errBox.style.display = 'flex';
    }
  },

  async handleLogin(e) {
    e.preventDefault();

    if (this.checkLoginLockout()) {
      this.toast('Account is currently locked due to 5 failed attempts. Please wait for the timer to finish.', 'warning');
      return;
    }

    const u = document.getElementById('authUsername').value.trim();
    const p = document.getElementById('authPassword').value.trim();

    if (!u || !p) {
      this.showLoginError('Please enter both username and password.');
      this.toast('Please enter both username and password.', 'warning');
      return;
    }

    await this.performLogin(u, p);
  },

  async performLogin(username, password) {
    try {
      const res = await API.login(username, password);
      if (res && res.success) {
        // Successful login: completely clear failed attempts and lockout streak
        this.loginFailedAttempts = 0;
        localStorage.removeItem('sms_login_failed_attempts');
        localStorage.removeItem('sms_login_lockout_until');
        localStorage.removeItem('sms_login_lockout_streak');
        this.deactivateLockoutUI();

        // Clear input values
        const uInp = document.getElementById('authUsername');
        const pInp = document.getElementById('authPassword');
        if (uInp) uInp.value = '';
        if (pInp) pInp.value = '';

        this.currentUser = res.user;
        localStorage.setItem('sms_current_user', JSON.stringify(res.user));

        const overlay = document.getElementById('authOverlay');
        if (overlay) overlay.classList.add('hidden');

        this.applyCurrentUser();
        this.toast(`Welcome back, ${res.user.displayName}!`, 'success');
      }
    } catch (err) {
      const pInp = document.getElementById('authPassword');
      if (pInp) pInp.value = '';

      // Check if locked out by server (status 429)
      if (err.status === 429 || (err.data && err.data.locked)) {
        const remainingSec = err.data?.remainingSeconds || 60;
        const streak = err.data?.streak || (parseInt(localStorage.getItem('sms_login_lockout_streak') || '0', 10) + 1);
        localStorage.setItem('sms_login_lockout_streak', streak.toString());
        localStorage.setItem('sms_login_lockout_until', (Date.now() + remainingSec * 1000).toString());
        this.activateLockoutUI(remainingSec, streak);
        this.toast(err.message || 'Account locked due to 5 failed attempts.', 'error');
        return;
      }

      // Track failed attempt on client
      this.loginFailedAttempts = (this.loginFailedAttempts || 0) + 1;
      localStorage.setItem('sms_login_failed_attempts', this.loginFailedAttempts.toString());

      if (this.loginFailedAttempts >= 5) {
        const streak = parseInt(localStorage.getItem('sms_login_lockout_streak') || '0', 10) + 1;
        const lockDurationSec = streak > 1 ? 300 : 60; // 1 minute first, 5 minutes if repeated
        localStorage.setItem('sms_login_lockout_streak', streak.toString());
        localStorage.setItem('sms_login_lockout_until', (Date.now() + lockDurationSec * 1000).toString());

        this.activateLockoutUI(lockDurationSec, streak);
        this.toast(`5 failed attempts reached! Account locked for ${lockDurationSec === 60 ? '1 minute' : '5 minutes'}.`, 'error');
      } else {
        const remaining = 5 - this.loginFailedAttempts;
        const errorMsg = `Incorrect username or password. Please try again. (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`;
        this.showLoginError(errorMsg);
        this.toast('Incorrect username or password. Please try again.', 'error');
      }
    }
  },

  switchAuthTab(tab) {
    const loginBtn = document.getElementById('authTabLogin');
    const regBtn = document.getElementById('authTabRegister');
    const forgotBtn = document.getElementById('authTabForgot');
    const loginSec = document.getElementById('authLoginSection');
    const regSec = document.getElementById('authRegisterSection');
    const forgotSec = document.getElementById('authForgotSection');

    if (loginBtn) loginBtn.classList.toggle('active', tab === 'login');
    if (regBtn) regBtn.classList.toggle('active', tab === 'register');
    if (forgotBtn) forgotBtn.classList.toggle('active', tab === 'forgot');

    if (loginSec) loginSec.style.display = (tab === 'login') ? 'block' : 'none';
    if (regSec) regSec.style.display = (tab === 'register') ? 'block' : 'none';
    if (forgotSec) forgotSec.style.display = (tab === 'forgot') ? 'block' : 'none';

    if (tab === 'register') {
      this.populateClassSelects();
    } else if (tab === 'forgot') {
      const enteredUser = document.getElementById('authUsername')?.value.trim();
      const forgotUser = document.getElementById('forgotUsername');
      if (enteredUser && forgotUser && !forgotUser.value) {
        forgotUser.value = enteredUser;
      }
      this.setRecoveryMethod(this.activeRecoveryMethod || 'email');
    }
  },

  setRecoveryMethod(method) {
    this.activeRecoveryMethod = method;
    const btnEmail = document.getElementById('recMethodEmail');
    const btnPhone = document.getElementById('recMethodPhone');
    const btnSecret = document.getElementById('recMethodSecret');
    const label = document.getElementById('recValueLabel');
    const input = document.getElementById('recValueInput');
    const help = document.getElementById('recValueHelp');

    if (btnEmail) btnEmail.classList.toggle('active', method === 'email');
    if (btnPhone) btnPhone.classList.toggle('active', method === 'phone');
    if (btnSecret) btnSecret.classList.toggle('active', method === 'secret_word');

    if (method === 'email') {
      if (label) label.textContent = 'Registered Gmail / Email Address *';
      if (input) {
        input.placeholder = 'e.g. rafiqhaqyar524@gmail.com';
        input.type = 'email';
      }
      if (help) help.textContent = 'Enter the exact Gmail or email address linked to your account.';
    } else if (method === 'phone') {
      if (label) label.textContent = 'Registered Mobile Phone Number *';
      if (input) {
        input.placeholder = 'e.g. +92 322-9594616 or 03229594616';
        input.type = 'tel';
      }
      if (help) help.textContent = "Enter the complete mobile number saved to your account, including its country code if applicable.";
    } else if (method === 'secret_word') {
      if (label) label.textContent = 'Secret Security Word *';
      if (input) {
        input.placeholder = 'Enter the secret recovery word you set';
        input.type = 'text';
      }
      if (help) help.textContent = 'Enter the secret recovery word saved for your account.';
    }
  },

  async handleForgotPassword(e) {
    e.preventDefault();
    const username = document.getElementById('forgotUsername').value.trim();
    const method = this.activeRecoveryMethod || 'email';
    const verification_value = document.getElementById('recValueInput').value.trim();
    const new_password = document.getElementById('recNewPassword').value.trim();
    const confirm_password = document.getElementById('recConfirmPassword').value.trim();

    if (!username || !verification_value || !new_password) {
      this.toast('Please fill all required verification and password fields.', 'warning');
      return;
    }

    if (new_password.length < 4) {
      this.toast('New password must be at least 4 characters long.', 'warning');
      return;
    }

    if (new_password !== confirm_password) {
      this.toast('New passwords do not match. Please verify and re-type.', 'error');
      return;
    }

    try {
      const res = await API.forgotPassword({
        username,
        method,
        verification_value,
        new_password
      });

      this.toast(res.message || 'Password reset successfully!', 'success');

      // Clear forgot form
      document.getElementById('authForgotForm').reset();

      // Reset client lockout counters if any
      this.deactivateLockoutUI();
      localStorage.removeItem('sms_login_lockout_until');

      // Switch back to login and auto-populate username
      this.switchAuthTab('login');
      const authUser = document.getElementById('authUsername');
      const authPass = document.getElementById('authPassword');
      if (authUser) authUser.value = username;
      if (authPass) {
        authPass.value = '';
        authPass.focus();
      }
    } catch (err) {
      this.toast(err.message || 'Failed to verify recovery credentials.', 'error');
    }
  },

  onRegisterRoleChange(role) {
    const studentFields = document.getElementById('regStudentFields');
    const teacherFields = document.getElementById('regTeacherFields');
    if (role === 'teacher') {
      if (studentFields) studentFields.style.display = 'none';
      if (teacherFields) teacherFields.style.display = 'block';
    } else {
      if (studentFields) studentFields.style.display = 'block';
      if (teacherFields) teacherFields.style.display = 'none';
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const role = document.getElementById('regRole').value;
    const fullName = document.getElementById('regFullName').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const secretWord = document.getElementById('regSecretWord')?.value.trim();

    if (!fullName || !username || !password) {
      this.toast('Please provide your name, username, and password.', 'error');
      return;
    }

    const payload = { role, fullName, username, password };
    if (email) payload.email = email;
    if (secretWord) payload.secretWord = secretWord;

    if (role === 'student') {
      const classId = document.getElementById('regClassId').value;
      const parentName = document.getElementById('regParentName').value.trim();
      const parentPhone = document.getElementById('regParentPhone').value.trim();
      const gender = document.getElementById('regGender').value;

      if (!parentPhone) {
        this.toast("Father's contact number is mandatory for student registration!", 'error');
        return;
      }

      payload.classId = classId ? parseInt(classId, 10) : 16;
      payload.parentName = parentName || 'Father';
      payload.parentPhone = parentPhone;
      payload.gender = gender;
    } else {
      payload.designation = document.getElementById('regDesignation').value.trim() || 'Teacher';
      payload.subjectSpecialization = document.getElementById('regSubject').value.trim() || 'General Studies';
      payload.phone = document.getElementById('regTeacherPhone').value.trim();
    }

    try {
      const res = await API.register(payload);
      this.toast(res.message || 'Account registered successfully!', 'success');
      // Automatically log the new user in!
      await this.performLogin(username, password);
    } catch (err) {
      this.toast(err.message || 'Registration failed. Please try again.', 'error');
    }
  },

  applyCurrentUser() {
    if (!this.currentUser) return;
    const u = this.currentUser;

    const nameEl = document.getElementById('userDisplayName');
    const roleEl = document.getElementById('userRoleBadge');
    const avatarEl = document.getElementById('userAvatarBadge');

    if (nameEl) nameEl.textContent = u.displayName || u.username;
    if (roleEl) {
      const roleTitles = {
        admin: 'System Administrator',
        principal: 'Principal (Musharaf Khan)',
        teacher: `Teacher (${u.managedClassName || 'Class Teacher'})`,
        student: `Student (${u.className || 'Class 8'})`
      };
      roleEl.textContent = roleTitles[u.role] || u.role.toUpperCase();
    }
    if (avatarEl) {
      const initials = (u.displayName || u.username).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      avatarEl.textContent = initials || 'RH';
    }

    // Role-based navigation visibility
    document.querySelectorAll('[data-role-access]').forEach(item => {
      const allowed = item.getAttribute('data-role-access').split(',').map(s => s.trim());
      if (allowed.includes(u.role)) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });

    const isStudent = u.role === 'student';
    const isTeacher = u.role === 'teacher';
    const isAdminOrPrincipal = u.role === 'admin' || u.role === 'principal';

    // Control header buttons
    const btnEnroll = document.getElementById('btnHeaderEnroll');
    if (btnEnroll) {
      btnEnroll.style.display = (isAdminOrPrincipal || isTeacher) ? '' : 'none';
    }

    const btnSettings = document.getElementById('btnHeaderSettings');
    if (btnSettings) {
      btnSettings.style.display = isAdminOrPrincipal ? '' : 'none';
    }

    // Teacher restrictions UI banner
    const banner = document.getElementById('teacherRestrictionBanner');
    if (banner) {
      if (u.role === 'teacher') {
        banner.style.display = 'block';
        const txt = document.getElementById('teacherAssignedClassText');
        if (txt) txt.textContent = u.managedClassName || 'Class 8';
      } else {
        banner.style.display = 'none';
      }
    }

    // Class Hub button and header visibility by role
    const attTeacherHeader = document.getElementById('classAttTeacherHeader');
    const attStudentHeader = document.getElementById('classAttStudentHeader');
    const attActionBtns = document.getElementById('classAttActionButtons');
    if (attStudentHeader) attStudentHeader.style.display = isStudent ? 'block' : 'none';
    if (attActionBtns) attActionBtns.style.display = isStudent ? 'none' : 'flex';

    const btnStuSub = document.getElementById('btnStudentSubmitAssignment');
    const btnAddAss = document.getElementById('btnAddAssignment');
    if (btnStuSub) btnStuSub.style.display = isStudent ? 'inline-flex' : 'none';
    if (btnAddAss) btnAddAss.style.display = isStudent ? 'none' : 'inline-flex';

    const btnFeeInv = document.getElementById('btnCreateFeeInvoice');
    if (btnFeeInv) btnFeeInv.style.display = isStudent ? 'none' : 'inline-flex';

    const btnMarks = document.getElementById('btnEnterSubjectMarks');
    if (btnMarks) btnMarks.style.display = isStudent ? 'none' : 'inline-flex';

    const btnTimetable = document.getElementById('btnAddTimetableSlot');
    if (btnTimetable) btnTimetable.style.display = isStudent ? 'none' : 'inline-flex';

    // Teacher directory control buttons
    const btnTchAtt = document.getElementById('btnTeacherAttRegister');
    const btnAddTch = document.getElementById('btnAddTeacher');
    const tabTchAtt = document.getElementById('tabTeacherAttBtn');
    if (btnTchAtt) btnTchAtt.style.display = isStudent ? 'none' : 'inline-flex';
    if (btnAddTch) btnAddTch.style.display = isStudent ? 'none' : 'inline-flex';
    if (tabTchAtt) tabTchAtt.style.display = isStudent ? 'none' : 'inline-block';

    // Default class ID for student
    if (isStudent && u.classId) {
      this.activeHubClassId = u.classId;
    }

    // Default initial view per role
    if (u.role === 'teacher') {
      this.loadView('classes');
    } else if (u.role === 'student') {
      this.loadView('classes');
    } else {
      this.loadView('dashboard');
    }
  },

  // Open Change Credentials Modal & Pre-fill Current Username
  openChangeCredentialsModal() {
    if (!this.currentUser) {
      this.showLogin();
      return;
    }
    const userInp = document.getElementById('changeUsernameInput');
    const currPassInp = document.getElementById('changeCurrentPassInput');
    const newPassInp = document.getElementById('changeNewPassInput');
    const confPassInp = document.getElementById('changeConfirmPassInput');
    const secretInp = document.getElementById('changeSecretWordInput');

    if (userInp) userInp.value = this.currentUser.username || '';
    if (currPassInp) currPassInp.value = '';
    if (newPassInp) newPassInp.value = '';
    if (confPassInp) confPassInp.value = '';
    if (secretInp) secretInp.value = this.currentUser.secret_word || '';

    this.openModal('changeCredentialsModal');
  },

  // Toggle Show/Hide Password
  togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (btn) btn.textContent = '🙈';
    } else {
      input.type = 'password';
      if (btn) btn.textContent = '👁️';
    }
  },

  // Change Username & Password for Teacher, Student, Admin, Principal
  async handleChangeCredentials(e) {
    e.preventDefault();
    if (!this.currentUser) return;

    const newUsername = document.getElementById('changeUsernameInput').value.trim();
    const currentPassword = document.getElementById('changeCurrentPassInput')?.value.trim() || '';
    const newPassword = document.getElementById('changeNewPassInput')?.value.trim() || '';
    const confirmPassword = document.getElementById('changeConfirmPassInput')?.value.trim() || '';
    const secretWord = document.getElementById('changeSecretWordInput')?.value.trim() || '';

    if (!newUsername && !newPassword) {
      this.toast('Please provide a new username or new password to update.', 'warning');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 4) {
        this.toast('New password must be at least 4 characters long.', 'warning');
        return;
      }
      if (confirmPassword && newPassword !== confirmPassword) {
        this.toast('New passwords do not match. Please re-enter carefully.', 'error');
        return;
      }
    }

    try {
      const res = await API.updateProfile({
        userId: this.currentUser.id,
        newUsername: newUsername || this.currentUser.username,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
        secretWord: secretWord || undefined
      });

      this.toast(res.message || 'Username and password updated in database successfully!', 'success');
      
      // Update local storage session
      if (newUsername) this.currentUser.username = newUsername;
      if (res.user && res.user.username) this.currentUser.username = res.user.username;
      localStorage.setItem('sms_current_user', JSON.stringify(this.currentUser));
      
      // Update UI displays
      this.updateUserSessionUI();
      this.closeModal('changeCredentialsModal');
      document.getElementById('changeCredentialsForm')?.reset();
    } catch (err) {
      this.toast(err.message || 'Failed to update credentials in database', 'error');
    }
  },

  // -------------------------------------------------------------
  // PRELOAD METADATA & SELECTS
  // -------------------------------------------------------------
  async preloadCommonData() {
    try {
      this.classesList = await API.getClasses();
      this.teachersList = await API.getTeachers();
      this.studentsList = await API.getStudents();
      this.examsList = await API.getExams();
      this.populateClassSelects();
      this.populateStudentSelects();
    } catch (err) {
      console.warn('Could not preload metadata:', err);
    }
  },

  populateClassSelects() {
    const classSelects = document.querySelectorAll('.class-select-target');
    classSelects.forEach(select => {
      const currentVal = select.value;
      const defaultOption = select.querySelector('option[value=""]');
      select.innerHTML = '';
      if (defaultOption) select.appendChild(defaultOption);

      this.classesList.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        // Do not write fees with class name; clean label
        opt.textContent = `${c.name} (${c.section})`;
        select.appendChild(opt);
      });
      if (currentVal) select.value = currentVal;
    });
  },

  populateStudentSelects() {
    const studentSelect = document.getElementById('feeStudentSelect');
    if (studentSelect) {
      studentSelect.innerHTML = '<option value="">Select Student</option>' + this.studentsList.map(s => `
        <option value="${s.id}">${s.first_name} ${s.last_name} (${s.class_name || 'Class'} - ${s.admission_no})</option>
      `).join('');
    }

    const markStudentSelect = document.getElementById('newMarkStudentSelect');
    if (markStudentSelect) {
      let filtered = this.studentsList;
      if (this.currentUser && this.currentUser.role === 'teacher' && this.currentUser.managedClassId) {
        filtered = this.studentsList.filter(s => String(s.class_id) === String(this.currentUser.managedClassId));
      }
      markStudentSelect.innerHTML = '<option value="">Select Student</option>' + filtered.map(s => `
        <option value="${s.id}">Roll #${s.roll_no || 'N/A'}: ${s.first_name} ${s.last_name} (${s.class_name || 'Class'})</option>
      `).join('');
    }
  },

  onEnrollClassChange(classId) {
    if (!classId) return;
    const classStudents = this.studentsList.filter(s => String(s.class_id) === String(classId));
    const nextRoll = classStudents.length + 1;
    const rollInput = document.getElementById('enrollRollInput');
    if (rollInput) rollInput.value = String(nextRoll);
  },

  onFeeStudentChange(studentId) {
    if (!studentId) return;
    const st = this.studentsList.find(s => String(s.id) === String(studentId));
    if (st && st.class_id) {
      const cls = this.classesList.find(c => String(c.id) === String(st.class_id));
      const amountInput = document.getElementById('feeAmountInput');
      if (amountInput) {
        amountInput.value = cls?.monthly_fee || 900;
      }
    }
  },

  // -------------------------------------------------------------
  // THEME MANAGEMENT
  // -------------------------------------------------------------
  setupTheme() {
    const savedTheme = localStorage.getItem('sms_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeButton(savedTheme);

    const toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('sms_theme', next);
        this.updateThemeButton(next);
      });
    }
  },

  updateThemeButton(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      btn.title = `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`;
    }
  },

  // -------------------------------------------------------------
  // SPA NAVIGATION
  // -------------------------------------------------------------
  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-view]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.getAttribute('data-view');
        this.loadView(view);
      });
    });
  },

  loadView(viewName) {
    this.currentView = viewName;

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-view="${viewName}"]`);
    if (activeLink) activeLink.classList.add('active');

    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    switch (viewName) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'students':
        this.renderStudents();
        break;
      case 'teachers':
        this.renderTeachers();
        break;
      case 'classes':
        this.renderClasses();
        break;
      case 'attendance':
        this.renderAttendance();
        break;
      case 'timetable':
        this.renderTimetable();
        break;
      case 'grades':
        this.renderGrades();
        break;
      case 'assignments':
        this.renderAssignments();
        break;
      case 'fees':
        this.renderFees();
        break;
      case 'assembly':
        this.renderAssembly();
        break;
      case 'meetings':
        this.renderMeetings();
        break;
      case 'rules':
        this.renderRules();
        break;
      case 'notices':
        this.renderNotices();
        break;
      case 'official-contact':
        this.renderOfficialContact();
        break;
    }
  },

  setupGlobalEvents() {
    document.querySelectorAll('.modal-close, [data-modal-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    });

    this.setupFormSubmissions();
  },

  openModal(modalId) {
    this.populateStudentSelects();
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  },

  toast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');
    toast.innerHTML = `<strong>${icon}</strong><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  },

  setupSearch() {
    const searchInput = document.getElementById('globalSearchInput');
    if (!searchInput) return;

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const term = e.target.value.trim();
        if (this.currentView === 'students') {
          this.renderStudents(term);
        } else if (this.currentView === 'teachers') {
          this.renderTeachers(term);
        }
      }, 300);
    });
  },

  // -------------------------------------------------------------
  // 1. DASHBOARD VIEW (PKR Currency)
  // -------------------------------------------------------------
  async renderDashboard() {
    try {
      // Update School Official Banner on Dashboard
      const s = this.schoolSettings || {};
      this.renderLogoElement(document.getElementById('dashLogoBox'), s);
      const setTxt = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
      };
      setTxt('dashSchoolName', s.school_name || 'EduPulse Academy');
      setTxt('dashTagline', s.tagline || 'Excellence in Academic and Character Development');
      setTxt('dashPhone', s.phone || '+92 322-9594616');
      setTxt('dashEmail', s.email || 'rafiqhaqyar524@gmail.com');
      setTxt('dashAddress', s.address || 'Bajaur / Main Campus');
      setTxt('dashSportsWeek', s.sports_week_date || 'Nov 18 - Nov 24, 2026');
      setTxt('dashRecessBreak', `${s.recess_break_minutes || 30} Minutes Daily`);

      const data = await API.getDashboard();
      const m = data.metrics;

      document.getElementById('kpiTotalStudents').textContent = m.totalStudents;
      document.getElementById('kpiTotalTeachers').textContent = m.totalTeachers;
      document.getElementById('kpiAttendanceRate').textContent = `${m.attendanceRate}%`;
      document.getElementById('kpiFeesCollected').textContent = `PKR ${(m.feeCollection.total_collected || 0).toLocaleString()}`;

      const isStudent = this.currentUser?.role === 'student';
      const studentTbody = document.getElementById('dashboardRecentStudents');
      if (studentTbody) {
        if (data.recentStudents.length === 0) {
          studentTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted)">No students recorded yet.</td></tr>`;
        } else {
          studentTbody.innerHTML = data.recentStudents.map(s => {
            const isSelf = isStudent && this.currentUser?.studentId === s.id;
            const phoneDisplay = (isStudent && !isSelf) ? '🔒 Private' : (s.parent_phone || '+92 322-9594616');
            const actionBtn = isStudent
              ? (isSelf ? `<button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.78rem;" onclick="App.viewStudentProfile(${s.id})">My Profile</button>` : `<span style="font-size:0.75rem; color:var(--text-dim);">Protected</span>`)
              : `<button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.78rem;" onclick="App.viewStudentProfile(${s.id})">View Profile</button>`;

            return `
              <tr>
                <td><strong>Roll #${s.roll_no || '1'}</strong></td>
                <td>
                  <div class="student-meta">
                    <div class="student-avatar">${s.first_name[0]}${s.last_name[0]}</div>
                    <div>
                      <div class="student-name">${s.first_name} ${s.last_name}</div>
                      <div class="student-sub">${s.admission_no}</div>
                    </div>
                  </div>
                </td>
                <td><strong style="color:var(--secondary);">${phoneDisplay}</strong></td>
                <td>${s.class_name ? `${s.class_name} (${s.class_section})` : 'Unassigned'}</td>
                <td><span class="status-pill active">${s.status}</span></td>
                <td>${actionBtn}</td>
              </tr>
            `;
          }).join('');
        }
      }

      const noticesFeed = document.getElementById('dashboardNoticesFeed');
      if (noticesFeed) {
        noticesFeed.innerHTML = data.recentNotices.map(n => `
          <div class="notice-item">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span class="status-pill ${n.priority === 'Urgent' ? 'absent' : (n.priority === 'Important' ? 'pending' : 'active')}">
                ${n.priority}
              </span>
              <span style="font-size:0.75rem; color:var(--text-dim);">${n.date}</span>
            </div>
            <div class="notice-title">${n.title}</div>
            <div class="notice-content">${n.content}</div>
          </div>
        `).join('');
      }

      const distContainer = document.getElementById('dashboardClassDist');
      if (distContainer) {
        distContainer.innerHTML = data.classDistribution.map(c => `
          <div style="margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
              <span><strong>${c.name}</strong> <small style="color:var(--text-muted);">(${c.section || 'A'})</small></span>
              <span style="font-weight:600; color:var(--secondary);">${c.count} Students</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${Math.min(100, (c.count / 40) * 100)}%;"></div>
            </div>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error('Dashboard error:', err);
    }
  },

  // -------------------------------------------------------------
  // 2. STUDENTS VIEW
  // -------------------------------------------------------------
  async renderStudents(searchTerm = '') {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">Loading students directory...</td></tr>`;

    try {
      let classId = document.getElementById('studentClassFilter')?.value || '';
      const status = document.getElementById('studentStatusFilter')?.value || '';

      if (this.currentUser?.role === 'teacher' && this.currentUser.managedClassId && !classId) {
        classId = this.currentUser.managedClassId;
        const sel = document.getElementById('studentClassFilter');
        if (sel) sel.value = classId;
      }

      const students = await API.getStudents({
        class_id: classId,
        status: status,
        search: searchTerm
      });

      this.studentsList = students;
      this.populateStudentSelects();

      if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">No student records found.</td></tr>`;
        return;
      }

      tbody.innerHTML = students.map(s => `
        <tr>
          <td><strong style="color:#34d399; font-size:1.05rem;">#${s.roll_no || '1'}</strong></td>
          <td>
            <div class="student-meta">
              <div class="student-avatar">${s.first_name[0]}${s.last_name[0]}</div>
              <div>
                <div class="student-name">${s.first_name} ${s.last_name}</div>
                <div class="student-sub">Father: ${s.parent_name || 'Guardian'}</div>
              </div>
            </div>
          </td>
          <td><strong>${s.admission_no}</strong></td>
          <td>${s.class_name ? `${s.class_name} (${s.class_section})` : '<span style="color:var(--text-dim)">Unassigned</span>'}</td>
          <td><strong style="color:var(--secondary);">${s.parent_phone || '+92 322-9594616'}</strong></td>
          <td><span class="status-pill ${s.status === 'Active' ? 'active' : 'inactive'}">${s.status}</span></td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.78rem;" onclick="App.viewStudentProfile(${s.id})" title="Profile & Results">
                👤 Profile
              </button>
              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.78rem;" onclick="App.openReportCard(${s.id})" title="Report Card">
                📜 Card
              </button>
              ${(this.currentUser?.role === 'admin' || this.currentUser?.role === 'principal') ? `
                <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.78rem;" onclick="App.deleteStudent(${s.id})" title="Delete">
                  ✕
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger); text-align:center;">Failed to load students.</td></tr>`;
    }
  },

  async viewStudentProfile(id) {
    if (this.currentUser?.role === 'student' && this.currentUser?.studentId != id) {
      this.toast('Privacy Protection: You are only allowed to view your own student profile.', 'warning');
      return;
    }
    try {
      const s = await API.getStudent(id);
      document.getElementById('profileStudentName').textContent = `${s.first_name} ${s.last_name}`;
      document.getElementById('profileAdmissionNo').textContent = s.admission_no;
      document.getElementById('profileClass').textContent = s.class_name ? `${s.class_name} (${s.class_section})` : 'Unassigned';
      document.getElementById('profileRollNo').textContent = s.roll_no || '1';
      document.getElementById('profileParentName').textContent = s.parent_name || 'Father';
      document.getElementById('profileParentPhone').textContent = s.parent_phone || '+92 322-9594616';
      document.getElementById('profileAddress').textContent = s.address || 'N/A';

      // 1. Paper-wise Exam Results
      const marksBody = document.getElementById('profileMarksBody');
      if (marksBody) {
        if (!s.marks || s.marks.length === 0) {
          marksBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:14px;">No exam paper marks recorded yet.</td></tr>`;
        } else {
          marksBody.innerHTML = s.marks.map(m => {
            const pct = ((Number(m.marks_obtained) / Number(m.max_marks || 100)) * 100).toFixed(1);
            const isPass = Number(m.marks_obtained) > 33 && Number(pct) >= 33;
            let grade = 'Fail';
            if (isPass) {
              if (pct >= 80) grade = 'A+';
              else if (pct >= 70) grade = 'A';
              else if (pct >= 60) grade = 'B';
              else if (pct >= 50) grade = 'C';
              else grade = 'D';
            }

            return `
              <tr>
                <td><strong>${m.exam_name || 'Mid-Term 2026'}</strong></td>
                <td>${m.subject_name}</td>
                <td><strong>${m.marks_obtained}</strong></td>
                <td>${m.max_marks || 100}</td>
                <td><span class="${isPass ? 'pass-tag' : 'fail-tag'}">${grade}</span></td>
                <td>
                  ${isPass 
                    ? '<span style="color:#34d399; font-weight:600;">Passed</span>' 
                    : '<span style="color:#f87171; font-weight:700;">Fail (Needs Father Call)</span>'
                  }
                </td>
              </tr>
            `;
          }).join('');
        }
      }

      // 2. Monthly Attendance Breakdown
      const attBody = document.getElementById('profileMonthlyAttBody');
      if (attBody) {
        attBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:12px; color:var(--text-muted);">Loading monthly attendance...</td></tr>`;
        try {
          const monthly = await API.getStudentMonthlyAttendance(id);
          if (monthly.length === 0) {
            attBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:14px;">No monthly attendance records found.</td></tr>`;
          } else {
            attBody.innerHTML = monthly.map(m => `
              <tr>
                <td><strong>${m.month}</strong></td>
                <td>${m.totalDays} Days</td>
                <td style="color:#34d399; font-weight:700;">${m.present}</td>
                <td style="color:#f87171; font-weight:700;">${m.absent}</td>
                <td style="color:#a5b4fc; font-weight:700;">${m.leave}</td>
                <td>
                  <span class="status-pill ${m.rate >= 75 ? 'paid' : 'urgent'}">
                    ${m.rate}% Attendance
                  </span>
                </td>
              </tr>
            `).join('');
          }
        } catch (e) {
          attBody.innerHTML = `<tr><td colspan="6" style="color:var(--danger); text-align:center;">Failed to load monthly attendance.</td></tr>`;
        }
      }

      this.openModal('studentProfileModal');
    } catch (err) {
      this.toast('Could not load student profile', 'error');
    }
  },

  async deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student record?')) return;
    try {
      await API.deleteStudent(id);
      this.toast('Student record deleted successfully');
      this.renderStudents();
    } catch (err) {
      this.toast('Failed to delete student', 'error');
    }
  },

  // -------------------------------------------------------------
  // 3. TEACHERS & FACULTY VIEW (Workload Columns & Teacher Attendance)
  // -------------------------------------------------------------
  switchTeacherViewTab(tab) {
    this.teacherViewTab = tab;
    const btnWork = document.getElementById('tabTeacherWorkloadBtn');
    const btnAtt = document.getElementById('tabTeacherAttBtn');
    const secWork = document.getElementById('teacherWorkloadSection');
    const secAtt = document.getElementById('teacherAttendanceSection');

    if (tab === 'workload') {
      if (btnWork) btnWork.classList.add('active');
      if (btnAtt) btnAtt.classList.remove('active');
      if (secWork) secWork.style.display = 'block';
      if (secAtt) secAtt.style.display = 'none';
      this.renderTeachers();
    } else {
      if (btnAtt) btnAtt.classList.add('active');
      if (btnWork) btnWork.classList.remove('active');
      if (secWork) secWork.style.display = 'none';
      if (secAtt) secAtt.style.display = 'block';
      this.fetchTeacherAttendance();
    }
  },

  async renderTeachers() {
    const tbody = document.getElementById('teachersWorkloadTableBody');
    const searchVal = document.getElementById('teacherSearchInput')?.value || '';
    const statusVal = document.getElementById('teacherStatusFilter')?.value || '';
    const isStudent = this.currentUser?.role === 'student';

    // Toggle Salary and Actions header columns for students
    const thSalary = document.getElementById('thTeacherSalary');
    const thActions = document.getElementById('thTeacherActions');
    if (thSalary) thSalary.style.display = isStudent ? 'none' : '';
    if (thActions) thActions.style.display = isStudent ? 'none' : '';

    const btnTchAtt = document.getElementById('btnTeacherAttRegister');
    const btnAddTch = document.getElementById('btnAddTeacher');
    const tabTchAtt = document.getElementById('tabTeacherAttBtn');
    if (btnTchAtt) btnTchAtt.style.display = isStudent ? 'none' : 'inline-flex';
    if (btnAddTch) btnAddTch.style.display = isStudent ? 'none' : 'inline-flex';
    if (tabTchAtt) tabTchAtt.style.display = isStudent ? 'none' : 'inline-block';

    try {
      const teachers = await API.getTeachers({ search: searchVal, status: statusVal });
      this.teachersList = teachers;

      if (tbody) {
        if (teachers.length === 0) {
          const colSpan = isStudent ? 6 : 8;
          tbody.innerHTML = `<tr><td colspan="${colSpan}" style="text-align:center; padding:24px; color:var(--text-muted);">No faculty members found.</td></tr>`;
          return;
        }

        tbody.innerHTML = teachers.map(t => {
          const isPrincipal = t.role_designation === 'Principal' || t.first_name.includes('Musharaf');
          const isPTSir = t.role_designation === 'PT Instructor' || t.first_name.includes('Tariq');

          const due = t.due_classes || (isPrincipal ? 12 : (isPTSir ? 20 : 24));
          const completed = t.completed_classes !== undefined ? t.completed_classes : 0;
          const remaining = t.remaining_classes !== undefined ? t.remaining_classes : Math.max(0, due - completed);

          let roleBadge = `<span class="status-pill active">${t.role_designation || 'Teacher'}</span>`;
          if (isPrincipal) roleBadge = `<span class="notice-badge-principal">👑 Principal</span>`;
          else if (isPTSir) roleBadge = `<span class="status-pill" style="background:rgba(6,182,212,0.15); color:#22d3ee; border:1px solid rgba(6,182,212,0.4);">🏃 PT Sir</span>`;

          const assignedText = t.managed_class_name 
            ? `<strong style="color:var(--primary);">${t.managed_class_name} (${t.managed_class_section})</strong><br><small style="color:var(--text-dim);">Class Incharge</small>`
            : `<span style="color:var(--text-dim);">${isPrincipal ? 'School Administration' : (isPTSir ? 'All Classes (Physical Drills)' : 'Subject Specialist')}</span>`;

          return `
            <tr>
              <td>
                <div class="student-meta">
                  <div class="student-avatar" style="${isPrincipal ? 'background: linear-gradient(135deg, #f59e0b, #ef4444); color:#fff;' : (isPTSir ? 'background: linear-gradient(135deg, #06b6d4, #10b981); color:#fff;' : 'background: linear-gradient(135deg, var(--accent-purple), var(--primary));')}">
                    ${t.first_name[0]}${t.last_name[0]}
                  </div>
                  <div>
                    <div class="student-name">${t.first_name} ${t.last_name}</div>
                    <div style="margin-top:2px;">${roleBadge}</div>
                    <small style="color:var(--text-dim);">${t.subject_specialization ? `Specialization: ${t.subject_specialization} • ` : ''}${t.email} • 📞 ${t.phone || 'N/A'}</small>
                  </div>
                </div>
              </td>
              <td>${assignedText}</td>
              <td><span class="workload-badge workload-due">📚 ${due} Periods/Wk</span></td>
              <td><span class="workload-badge workload-taken">✓ ${completed} Conducted</span></td>
              <td><span class="workload-badge ${remaining === 0 ? 'workload-rem zero' : 'workload-rem'}">⏳ ${remaining} Remaining</span></td>
              ${!isStudent ? `<td><strong class="currency-pkr">PKR ${Number(t.salary || 0).toLocaleString()}</strong></td>` : ''}
              <td>
                <span class="status-badge ${t.today_attendance === 'Present' ? 'positive' : (t.today_attendance === 'Absent' ? 'critical' : 'warning')}">
                  ${t.today_attendance || 'Unmarked'}
                </span>
              </td>
              ${!isStudent ? `
                <td>
                  <div style="display:flex; gap:6px;">
                    <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="App.adjustTeacherPeriods(${t.id}, ${completed})" title="Log Completed Period">
                      + Log Period
                    </button>
                    ${(this.currentUser?.role === 'admin' && !isPrincipal) ? `
                      <button class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem;" onclick="App.deleteTeacher(${t.id})">
                        ✕
                      </button>
                    ` : ''}
                  </div>
                </td>
              ` : ''}
            </tr>
          `;
        }).join('');
      }
    } catch (err) {
      console.error('Error rendering teachers:', err);
    }
  },

  async adjustTeacherPeriods(teacherId, currentCompleted) {
    const add = prompt('Enter number of completed periods to add (e.g. 1 or 2):', '1');
    if (!add) return;
    const num = parseInt(add, 10);
    if (isNaN(num) || num <= 0) return;

    try {
      await API.updateTeacher(teacherId, { completed_classes: currentCompleted + num });
      this.toast(`Teacher workload updated: +${num} period(s) conducted!`);
      this.renderTeachers();
    } catch (err) {
      this.toast('Failed to update period workload', 'error');
    }
  },

  async fetchTeacherAttendance() {
    const dateInput = document.getElementById('teacherAttDateInput');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    const tbody = document.getElementById('teachersAttendanceTableBody');
    if (!tbody) return;

    try {
      const data = await API.getTeacherAttendance(date);
      this.activeTeacherAttendanceRecords = data.records;

      const s = data.summary;
      const setNum = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      setNum('teachStatTotal', s.total);
      setNum('teachStatPresent', s.present);
      setNum('teachStatAbsent', s.absent);
      setNum('teachStatLeave', s.leave);

      if (data.records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">No faculty records found for attendance.</td></tr>`;
        return;
      }

      tbody.innerHTML = data.records.map(r => `
        <tr>
          <td>
            <strong>${r.first_name} ${r.last_name}</strong>
            <br><small style="color:var(--text-dim);">${r.employee_id} • 📞 ${r.phone || 'N/A'}</small>
          </td>
          <td>
            ${r.role_designation || 'Teacher'}
            ${r.managed_class_name ? `<br><small style="color:var(--primary);">Incharge: ${r.managed_class_name} (${r.managed_class_section})</small>` : ''}
          </td>
          <td>
            <div class="attendance-actions">
              <button type="button" class="att-btn ${r.status === 'Present' ? 'selected-present' : ''}" onclick="App.setTeacherAttStatus(${r.teacher_id}, 'Present', this)">
                Present
              </button>
              <button type="button" class="att-btn ${r.status === 'Leave' ? 'selected-late' : ''}" onclick="App.setTeacherAttStatus(${r.teacher_id}, 'Leave', this)">
                Leave
              </button>
              <button type="button" class="att-btn ${r.status === 'Absent' ? 'selected-absent' : ''}" onclick="App.setTeacherAttStatus(${r.teacher_id}, 'Absent', this)">
                Absent
              </button>
            </div>
          </td>
          <td>
            <input type="text" class="form-control" style="padding:4px 8px; font-size:0.8rem; width:180px;" placeholder="Optional notes" value="${r.notes || ''}" onchange="App.setTeacherAttNotes(${r.teacher_id}, this.value)">
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4" style="color:var(--danger); text-align:center;">Failed to load teacher attendance.</td></tr>`;
    }
  },

  setTeacherAttStatus(teacherId, status, btn) {
    const rec = this.activeTeacherAttendanceRecords.find(r => r.teacher_id === teacherId);
    if (rec) rec.status = status;
    const parent = btn.parentElement;
    parent.querySelectorAll('.att-btn').forEach(b => b.classList.remove('selected-present', 'selected-late', 'selected-absent'));
    btn.classList.add(status === 'Present' ? 'selected-present' : (status === 'Absent' ? 'selected-absent' : 'selected-late'));
  },

  setTeacherAttNotes(teacherId, notes) {
    const rec = this.activeTeacherAttendanceRecords.find(r => r.teacher_id === teacherId);
    if (rec) rec.notes = notes;
  },

  markAllTeachersPresent() {
    this.activeTeacherAttendanceRecords.forEach(r => r.status = 'Present');
    const tbody = document.getElementById('teachersAttendanceTableBody');
    if (tbody) {
      tbody.querySelectorAll('tr').forEach(tr => {
        const btns = tr.querySelectorAll('.att-btn');
        btns.forEach(b => b.classList.remove('selected-present', 'selected-late', 'selected-absent'));
        if (btns[0]) btns[0].classList.add('selected-present');
      });
    }
    this.toast('All faculty marked as Present for today');
  },

  async saveTeacherAttendance() {
    const dateInput = document.getElementById('teacherAttDateInput');
    const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    if (!this.activeTeacherAttendanceRecords || this.activeTeacherAttendanceRecords.length === 0) {
      this.toast('No teacher records to save', 'warning');
      return;
    }

    try {
      await API.saveTeacherAttendance(date, this.activeTeacherAttendanceRecords);
      this.toast('Faculty attendance saved successfully!');
      this.fetchTeacherAttendance();
      this.renderTeachers();
    } catch (err) {
      this.toast(err.message || 'Failed to save teacher attendance', 'error');
    }
  },

  // -------------------------------------------------------------
  // 4. CLASSES ACADEMIC HUB (Prep A - 8th Sub-Categories & Columns)
  // -------------------------------------------------------------
  async renderClasses() {
    try {
      this.classesList = await API.getClasses();
      if (!this.teachersList || this.teachersList.length === 0) {
        this.teachersList = await API.getTeachers();
      }

      // Default active class: user's managed class if teacher, or first class
      if (!this.activeHubClassId) {
        if (this.currentUser && this.currentUser.managedClassId) {
          this.activeHubClassId = this.currentUser.managedClassId;
        } else if (this.classesList.length > 0) {
          this.activeHubClassId = this.classesList[0].id;
        }
      }

      // Render Class Sub-Category Pills (Prep A to Class 8) - No fees in class buttons
      const pillsContainer = document.getElementById('classSubCategoryPills');
      if (pillsContainer) {
        pillsContainer.innerHTML = this.classesList.map(c => `
          <button type="button" class="class-pill-btn ${c.id === this.activeHubClassId ? 'active' : ''}" onclick="App.selectHubClass(${c.id})" title="${c.name} (${c.section})">
            <span class="class-pill-name">${c.name} <span class="class-pill-sec">(${c.section})</span></span>
            <span class="class-pill-sub">${c.student_count || 0} Students</span>
          </button>
        `).join('');
      }

      // Update Active Selected Class Banner (Internal Header with Fee written once)
      const currentCls = this.classesList.find(c => c.id === this.activeHubClassId) || this.classesList[0];
      if (currentCls) {
        this.activeHubClassId = currentCls.id;
        const nameEl = document.getElementById('hubClassName');
        const inchargeEl = document.getElementById('hubClassIncharge');
        const feeEl = document.getElementById('hubClassFee');
        const capEl = document.getElementById('hubClassCapacity');
        const roomEl = document.getElementById('hubClassRoom');

        if (nameEl) nameEl.textContent = `${currentCls.name} (${currentCls.section})`;
        if (feeEl) feeEl.textContent = `PKR ${Number(currentCls.monthly_fee || 900).toLocaleString()} / Month`;
        if (capEl) capEl.textContent = `${currentCls.student_count || 0} / ${currentCls.capacity || 40} Students (${Math.round(((currentCls.student_count || 0) / (currentCls.capacity || 40)) * 100)}% Full)`;
        if (roomEl) roomEl.textContent = currentCls.room_number ? `Room ${currentCls.room_number}` : 'Room: Assigned';

        // Find assigned teacher incharge
        const incharge = (this.teachersList || []).find(t => t.assigned_class_id === currentCls.id);
        if (inchargeEl) {
          inchargeEl.textContent = incharge ? `Class Incharge: ${incharge.first_name} ${incharge.last_name} (${incharge.role_designation || 'Teacher'})` : 'Class Incharge: Assigned Faculty';
        }
      }

      // Switch to currently active sub-category tab
      this.switchClassHubTab(this.activeHubTab || 'daily-att');
    } catch (err) {
      console.error('Error rendering classes hub:', err);
    }
  },

  selectHubClass(classId) {
    this.activeHubClassId = classId;
    this.renderClasses();
  },

  // Confirm delete current class (if mistakenly created)
  confirmDeleteCurrentClass() {
    if (!this.classesList || this.classesList.length === 0) {
      this.toast('No classes found in the system.', 'warning');
      return;
    }

    const currentCls = this.classesList.find(c => c.id === this.activeHubClassId) || this.classesList[0];
    if (!currentCls) return;

    if (this.classesList.length <= 1) {
      this.toast('Cannot remove the only remaining class in the school system.', 'warning');
      return;
    }

    const nameEl = document.getElementById('deleteClassTargetName');
    const noteEl = document.getElementById('deleteClassWarningNote');
    if (nameEl) nameEl.textContent = `${currentCls.name} (${currentCls.section})`;
    if (noteEl) {
      const count = currentCls.student_count || 0;
      noteEl.textContent = count > 0 
        ? `Warning: This class currently has ${count} student(s) enrolled. Removing this class will detach enrolled students (they will be unassigned) and remove associated timetable entries.`
        : `This class has 0 enrolled students. Removing it will delete this class from all schedules.`;
    }

    this.openModal('deleteClassModal');
  },

  // Execute delete class via API
  async executeDeleteCurrentClass() {
    const currentCls = this.classesList.find(c => c.id === this.activeHubClassId) || this.classesList[0];
    if (!currentCls) return;

    try {
      const res = await API.deleteClass(currentCls.id);
      this.toast(res.message || `Class "${currentCls.name} (${currentCls.section})" removed successfully!`, 'success');
      this.closeModal('deleteClassModal');

      // Reload common metadata
      await this.preloadCommonData();

      // Switch to first remaining class
      if (this.classesList.length > 0) {
        this.activeHubClassId = this.classesList[0].id;
      }
      this.renderClasses();
    } catch (err) {
      this.toast(err.message || 'Failed to remove class', 'error');
    }
  },

  switchClassHubTab(tabName) {
    this.activeHubTab = tabName;
    const tabMap = {
      'daily-att': { btn: 'classTabDailyAtt', sec: 'classHubSecDailyAtt' },
      'monthly-att': { btn: 'classTabMonthlyAtt', sec: 'classHubSecMonthlyAtt' },
      'fees': { btn: 'classTabFees', sec: 'classHubSecFees' },
      'results': { btn: 'classTabResults', sec: 'classHubSecResults' },
      'assignments': { btn: 'classTabAssignments', sec: 'classHubSecAssignments' },
      'timetable': { btn: 'classTabTimetable', sec: 'classHubSecTimetable' }
    };

    Object.keys(tabMap).forEach(key => {
      const b = document.getElementById(tabMap[key].btn);
      const s = document.getElementById(tabMap[key].sec);
      if (b) b.classList.toggle('active', key === tabName);
      if (s) s.style.display = (key === tabName) ? 'block' : 'none';
    });

    switch (tabName) {
      case 'daily-att':
        this.loadClassHubDailyAttendance();
        break;
      case 'monthly-att':
        this.loadClassHubMonthlyReport();
        break;
      case 'fees':
        this.loadClassHubFees();
        break;
      case 'results':
        this.loadClassHubGrades();
        break;
      case 'assignments':
        this.loadClassHubAssignments();
        break;
      case 'timetable':
        this.loadClassHubTimetable();
        break;
    }
  },

  async loadClassHubDailyAttendance() {
    const isStudent = this.currentUser?.role === 'student';

    // Show/hide headers & action buttons
    const teacherHdr = document.getElementById('classAttTeacherHeader');
    const studentHdr = document.getElementById('classAttStudentHeader');
    const actBtns = document.getElementById('classAttActionButtons');
    if (studentHdr) studentHdr.style.display = isStudent ? 'block' : 'none';
    if (actBtns) actBtns.style.display = isStudent ? 'none' : 'flex';

    const dateInput = document.getElementById('classDailyAttDate');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    const tbody = document.getElementById('classDailyAttTableBody');
    if (!tbody) return;

    try {
      const data = await API.getAttendance(date, this.activeHubClassId);
      this.hubAttendanceRecords = data.records;

      const s = data.summary;
      const setNum = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      setNum('classAttStatTotal', s.total);
      setNum('classAttStatPresent', s.present);
      setNum('classAttStatAbsent', s.absent);
      setNum('classAttStatLeave', s.leave);

      if (data.records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">No student records found in this class.</td></tr>`;
        return;
      }

      // If student is logged in, show ONLY their verified attendance status (Strictly Read-Only, No Action Buttons)
      if (isStudent) {
        const myRecs = data.records.filter(r => r.student_id === this.currentUser.studentId);
        if (myRecs.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">No attendance record found for your roll number on ${date}. Daily attendance will appear once submitted by your designated class teacher.</td></tr>`;
          return;
        }

        tbody.innerHTML = myRecs.map(r => {
          let badgeClass = 'status-pill';
          let badgeText = r.status || 'Unmarked';
          if (r.status === 'Present') {
            badgeClass += ' paid';
            badgeText = '✓ Present';
          } else if (r.status === 'Absent') {
            badgeClass += ' pending';
            badgeText = '✕ Absent';
          } else if (r.status === 'Leave' || r.status === 'Excused') {
            badgeClass += ' active';
            badgeText = '⏳ On Leave';
          }

          return `
            <tr>
              <td><strong style="color:var(--primary); font-family:var(--font-mono);">#${r.roll_no || '1'}</strong></td>
              <td><strong>${r.first_name} ${r.last_name}</strong></td>
              <td><span style="font-size:0.82rem; color:var(--text-dim);">${r.admission_no}</span></td>
              <td><span style="color:var(--secondary); font-weight:600;">📞 ${r.parent_phone || 'None'}</span></td>
              <td>
                <span class="${badgeClass}" style="padding:6px 14px; font-weight:700; font-size:0.85rem;">
                  ${badgeText}
                </span>
              </td>
              <td>
                <span style="color:var(--text-muted); font-size:0.85rem;">${r.notes || 'Official Daily Class Record'}</span>
              </td>
            </tr>
          `;
        }).join('');
        return;
      }

      // Interactive Teacher / Admin Attendance Marking View
      tbody.innerHTML = data.records.map(r => `
        <tr>
          <td><strong style="color:var(--primary); font-family:var(--font-mono);">#${r.roll_no || '1'}</strong></td>
          <td><strong>${r.first_name} ${r.last_name}</strong></td>
          <td><span style="font-size:0.82rem; color:var(--text-dim);">${r.admission_no}</span></td>
          <td><a href="tel:${r.parent_phone}" style="color:var(--secondary); text-decoration:none;">📞 ${r.parent_phone || 'None'}</a></td>
          <td>
            <div class="attendance-actions">
              <button type="button" class="att-btn ${r.status === 'Present' ? 'selected-present' : ''}" onclick="App.setClassHubRecordStatus(${r.student_id}, 'Present', this)">
                Present
              </button>
              <button type="button" class="att-btn ${r.status === 'Leave' || r.status === 'Excused' ? 'selected-late' : ''}" onclick="App.setClassHubRecordStatus(${r.student_id}, 'Leave', this)">
                Leave
              </button>
              <button type="button" class="att-btn ${r.status === 'Absent' ? 'selected-absent' : ''}" onclick="App.setClassHubRecordStatus(${r.student_id}, 'Absent', this)">
                Absent
              </button>
            </div>
          </td>
          <td>
            <input type="text" class="form-control" style="padding:4px 8px; font-size:0.8rem; width:150px;" placeholder="Remarks" value="${r.notes || ''}" onchange="App.setClassHubRecordNotes(${r.student_id}, this.value)">
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger); text-align:center;">Failed to load daily attendance.</td></tr>`;
    }
  },

  setClassHubRecordStatus(studentId, status, btn) {
    if (this.currentUser?.role === 'student') {
      this.toast('Students are not authorized to mark or alter attendance.', 'error');
      return;
    }
    const rec = this.hubAttendanceRecords.find(r => r.student_id === studentId);
    if (rec) rec.status = status;
    const parent = btn.parentElement;
    parent.querySelectorAll('.att-btn').forEach(b => b.classList.remove('selected-present', 'selected-late', 'selected-absent'));
    btn.classList.add(status === 'Present' ? 'selected-present' : (status === 'Absent' ? 'selected-absent' : 'selected-late'));

    // Update counters
    const pres = this.hubAttendanceRecords.filter(r => r.status === 'Present').length;
    const abs = this.hubAttendanceRecords.filter(r => r.status === 'Absent').length;
    const leav = this.hubAttendanceRecords.filter(r => r.status === 'Leave' || r.status === 'Excused').length;
    document.getElementById('classAttStatPresent').textContent = pres;
    document.getElementById('classAttStatAbsent').textContent = abs;
    document.getElementById('classAttStatLeave').textContent = leav;
  },

  setClassHubRecordNotes(studentId, notes) {
    if (this.currentUser?.role === 'student') return;
    const rec = this.hubAttendanceRecords.find(r => r.student_id === studentId);
    if (rec) rec.notes = notes;
  },

  markAllClassStudentsPresent() {
    if (this.currentUser?.role === 'student') {
      this.toast('Students are not authorized to mark attendance.', 'error');
      return;
    }
    this.hubAttendanceRecords.forEach(r => r.status = 'Present');
    const tbody = document.getElementById('classDailyAttTableBody');
    if (tbody) {
      tbody.querySelectorAll('tr').forEach(tr => {
        const btns = tr.querySelectorAll('.att-btn');
        btns.forEach(b => b.classList.remove('selected-present', 'selected-late', 'selected-absent'));
        if (btns[0]) btns[0].classList.add('selected-present');
      });
    }
    document.getElementById('classAttStatPresent').textContent = this.hubAttendanceRecords.length;
    document.getElementById('classAttStatAbsent').textContent = 0;
    document.getElementById('classAttStatLeave').textContent = 0;
    this.toast('All students marked as Present in this class');
  },

  async saveClassHubAttendance() {
    if (this.currentUser?.role === 'student') {
      this.toast('Students are not authorized to save attendance records.', 'error');
      return;
    }
    const dateInput = document.getElementById('classDailyAttDate');
    const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    if (!this.hubAttendanceRecords || this.hubAttendanceRecords.length === 0) {
      this.toast('No student attendance records to save', 'warning');
      return;
    }

    try {
      await API.saveAttendance(date, this.hubAttendanceRecords);
      this.toast('Class attendance saved successfully!');
      this.loadClassHubDailyAttendance();
    } catch (err) {
      this.toast(err.message || 'Failed to save attendance', 'error');
    }
  },

  async loadClassHubMonthlyReport() {
    const isStudent = this.currentUser?.role === 'student';
    const monthInput = document.getElementById('classMonthlyAttMonth');
    if (monthInput && !monthInput.value) {
      monthInput.value = new Date().toISOString().substring(0, 7);
    }
    const month = monthInput ? monthInput.value : new Date().toISOString().substring(0, 7);
    const tbody = document.getElementById('classMonthlyReportTableBody');
    if (!tbody) return;

    try {
      const res = await API.getClassMonthlyAttendance(this.activeHubClassId, month);
      if (!res.report || res.report.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:var(--text-muted);">No attendance records recorded for this class in ${month}.</td></tr>`;
        return;
      }

      let reportRows = res.report;
      if (isStudent) {
        reportRows = res.report.filter(r => r.student_id === this.currentUser.studentId);
        if (reportRows.length === 0) {
          tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:var(--text-muted);">No monthly attendance performance records found for your account in ${month}.</td></tr>`;
          return;
        }
      }

      tbody.innerHTML = reportRows.map(r => {
        let badgeClass = 'positive';
        if (r.percentage < 60) badgeClass = 'critical';
        else if (r.percentage < 75) badgeClass = 'warning';

        const phoneDisplay = isStudent ? (r.parent_phone || 'None') : `<a href="tel:${r.parent_phone}" style="color:var(--secondary); text-decoration:none;">📞 ${r.parent_phone || 'None'}</a>`;

        return `
          <tr>
            <td><strong style="color:var(--primary); font-family:var(--font-mono);">#${r.roll_no || '--'}</strong></td>
            <td><strong>${r.name}</strong><br><small style="color:var(--text-dim);">${r.admission_no}</small></td>
            <td><span style="color:var(--secondary); font-weight:600;">📞 ${phoneDisplay}</span></td>
            <td><strong>${r.total_days}</strong> Days</td>
            <td><span style="color:#34d399; font-weight:700;">${r.present_days}</span></td>
            <td><span style="color:#f87171; font-weight:700;">${r.absent_days}</span></td>
            <td><span style="color:#818cf8; font-weight:700;">${r.leave_days}</span></td>
            <td>
              <div style="display:flex; align-items:center; gap:8px;">
                <div style="flex:1; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
                  <div style="width:${r.percentage}%; height:100%; background:${r.percentage >= 75 ? '#10b981' : (r.percentage >= 60 ? '#f59e0b' : '#ef4444')};"></div>
                </div>
                <span style="font-weight:700; font-size:0.82rem;">${r.percentage}%</span>
              </div>
            </td>
            <td>
              <span class="status-badge ${badgeClass}">${r.standing}</span>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="9" style="color:var(--danger); text-align:center;">Failed to load monthly report.</td></tr>`;
    }
  },

  async loadClassHubFees() {
    const isStudent = this.currentUser?.role === 'student';
    const btnFeeInv = document.getElementById('btnCreateFeeInvoice');
    if (btnFeeInv) btnFeeInv.style.display = isStudent ? 'none' : 'inline-flex';

    const tbody = document.getElementById('classFeesTableBody');
    if (!tbody) return;

    try {
      const fees = await API.getFees({ class_id: this.activeHubClassId });
      let feeRows = fees;
      if (isStudent) {
        feeRows = fees.filter(f => f.student_id === this.currentUser.studentId);
        if (feeRows.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">No fee invoice issued for your account yet. Contact school administration office.</td></tr>`;
          return;
        }
      } else if (fees.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">No fee records found for this class. Click "+ Create Fee Invoice" to issue tuition fees.</td></tr>`;
        return;
      }

      tbody.innerHTML = feeRows.map(f => `
        <tr>
          <td><strong style="color:var(--primary); font-family:var(--font-mono);">#${f.roll_no || '--'}</strong></td>
          <td><strong>${f.first_name} ${f.last_name}</strong><br><small style="color:var(--text-dim);">${f.admission_no}</small></td>
          <td><span style="color:var(--secondary); font-weight:600;">📞 ${f.parent_phone || 'None'}</span></td>
          <td><strong class="currency-pkr">PKR ${Number(f.amount).toLocaleString()}</strong></td>
          <td><span style="color:#34d399; font-weight:700;">PKR ${f.status === 'Paid' ? Number(f.amount).toLocaleString() : '0'}</span></td>
          <td>
            <span class="status-pill ${f.status === 'Paid' ? 'paid' : (f.status === 'Pending' ? 'pending' : 'overdue')}">
              ${f.status}
            </span>
          </td>
          <td>
            ${f.status !== 'Paid' ? `
              <button class="btn btn-success" style="padding:4px 8px; font-size:0.75rem;" onclick="App.recordPayment(${f.id})">
                💳 Pay in PKR
              </button>
            ` : `<span style="font-size:0.8rem; color:var(--text-dim);">${f.payment_method || 'Paid in PKR'}</span>`}
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger); text-align:center;">Failed to load class fees.</td></tr>`;
    }
  },

  async loadClassHubGrades() {
    const isStudent = this.currentUser?.role === 'student';
    const btnMarks = document.getElementById('btnEnterSubjectMarks');
    if (btnMarks) btnMarks.style.display = isStudent ? 'none' : 'inline-flex';

    const tbody = document.getElementById('classGradesTableBody');
    const examSelect = document.getElementById('classExamFilter');
    if (!tbody) return;

    try {
      if (!this.examsList || this.examsList.length === 0) {
        this.examsList = await API.getExams();
      }
      if (examSelect && examSelect.children.length === 0) {
        examSelect.innerHTML = this.examsList.map(e => `
          <option value="${e.id}">${e.name} (${e.term})</option>
        `).join('');
      }

      const examId = examSelect ? examSelect.value : (this.examsList[0] ? this.examsList[0].id : null);
      const params = { class_id: this.activeHubClassId };
      if (examId) params.exam_id = examId;

      const marks = await API.getMarks(params);
      let marksRows = marks;
      if (isStudent) {
        marksRows = marks.filter(m => m.student_id === this.currentUser.studentId);
        if (marksRows.length === 0) {
          tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--text-muted);">No exam marks recorded for you in this examination term yet.</td></tr>`;
          return;
        }
      } else if (marks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--text-muted);">No marks entered for this exam yet. Click "+ Enter Subject Marks" to grade students.</td></tr>`;
        return;
      }

      tbody.innerHTML = marksRows.map(m => `
        <tr>
          <td><strong style="color:var(--primary); font-family:var(--font-mono);">#${m.roll_no || '--'}</strong></td>
          <td><strong>${m.first_name} ${m.last_name}</strong><br><small style="color:var(--text-dim);">${m.admission_no}</small></td>
          <td><span style="color:var(--secondary); font-weight:600;">📞 ${m.parent_phone || 'None'}</span></td>
          <td>${m.subject_name} (${m.subject_code || 'SUB'})</td>
          <td><strong>${m.marks_obtained}</strong> / ${m.max_marks || 100}</td>
          <td><span class="${m.is_pass ? 'pass-tag' : 'fail-tag'}">${m.grade_letter}</span></td>
          <td>
            ${m.is_pass 
              ? '<span style="color:#34d399; font-weight:700;">Passed</span>' 
              : '<span class="fail-tag" title="Score <= 33 is declared Fail per school rule">FAILED (Must Bring Father)</span>'
            }
          </td>
          <td>
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="App.openReportCard(${m.student_id})">
              📜 Card
            </button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" style="color:var(--danger); text-align:center;">Failed to load class grades.</td></tr>`;
    }
  },

  async loadClassHubAssignments() {
    const isStudent = this.currentUser?.role === 'student';
    const btnStuSub = document.getElementById('btnStudentSubmitAssignment');
    const btnAddAss = document.getElementById('btnAddAssignment');
    const subWrapper = document.getElementById('studentSubmissionsWrapper');

    if (btnStuSub) btnStuSub.style.display = isStudent ? 'inline-flex' : 'none';
    if (btnAddAss) btnAddAss.style.display = isStudent ? 'none' : 'inline-flex';
    if (subWrapper) subWrapper.style.display = 'block';

    const tbody = document.getElementById('classAssignmentsTableBody');
    if (!tbody) return;

    try {
      const assignments = await API.getAssignments({ class_id: this.activeHubClassId });
      if (assignments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">No assignments or tests recorded for this class yet. ${isStudent ? 'Check back soon!' : 'Click "+ Add Assignment / Test" to post.'}</td></tr>`;
      } else {
        tbody.innerHTML = assignments.map(a => `
          <tr>
            <td><strong>${a.title}</strong><br><small style="color:var(--text-dim);">${a.test_topic || a.description || 'No extra notes'}</small></td>
            <td>${a.subject_name || 'General'}</td>
            <td><span class="status-pill active">${a.type || a.assignment_type || 'Homework'}</span></td>
            <td><strong style="color:#fbbf24;">${a.test_date ? a.test_date.split('T')[0] : (a.due_date ? a.due_date.split('T')[0] : 'N/A')}</strong></td>
            <td>${a.total_marks || a.max_marks || 25}</td>
            <td><span class="status-pill ${a.status === 'Active' ? 'paid' : 'pending'}">${a.status || 'Active'}</span></td>
            <td>
              ${isStudent ? `
                <button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem; background:linear-gradient(135deg, var(--secondary), var(--accent-purple)); border:none;" onclick="App.openSubmitAssignmentModal(${a.id})">
                  📤 Submit
                </button>
              ` : `
                <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="App.openEditAssignmentModal(${a.id})">
                  ✏️ Edit
                </button>
              `}
            </td>
          </tr>
        `).join('');
      }

      // Always load the submission history table
      await this.loadStudentSubmissions();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger); text-align:center;">Failed to load assignments.</td></tr>`;
    }
  },

  async openSubmitAssignmentModal(selectedAssignmentId = null) {
    if (!this.currentUser || this.currentUser.role !== 'student') {
      this.toast('Only logged-in students can submit assignments to teachers.', 'warning');
      return;
    }

    const modal = document.getElementById('submitAssignmentModal');
    if (!modal) return;

    try {
      const classId = this.activeHubClassId || this.currentUser.classId;
      const assignments = await API.getAssignments({ class_id: classId });
      if (!this.teachersList || this.teachersList.length === 0) {
        this.teachersList = await API.getTeachers();
      }

      const assSelect = document.getElementById('subAssignmentSelect');
      if (assSelect) {
        assSelect.innerHTML = `<option value="">Choose Assignment / Test</option>` + assignments.map(a => `
          <option value="${a.id}" ${selectedAssignmentId && a.id == selectedAssignmentId ? 'selected' : ''}>
            ${a.title} (${a.subject_name || 'General'} - Due: ${a.test_date ? a.test_date.split('T')[0] : 'N/A'})
          </option>
        `).join('');
      }

      const tchSelect = document.getElementById('subTeacherSelect');
      if (tchSelect) {
        tchSelect.innerHTML = `<option value="">Choose Teacher to Evaluate</option>` + this.teachersList.map(t => `
          <option value="${t.id}">
            ${t.first_name} ${t.last_name} (${t.role_designation || 'Teacher'}${t.subject_specialization ? ` - ${t.subject_specialization}` : ''})
          </option>
        `).join('');
      }

      document.getElementById('subTitleInput').value = '';
      document.getElementById('subContentInput').value = '';
      this.openModal('submitAssignmentModal');
    } catch (err) {
      this.toast('Failed to load assignment submission form', 'error');
    }
  },

  onSubmissionAssignmentChange(assId) {
    if (!assId) return;
    const titleInput = document.getElementById('subTitleInput');
    const select = document.getElementById('subAssignmentSelect');
    if (titleInput && select && select.selectedOptions[0]) {
      const text = select.selectedOptions[0].text;
      titleInput.value = `Completed: ${text.split('(')[0].trim()}`;
    }
  },

  async handleAssignmentSubmission(e) {
    e.preventDefault();
    if (!this.currentUser || this.currentUser.role !== 'student') return;

    const assignment_id = document.getElementById('subAssignmentSelect').value;
    const teacher_id = document.getElementById('subTeacherSelect').value;
    const submission_title = document.getElementById('subTitleInput').value.trim();
    const submission_content = document.getElementById('subContentInput').value.trim();

    if (!assignment_id || !teacher_id || !submission_content) {
      this.toast('Please select an assignment, select a teacher, and write your submission content.', 'warning');
      return;
    }

    try {
      const payload = {
        assignment_id: parseInt(assignment_id, 10),
        student_id: this.currentUser.studentId,
        teacher_id: parseInt(teacher_id, 10),
        submission_title,
        submission_content
      };

      const res = await API.submitAssignment(payload);
      this.toast(res.message || 'Assignment submitted successfully to teacher!', 'success');
      this.closeModal('submitAssignmentModal');
      document.getElementById('submitAssignmentForm').reset();
      await this.loadStudentSubmissions();
    } catch (err) {
      this.toast(err.message || 'Failed to submit assignment', 'error');
    }
  },

  async loadStudentSubmissions() {
    const tbody = document.getElementById('studentSubmissionsTableBody');
    if (!tbody) return;

    try {
      const isStudent = this.currentUser?.role === 'student';
      const params = {};
      if (isStudent) {
        params.student_id = this.currentUser.studentId;
      } else if (this.currentUser?.role === 'teacher') {
        params.teacher_id = this.currentUser.teacherId;
      }

      const subs = await API.getAssignmentSubmissions(params);
      if (!subs || subs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted); font-size:0.85rem;">No assignment submissions recorded yet.</td></tr>`;
        return;
      }

      tbody.innerHTML = subs.map(s => `
        <tr>
          <td>
            <strong>${s.submission_title || 'Homework Submission'}</strong><br>
            <small style="color:var(--text-dim); display:block; max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              ${s.submission_content ? s.submission_content.substring(0, 60) + '...' : ''}
            </small>
          </td>
          <td>${s.assignment_title || 'Assignment'} <small style="color:var(--text-dim);">(${s.subject_name || 'General'})</small></td>
          <td>👨‍🏫 <strong>${s.teacher_first_name} ${s.teacher_last_name}</strong></td>
          <td><span style="font-size:0.8rem; color:var(--text-dim);">${s.submitted_at ? s.submitted_at.replace('T', ' ').substring(0, 16) : 'Recently'}</span></td>
          <td>
            <span class="status-pill ${s.status === 'Graded' || s.status === 'Reviewed' ? 'paid' : 'active'}">
              ${s.status || 'Submitted'}
            </span>
          </td>
          <td>
            ${s.grade_score ? `<strong style="color:#34d399;">Score: ${s.grade_score}</strong><br>` : ''}
            <span style="font-size:0.82rem; color:var(--text-dim);">${s.teacher_feedback || 'Pending evaluation'}</span>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger); text-align:center;">Failed to load submissions.</td></tr>`;
    }
  },

  openEditAssignmentModal(assignmentId) {
    this.openModal('newAssignmentModal');
  },

  async loadClassHubTimetable() {
    const grid = document.getElementById('classTimetableGrid');
    if (!grid) return;

    try {
      const timetable = await API.getClassTimetable(this.activeHubClassId);
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      
      grid.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
          ${days.map(day => {
            const daySlots = timetable.filter(s => s.day_of_week === day);
            return `
              <div class="panel" style="background:rgba(255,255,255,0.02); border:1px solid var(--border-color); padding:14px; border-radius:var(--radius-md);">
                <div style="font-weight:700; color:var(--primary); font-size:1.05rem; margin-bottom:10px; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                  📅 ${day}
                </div>
                ${daySlots.length === 0 ? '<div style="font-size:0.8rem; color:var(--text-muted);">No slots scheduled</div>' : daySlots.map(s => `
                  <div style="margin-bottom:8px; padding:8px 10px; background:rgba(255,255,255,0.04); border-radius:6px; font-size:0.82rem;">
                    <div style="display:flex; justify-content:space-between; font-weight:700;">
                      <span>${s.subject_name || 'Subject'}</span>
                      <span style="color:#fbbf24;">${s.start_time ? s.start_time.substring(0, 5) : ''} - ${s.end_time ? s.end_time.substring(0, 5) : ''}</span>
                    </div>
                    <div style="color:var(--text-dim); margin-top:2px;">👨‍🏫 ${s.teacher_name || 'Faculty Member'}</div>
                  </div>
                `).join('')}
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch (err) {
      grid.innerHTML = `<div style="color:var(--danger); text-align:center;">Failed to load timetable.</div>`;
    }
  },

  // Notice Board Sub-Tabs
  switchNoticeBoardTab(tab) {
    this.noticeBoardTab = tab;
    const btnB = document.getElementById('tabNoticeBulletinsBtn');
    const btnM = document.getElementById('tabNoticeMeetingsBtn');
    const btnR = document.getElementById('tabNoticeRulesBtn');
    const secB = document.getElementById('noticeSecBulletins');
    const secM = document.getElementById('noticeSecMeetings');
    const secR = document.getElementById('noticeSecRules');

    if (btnB) btnB.classList.toggle('active', tab === 'bulletins');
    if (btnM) btnM.classList.toggle('active', tab === 'meetings');
    if (btnR) btnR.classList.toggle('active', tab === 'rules');

    if (secB) secB.style.display = (tab === 'bulletins') ? 'block' : 'none';
    if (secM) secM.style.display = (tab === 'meetings') ? 'block' : 'none';
    if (secR) secR.style.display = (tab === 'rules') ? 'block' : 'none';

    if (tab === 'bulletins') this.renderNotices();
    else if (tab === 'meetings') this.renderMeetingsHub();
    else if (tab === 'rules') this.renderRulesHub();
  },

  async renderMeetingsHub() {
    const container = document.getElementById('meetingsFeedHub');
    if (!container) return;
    try {
      const meetings = await API.getMeetings();
      if (meetings.length === 0) {
        container.innerHTML = `<div class="panel" style="text-align:center; padding:32px; color:var(--text-muted);">No principal meetings scheduled yet.</div>`;
        return;
      }
      container.innerHTML = meetings.map(m => `
        <div class="panel" style="margin-bottom:14px; border-left:4px solid var(--primary);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
            <div>
              <h3 style="margin:0 0 4px 0; font-size:1.15rem;">${m.title}</h3>
              <div style="font-size:0.84rem; color:var(--text-muted);">
                Arranged by <strong>Principal Musharaf Khan</strong> • 📅 ${m.meeting_date} at ${m.start_time}
              </div>
            </div>
            <span class="status-pill active">${m.status}</span>
          </div>
          <p style="color:var(--text-muted); font-size:0.88rem; margin:8px 0;">${m.agenda}</p>
          <div style="font-size:0.8rem; color:var(--text-dim);">📍 Location: ${m.location || 'Principal Office'} • Attendees: ${m.attendees || 'Faculty'}</div>
        </div>
      `).join('');
    } catch (e) {
      container.innerHTML = `<div style="color:var(--danger);">Failed to load meetings.</div>`;
    }
  },

  async renderRulesHub() {
    const container = document.getElementById('rulesFeedHub');
    if (!container) return;
    try {
      const rules = await API.getRules();
      if (rules.length === 0) {
        container.innerHTML = `<div class="panel" style="text-align:center; padding:32px; color:var(--text-muted);">No rules published yet.</div>`;
        return;
      }
      container.innerHTML = rules.map(r => `
        <div class="panel" style="margin-bottom:14px; border-left:4px solid #f59e0b;">
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span class="status-pill" style="background:rgba(245,158,11,0.15); color:#fbbf24;">${r.category}</span>
            <span style="font-size:0.75rem; color:var(--text-dim);">Authority: Principal Musharaf Khan</span>
          </div>
          <h3 style="margin:0 0 6px 0; font-size:1.1rem;">${r.title}</h3>
          <p style="color:var(--text-muted); font-size:0.88rem; margin:0 0 8px 0;">${r.description}</p>
          ${r.penalty_consequence ? `<div style="font-size:0.8rem; color:#f87171;">⚠️ Consequence: ${r.penalty_consequence}</div>` : ''}
        </div>
      `).join('');
    } catch (e) {
      container.innerHTML = `<div style="color:var(--danger);">Failed to load rules.</div>`;
    }
  },

  renderOfficialContact() {
    const s = this.schoolSettings || {};
    this.renderLogoElement(document.getElementById('officialLogoPreviewBox'), s);

    const isStudent = this.currentUser?.role === 'student';
    const uploadSec = document.getElementById('officialLogoUploadSection');
    const saveBtn = document.getElementById('btnSaveOfficialContact');
    const notice = document.getElementById('officialStudentNotice');

    if (uploadSec) uploadSec.style.display = isStudent ? 'none' : 'block';
    if (saveBtn) saveBtn.style.display = isStudent ? 'none' : 'inline-flex';
    if (notice) notice.style.display = isStudent ? 'block' : 'none';

    const form = document.getElementById('officialContactForm');
    if (form) {
      form.querySelectorAll('input, textarea').forEach(inp => {
        inp.readOnly = isStudent;
        if (isStudent) {
          inp.style.backgroundColor = 'rgba(255,255,255,0.03)';
          inp.style.cursor = 'default';
        } else {
          inp.style.backgroundColor = '';
          inp.style.cursor = '';
        }
      });
    }
  },

  filterStudentsByClass(classId) {
    this.loadView('students');
    const select = document.getElementById('studentClassFilter');
    if (select) {
      select.value = classId;
      this.renderStudents();
    }
  },

  viewClassTimetable(classId) {
    this.loadView('timetable');
    const select = document.getElementById('timetableClassSelect');
    if (select) {
      select.value = classId;
      this.renderTimetable();
    }
  },

  // -------------------------------------------------------------
  // 5. ATTENDANCE REGISTER VIEW (Students & Teacher Attendance)
  // -------------------------------------------------------------
  switchAttendanceTab(tab) {
    this.activeAttendanceTab = tab;
    const btnStu = document.getElementById('tabBtnStudentAtt');
    const btnTch = document.getElementById('tabBtnTeacherAtt');
    const stuPanel = document.getElementById('attendanceStudentPanel');
    const tchPanel = document.getElementById('attendanceTeacherPanel');

    if (tab === 'students') {
      btnStu.classList.add('active');
      btnTch.classList.remove('active');
      stuPanel.style.display = 'block';
      tchPanel.style.display = 'none';
      this.renderAttendance();
    } else {
      btnTch.classList.add('active');
      btnStu.classList.remove('active');
      tchPanel.style.display = 'block';
      stuPanel.style.display = 'none';
      this.renderTeacherAttendance();
    }
  },

  // Auto-calculate stats in real time
  recalculateAttendanceStats(records, isTeacher = false) {
    const total = records.length;
    const present = records.filter(r => r.status === 'Present').length;
    const absent = records.filter(r => r.status === 'Absent').length;
    const leave = records.filter(r => r.status === 'Leave' || r.status === 'Excused').length;
    const late = records.filter(r => r.status === 'Late').length;

    document.getElementById('attStatTotal').textContent = total;
    document.getElementById('attStatPresent').textContent = present;
    document.getElementById('attStatAbsent').textContent = absent;
    document.getElementById('attStatLeave').textContent = leave;
    document.getElementById('attStatLate').textContent = late;
  },

  async renderAttendance() {
    const dateInput = document.getElementById('attendanceDatePicker');
    const classSelect = document.getElementById('attendanceClassSelect');

    if (!dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    if (this.currentUser?.role === 'teacher' && this.currentUser.managedClassId && !classSelect.value) {
      classSelect.value = this.currentUser.managedClassId;
    }

    const date = dateInput.value;
    const classId = classSelect.value;
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">Loading attendance register...</td></tr>`;

    try {
      const data = await API.getAttendance(date, classId);
      this.activeAttendanceRecords = data.records;
      this.recalculateAttendanceStats(data.records);

      if (data.records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">No student records found for attendance.</td></tr>`;
        return;
      }

      tbody.innerHTML = data.records.map(r => `
        <tr>
          <td><strong style="color:#34d399;">#${r.roll_no || '1'}</strong></td>
          <td>
            <div class="student-name">${r.first_name} ${r.last_name}</div>
            <div class="student-sub">${r.admission_no}</div>
          </td>
          <td>${r.class_name ? `${r.class_name} (${r.class_section})` : 'N/A'}</td>
          <td><strong style="color:var(--secondary);">${r.parent_phone || '+92 322-9594616'}</strong></td>
          <td>
            <div class="attendance-actions">
              <button type="button" class="att-btn ${r.status === 'Present' ? 'selected-present' : ''}" onclick="App.setRecordStatus(${r.student_id}, 'Present', this)">
                Present
              </button>
              <button type="button" class="att-btn ${r.status === 'Late' ? 'selected-late' : ''}" onclick="App.setRecordStatus(${r.student_id}, 'Late', this)">
                Late
              </button>
              <button type="button" class="att-btn ${r.status === 'Excused' || r.status === 'Leave' ? 'selected-late' : ''}" onclick="App.setRecordStatus(${r.student_id}, 'Leave', this)">
                Leave
              </button>
              <button type="button" class="att-btn ${r.status === 'Absent' ? 'selected-absent' : ''}" onclick="App.setRecordStatus(${r.student_id}, 'Absent', this)">
                Absent
              </button>
            </div>
          </td>
          <td>
            <input type="text" class="form-control" style="padding:4px 8px; font-size:0.8rem; width:160px;" placeholder="Optional remarks" value="${r.notes || ''}" onchange="App.setRecordNotes(${r.student_id}, this.value)">
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger); text-align:center;">Failed to load attendance.</td></tr>`;
    }
  },

  setRecordStatus(studentId, status, btnElement) {
    const rec = this.activeAttendanceRecords.find(r => r.student_id === studentId);
    if (rec) rec.status = status;

    const parent = btnElement.parentElement;
    parent.querySelectorAll('.att-btn').forEach(b => {
      b.classList.remove('selected-present', 'selected-late', 'selected-absent');
    });
    btnElement.classList.add(status === 'Present' ? 'selected-present' : (status === 'Absent' ? 'selected-absent' : 'selected-late'));

    // Automatically recalculate stats in real time!
    this.recalculateAttendanceStats(this.activeAttendanceRecords);
  },

  setRecordNotes(studentId, notes) {
    const rec = this.activeAttendanceRecords.find(r => r.student_id === studentId);
    if (rec) rec.notes = notes;
  },

  async renderTeacherAttendance() {
    const dateInput = document.getElementById('teacherAttDatePicker');
    if (!dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    const tbody = document.getElementById('teacherAttTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">Loading faculty attendance register...</td></tr>`;

    try {
      const data = await API.getTeacherAttendance(dateInput.value);
      this.activeTeacherAttendanceRecords = data.records;
      this.recalculateAttendanceStats(data.records, true);

      tbody.innerHTML = data.records.map(t => `
        <tr>
          <td><strong>${t.employee_id}</strong></td>
          <td>
            <div style="font-weight:700;">${t.first_name} ${t.last_name}</div>
          </td>
          <td>
            <div>${t.role_designation || 'Teacher'}</div>
            <small style="color:var(--text-dim);">${t.managed_class_name ? `Class: ${t.managed_class_name}` : 'School Admin'}</small>
          </td>
          <td><strong style="color:var(--secondary);">${t.phone || 'N/A'}</strong></td>
          <td>
            <div class="attendance-actions">
              <button type="button" class="att-btn ${t.status === 'Present' ? 'selected-present' : ''}" onclick="App.setTeacherAttStatus(${t.teacher_id}, 'Present', this)">
                Present
              </button>
              <button type="button" class="att-btn ${t.status === 'Leave' ? 'selected-late' : ''}" onclick="App.setTeacherAttStatus(${t.teacher_id}, 'Leave', this)">
                Leave
              </button>
              <button type="button" class="att-btn ${t.status === 'Absent' ? 'selected-absent' : ''}" onclick="App.setTeacherAttStatus(${t.teacher_id}, 'Absent', this)">
                Absent
              </button>
              <button type="button" class="att-btn ${t.status === 'Late' ? 'selected-late' : ''}" onclick="App.setTeacherAttStatus(${t.teacher_id}, 'Late', this)">
                Late
              </button>
            </div>
          </td>
          <td>
            <input type="text" class="form-control" style="padding:4px 8px; font-size:0.8rem; width:160px;" placeholder="Optional remarks" value="${t.notes || ''}" onchange="App.setTeacherAttNotes(${t.teacher_id}, this.value)">
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger); text-align:center;">Failed to load teacher attendance.</td></tr>`;
    }
  },

  setTeacherAttStatus(teacherId, status, btnElement) {
    const rec = this.activeTeacherAttendanceRecords.find(r => r.teacher_id === teacherId);
    if (rec) rec.status = status;

    const parent = btnElement.parentElement;
    parent.querySelectorAll('.att-btn').forEach(b => {
      b.classList.remove('selected-present', 'selected-late', 'selected-absent');
    });
    btnElement.classList.add(status === 'Present' ? 'selected-present' : (status === 'Absent' ? 'selected-absent' : 'selected-late'));

    this.recalculateAttendanceStats(this.activeTeacherAttendanceRecords, true);
  },

  setTeacherAttNotes(teacherId, notes) {
    const rec = this.activeTeacherAttendanceRecords.find(r => r.teacher_id === teacherId);
    if (rec) rec.notes = notes;
  },

  markAllPresent() {
    if (this.activeAttendanceTab === 'students') {
      this.activeAttendanceRecords.forEach(r => r.status = 'Present');
      document.querySelectorAll('#attendanceStudentPanel .attendance-actions').forEach(actions => {
        actions.querySelectorAll('.att-btn').forEach(b => b.classList.remove('selected-present', 'selected-late', 'selected-absent'));
        const presentBtn = actions.querySelector('.att-btn:first-child');
        if (presentBtn) presentBtn.classList.add('selected-present');
      });
      this.recalculateAttendanceStats(this.activeAttendanceRecords);
    } else {
      this.activeTeacherAttendanceRecords.forEach(r => r.status = 'Present');
      document.querySelectorAll('#attendanceTeacherPanel .attendance-actions').forEach(actions => {
        actions.querySelectorAll('.att-btn').forEach(b => b.classList.remove('selected-present', 'selected-late', 'selected-absent'));
        const presentBtn = actions.querySelector('.att-btn:first-child');
        if (presentBtn) presentBtn.classList.add('selected-present');
      });
      this.recalculateAttendanceStats(this.activeTeacherAttendanceRecords, true);
    }
    this.toast('All marked Present. Click Save Attendance to commit.');
  },

  async saveCurrentAttendance() {
    if (this.activeAttendanceTab === 'students') {
      const date = document.getElementById('attendanceDatePicker').value;
      if (!date) return this.toast('Select a date first', 'error');

      try {
        const recordsToSave = this.activeAttendanceRecords.map(r => ({
          student_id: r.student_id,
          status: r.status === 'Unmarked' ? 'Present' : r.status,
          notes: r.notes || null
        }));

        await API.saveAttendance(date, recordsToSave);
        this.toast('Student attendance saved successfully!');
        this.renderAttendance();
      } catch (err) {
        this.toast('Failed to save student attendance', 'error');
      }
    } else {
      const date = document.getElementById('teacherAttDatePicker').value;
      if (!date) return this.toast('Select a date first', 'error');

      try {
        const recordsToSave = this.activeTeacherAttendanceRecords.map(r => ({
          teacher_id: r.teacher_id,
          status: r.status === 'Unmarked' ? 'Present' : r.status,
          notes: r.notes || null
        }));

        await API.saveTeacherAttendance(date, recordsToSave);
        this.toast('Faculty attendance saved successfully!');
        this.renderTeacherAttendance();
      } catch (err) {
        this.toast('Failed to save teacher attendance', 'error');
      }
    }
  },

  // -------------------------------------------------------------
  // 6. CLASS TIMETABLE & 30-MIN TEA BREAK
  // -------------------------------------------------------------
  async renderTimetable() {
    const classSelect = document.getElementById('timetableClassSelect');
    if (!classSelect.value && this.classesList.length > 0) {
      classSelect.value = this.classesList[0].id;
    }
    const classId = classSelect.value;
    const tbody = document.getElementById('timetableTableBody');
    if (!tbody || !classId) return;

    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">Loading class timetable...</td></tr>`;

    try {
      const slots = await API.getClassTimetable(classId);
      if (slots.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">No timetable periods added for this class yet. Click "+ Add Period" above.</td></tr>`;
        return;
      }

      tbody.innerHTML = slots.map(s => {
        if (s.is_break) {
          return `
            <tr class="timetable-break-card">
              <td><strong>Period #${s.period_number}</strong></td>
              <td><strong>${s.start_time} - ${s.end_time}</strong></td>
              <td colspan="2">
                <span class="tea-cup-icon">☕</span>
                <strong style="color:#fbbf24; font-size:1.05rem;">${s.break_label || '30-Minute Rest & Tea Break (Students & Teachers)'}</strong>
              </td>
              <td><span class="status-pill pending">Recess & Tea</span></td>
              <td>
                <button class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem;" onclick="App.deleteTimetableSlot(${s.id})">✕</button>
              </td>
            </tr>
          `;
        }

        return `
          <tr>
            <td><strong>Period #${s.period_number}</strong></td>
            <td><strong>${s.start_time} - ${s.end_time}</strong></td>
            <td><strong style="color:var(--text-main);">${s.subject_name}</strong></td>
            <td><span style="color:var(--secondary); font-weight:600;">👨‍🏫 ${s.teacher_name || 'Faculty'}</span></td>
            <td><span class="status-pill active">Academic</span></td>
            <td>
              <button class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem;" onclick="App.deleteTimetableSlot(${s.id})">✕</button>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger); text-align:center;">Failed to load timetable.</td></tr>`;
    }
  },

  async handleSaveTimetableSlot(e) {
    e.preventDefault();
    const classId = document.getElementById('ttSlotClassId').value;
    const isBreak = document.getElementById('ttIsBreak').checked;
    const data = {
      class_id: classId,
      period_number: parseInt(document.getElementById('ttPeriodNo').value, 10),
      start_time: document.getElementById('ttStartTime').value.trim(),
      end_time: document.getElementById('ttEndTime').value.trim(),
      subject_name: isBreak ? 'Recess / Tea Break' : document.getElementById('ttSubjectName').value.trim(),
      teacher_name: isBreak ? 'All Students & Faculty' : document.getElementById('ttTeacherName').value.trim(),
      is_break: isBreak ? 1 : 0,
      break_label: isBreak ? `${this.schoolSettings?.recess_break_minutes || 30}-Minute Rest & Tea Break` : null
    };

    try {
      await API.createTimetableSlot(data);
      this.toast('Timetable slot saved successfully!');
      this.closeModal('newTimetableSlotModal');
      document.getElementById('newTimetableForm').reset();
      const select = document.getElementById('timetableClassSelect');
      if (select) select.value = classId;
      this.renderTimetable();
    } catch (err) {
      this.toast(err.message || 'Failed to save timetable slot', 'error');
    }
  },

  async deleteTimetableSlot(id) {
    if (!confirm('Remove this timetable slot?')) return;
    try {
      await API.deleteTimetableSlot(id);
      this.toast('Period removed');
      this.renderTimetable();
    } catch (err) {
      this.toast('Failed to remove slot', 'error');
    }
  },

  // -------------------------------------------------------------
  // 7. GRADES & EXAMS VIEW (Grades ONLY, No GPA; Fail Notice <= 33)
  // -------------------------------------------------------------
  async renderGrades() {
    const examSelect = document.getElementById('gradesExamSelect');
    const classSelect = document.getElementById('gradesClassSelect');

    try {
      this.examsList = await API.getExams();
      examSelect.innerHTML = this.examsList.map(e => `
        <option value="${e.id}">${e.name} (${e.term})</option>
      `).join('');

      if (this.currentUser?.role === 'teacher' && this.currentUser.managedClassId) {
        classSelect.value = this.currentUser.managedClassId;
        classSelect.disabled = true;
      } else {
        classSelect.disabled = false;
      }

      this.fetchMarks();
    } catch (err) {
      this.toast('Failed to load exams', 'error');
    }
  },

  async fetchMarks() {
    const examId = document.getElementById('gradesExamSelect')?.value;
    let classId = document.getElementById('gradesClassSelect')?.value;

    if (this.currentUser?.role === 'teacher' && this.currentUser.managedClassId) {
      classId = this.currentUser.managedClassId;
    }

    const tbody = document.getElementById('gradesTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--text-muted);">Loading exam marks...</td></tr>`;

    try {
      const params = { exam_id: examId };
      if (classId) params.class_id = classId;

      if (this.currentUser?.role === 'student' && this.currentUser.studentId) {
        params.student_id = this.currentUser.studentId;
      }

      const marks = await API.getMarks(params);
      if (marks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--text-muted);">No marks recorded for this examination yet. Click "+ Enter Marks" to record scores.</td></tr>`;
        return;
      }

      tbody.innerHTML = marks.map(m => `
        <tr>
          <td><strong style="color:#34d399;">#${m.roll_no || '1'}</strong></td>
          <td>
            <strong>${m.first_name} ${m.last_name}</strong>
            <br><small style="color:var(--text-dim);">${m.class_name || ''}</small>
          </td>
          <td><strong style="color:var(--secondary);">${m.parent_phone || '+92 322-9594616'}</strong></td>
          <td>${m.subject_name} (${m.subject_code})</td>
          <td><strong>${m.marks_obtained}</strong> / ${m.max_marks}</td>
          <td>${m.percentage}%</td>
          <td>
            <span class="${m.is_pass ? 'pass-tag' : 'fail-tag'}">
              ${m.grade_letter}
            </span>
          </td>
          <td>
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="App.openReportCard(${m.student_id})">
              📜 Official Transcript
            </button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" style="color:var(--danger); text-align:center;">Failed to load marks.</td></tr>`;
    }
  },

  async openReportCard(studentId) {
    if (this.currentUser?.role === 'student' && this.currentUser?.studentId != studentId) {
      this.toast('Privacy Protection: You are only allowed to view your own grade report card.', 'warning');
      return;
    }
    try {
      const data = await API.getReportCard(studentId);
      const s = data.student;
      const sum = data.summary;

      this.renderLogoElement(document.getElementById('reportCardSchoolLogo'), this.schoolSettings);
      document.getElementById('rcSchoolName').textContent = this.schoolSettings?.school_name || 'EDUPULSE ACADEMY';
      document.getElementById('rcSchoolTagline').textContent = this.schoolSettings?.tagline || 'Excellence in Academic and Character Development';
      document.getElementById('rcStudentName').textContent = `${s.first_name} ${s.last_name}`;
      document.getElementById('rcAdmissionNo').textContent = s.admission_no;
      document.getElementById('rcClass').textContent = `${s.class_name} (${s.class_section})`;
      document.getElementById('rcRollNo').textContent = s.roll_no || '1';
      document.getElementById('rcFatherPhone').textContent = s.parent_phone || '+92 322-9594616';
      document.getElementById('rcDate').textContent = new Date().toLocaleDateString();

      const tbody = document.getElementById('rcTableBody');
      tbody.innerHTML = data.results.map(r => `
        <tr>
          <td><strong>${r.subject_name} (${r.subject_code})</strong></td>
          <td>${r.max_marks}</td>
          <td><strong>${r.marks_obtained}</strong></td>
          <td>${r.percentage}%</td>
          <td><span class="${r.isPass ? 'pass-tag' : 'fail-tag'}">${r.grade}</span></td>
          <td>${r.performance}</td>
        </tr>
      `).join('');

      document.getElementById('rcAverage').textContent = `${sum.averagePercentage}%`;
      document.getElementById('rcOverallGrade').innerHTML = sum.hasFailed 
        ? '<span class="fail-tag">FAIL</span>' 
        : `<span class="pass-tag">${sum.overallGrade}</span>`;

      // Fail Notice container if student scored <= 33 marks
      const failNotice = document.getElementById('rcFailNoticeContainer');
      if (failNotice) {
        if (sum.fatherConsultationRequired) {
          failNotice.style.display = 'block';
        } else {
          failNotice.style.display = 'none';
        }
      }

      this.openModal('reportCardModal');
    } catch (err) {
      this.toast('Could not generate report card', 'error');
    }
  },

  // -------------------------------------------------------------
  // 8. ASSIGNMENTS & TESTS VIEW (Teacher Authority)
  // -------------------------------------------------------------
  async renderAssignments() {
    const tbody = document.getElementById('assignmentsTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">Loading assignments and tests...</td></tr>`;

    try {
      let classId = document.getElementById('assignmentClassFilter')?.value || '';
      const type = document.getElementById('assignmentTypeFilter')?.value || '';

      if (this.currentUser?.role === 'teacher' && this.currentUser.managedClassId && !classId) {
        classId = this.currentUser.managedClassId;
        const select = document.getElementById('assignmentClassFilter');
        if (select) select.value = classId;
      }

      const params = {};
      if (classId) params.class_id = classId;
      if (type) params.type = type;

      const items = await API.getAssignments(params);
      if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">No assignments or tests scheduled. Click "+ Create Test / Assignment" above.</td></tr>`;
        return;
      }

      tbody.innerHTML = items.map(a => `
        <tr>
          <td>
            <span class="status-pill ${a.type === 'Test' ? 'urgent' : 'active'}">
              ${a.type === 'Test' ? '🎯 Test' : '📝 Assignment'}
            </span>
          </td>
          <td><strong>${a.class_name} (${a.class_section})</strong></td>
          <td>${a.subject_name}</td>
          <td>
            <div style="font-weight:700;">${a.title}</div>
            <div style="font-size:0.82rem; color:var(--secondary); margin-top:2px;">
              Topic: <strong>${a.test_topic}</strong>
            </div>
            ${a.instructions ? `<div style="font-size:0.75rem; color:var(--text-dim); margin-top:2px;">${a.instructions}</div>` : ''}
          </td>
          <td>
            <div>📅 <strong>${a.test_date ? a.test_date.split('T')[0] : 'N/A'}</strong></div>
            ${a.submission_date ? `<small style="color:var(--text-dim);">Due: ${a.submission_date.split('T')[0]}</small>` : ''}
          </td>
          <td><strong>${a.total_marks} Marks</strong></td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="App.openEditAssignment(${JSON.stringify(a).replace(/"/g, '&quot;')})">
                ✏️ Edit Topic & Date
              </button>
              ${(this.currentUser?.role === 'teacher' || this.currentUser?.role === 'admin') ? `
                <button class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem;" onclick="App.deleteAssignment(${a.id})">
                  ✕
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger); text-align:center;">Failed to load assignments.</td></tr>`;
    }
  },

  openEditAssignment(item) {
    document.getElementById('editAssignId').value = item.id;
    document.getElementById('editAssignTitle').value = item.title;
    document.getElementById('editAssignTopic').value = item.test_topic;
    document.getElementById('editAssignTestDate').value = item.test_date ? item.test_date.split('T')[0] : '';
    document.getElementById('editAssignSubDate').value = item.submission_date ? item.submission_date.split('T')[0] : '';
    document.getElementById('editAssignInstructions').value = item.instructions || '';

    this.openModal('editAssignmentModal');
  },

  async deleteAssignment(id) {
    if (!confirm('Are you sure you want to delete this test/assignment?')) return;
    try {
      await API.deleteAssignment(id);
      this.toast('Item removed successfully');
      this.renderAssignments();
    } catch (err) {
      this.toast('Failed to remove item', 'error');
    }
  },

  // -------------------------------------------------------------
  // 9. FEES VIEW (All Amounts in PKR)
  // -------------------------------------------------------------
  async renderFees() {
    const tbody = document.getElementById('feesTableBody');
    if (!tbody) return;

    try {
      const stats = await API.getFeeStats();
      document.getElementById('feeStatCollected').textContent = `PKR ${(stats.total_collected || 0).toLocaleString()}`;
      document.getElementById('feeStatPending').textContent = `PKR ${(stats.total_pending || 0).toLocaleString()}`;
      document.getElementById('feeStatOverdue').textContent = `PKR ${(stats.total_overdue || 0).toLocaleString()}`;

      const statusFilter = document.getElementById('feeStatusFilter')?.value || '';
      const params = {};
      if (statusFilter) params.status = statusFilter;

      if (this.currentUser?.role === 'student' && this.currentUser.studentId) {
        params.student_id = this.currentUser.studentId;
      }

      const fees = await API.getFees(params);
      if (fees.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:var(--text-muted);">No fee invoices found.</td></tr>`;
        return;
      }

      tbody.innerHTML = fees.map(f => `
        <tr>
          <td><strong>${f.invoice_no}</strong></td>
          <td>${f.first_name} ${f.last_name}<br><small style="color:var(--text-dim);">${f.admission_no}</small></td>
          <td><strong style="color:var(--secondary);">${f.parent_phone || '+92 322-9594616'}</strong></td>
          <td>${f.class_name ? `${f.class_name} (${f.class_section})` : 'Class'}</td>
          <td>${f.title}</td>
          <td><strong class="currency-pkr">PKR ${Number(f.amount).toLocaleString()}</strong></td>
          <td>${f.due_date ? f.due_date.split('T')[0] : 'N/A'}</td>
          <td>
            <span class="status-pill ${f.status === 'Paid' ? 'paid' : (f.status === 'Pending' ? 'pending' : 'overdue')}">
              ${f.status}
            </span>
          </td>
          <td>
            ${f.status !== 'Paid' ? `
              <button class="btn btn-success" style="padding:4px 8px; font-size:0.75rem;" onclick="App.recordPayment(${f.id})">
                💳 Pay in PKR
              </button>
            ` : `<span style="font-size:0.8rem; color:var(--text-dim);">${f.payment_method || 'Paid in PKR'}</span>`}
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="9" style="color:var(--danger); text-align:center;">Failed to load invoices.</td></tr>`;
    }
  },

  async recordPayment(feeId) {
    const method = prompt('Enter payment method (e.g. Cash, EasyPaisa, JazzCash, Bank Transfer):', 'Cash');
    if (!method) return;

    try {
      await API.markFeePaid(feeId, method);
      this.toast('Payment recorded in PKR successfully!');
      this.renderFees();
    } catch (err) {
      this.toast('Failed to record payment', 'error');
    }
  },

  // -------------------------------------------------------------
  // 10. MORNING ASSEMBLY VIEW (Arranged by PT Sir)
  // -------------------------------------------------------------
  async renderAssembly() {
    const container = document.getElementById('assemblyFeed');
    if (!container) return;

    container.innerHTML = `<div style="text-align:center; padding:32px; color:var(--text-muted);">Loading morning assembly schedule...</div>`;

    try {
      const records = await API.getAssembly();
      if (records.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:32px; color:var(--text-muted);">No morning assemblies recorded yet.</div>`;
        return;
      }

      container.innerHTML = records.map(a => `
        <div class="timeline-card" style="border-left: 4px solid var(--secondary);">
          <div class="timeline-header">
            <div>
              <span class="status-pill active" style="font-weight:700;">
                📅 ${a.assembly_date ? a.assembly_date.split('T')[0] : 'Today'}
              </span>
              <span style="margin-left:8px; font-size:0.85rem; color:var(--secondary); font-weight:700;">
                🏃 Arranged by: ${a.pt_sir_name || 'Tariq Mehmood (PT Sir)'}
              </span>
            </div>
            <span class="status-pill" style="background:rgba(16,185,129,0.15); color:#34d399;">
              Discipline: ${a.discipline_rating || 'Excellent'}
            </span>
          </div>

          <div class="form-grid" style="margin: 14px 0; font-size:0.9rem;">
            <div>
              <strong style="color:var(--text-dim);">📖 Tilawat-e-Quran:</strong>
              <div style="font-weight:600; color:var(--text-main);">${a.tilawat_student || 'Muhammad Ali'}</div>
            </div>
            <div>
              <strong style="color:var(--text-dim);">🌹 Naat-e-Rasool (SAW):</strong>
              <div style="font-weight:600; color:var(--text-main);">${a.naat_student || 'Ahmad Hassan'}</div>
            </div>
            <div class="full-width">
              <strong style="color:var(--text-dim);">🎙️ Moral Speech / Thought of the Day:</strong>
              <div style="font-weight:600; color:var(--primary); font-size:1.05rem; margin-top:2px;">"${a.speech_topic}"</div>
            </div>
            <div class="full-width" style="background:rgba(255,255,255,0.02); padding:10px 14px; border-radius:8px; border:1px dashed var(--border-color);">
              <strong style="color:var(--text-dim);">🤸 Physical Drills & Exercises (PT Sir):</strong>
              <div style="color:var(--text-main); margin-top:2px;">${a.drill_activity}</div>
            </div>
            ${a.special_announcement ? `
              <div class="full-width" style="background:rgba(245,158,11,0.08); padding:8px 12px; border-radius:6px; color:#fbbf24; font-size:0.85rem;">
                📢 <strong>Special Assembly Announcement:</strong> ${a.special_announcement}
              </div>
            ` : ''}
          </div>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<div style="color:var(--danger); text-align:center;">Failed to load assembly records.</div>`;
    }
  },

  // -------------------------------------------------------------
  // 11. PRINCIPAL MEETINGS VIEW (Principal Musharaf Khan Authority)
  // -------------------------------------------------------------
  async renderMeetings() {
    const container = document.getElementById('meetingsFeed');
    if (!container) return;

    container.innerHTML = `<div style="text-align:center; padding:32px; color:var(--text-muted);">Loading meetings...</div>`;

    try {
      const meetings = await API.getMeetings();
      if (meetings.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:32px; color:var(--text-muted);">No meetings scheduled by the Principal.</div>`;
        return;
      }

      container.innerHTML = meetings.map(m => `
        <div class="timeline-card" style="border-left: 4px solid #f59e0b;">
          <div class="timeline-header">
            <div>
              <span class="notice-badge-principal">👑 Arranged by: ${m.arranged_by || 'Principal Musharaf Khan'}</span>
              <span style="margin-left:10px; font-weight:700; color:var(--text-main); font-size:1.1rem;">${m.title}</span>
            </div>
            <span class="status-pill ${m.status === 'Completed' ? 'paid' : (m.status === 'Scheduled' ? 'pending' : 'urgent')}">
              ${m.status}
            </span>
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:16px; margin: 12px 0; font-size:0.85rem; color:var(--text-muted);">
            <div>📅 <strong>Date:</strong> ${m.meeting_date ? m.meeting_date.split('T')[0] : 'N/A'}</div>
            <div>⏰ <strong>Time:</strong> ${m.meeting_time}</div>
            <div>🏛️ <strong>Venue:</strong> ${m.venue || 'Principal Office'}</div>
            <div>👥 <strong>Attendees:</strong> ${m.attendees || 'All Teachers'}</div>
          </div>

          <div style="background:rgba(255,255,255,0.02); padding:12px; border-radius:8px; border:1px solid var(--border-color); font-size:0.88rem; color:var(--text-main);">
            <strong style="color:var(--text-dim); text-transform:uppercase; font-size:0.75rem; letter-spacing:0.5px;">Meeting Agenda:</strong>
            <p style="margin-top:4px; line-height:1.5;">${m.agenda}</p>
          </div>

          ${(this.currentUser?.role === 'principal' || this.currentUser?.role === 'admin') ? `
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
              ${m.status !== 'Completed' ? `
                <button class="btn btn-secondary" style="padding:4px 10px; font-size:0.75rem;" onclick="App.completeMeeting(${m.id})">
                  ✓ Mark Completed
                </button>
              ` : ''}
              <button class="btn btn-danger" style="padding:4px 10px; font-size:0.75rem;" onclick="App.deleteMeeting(${m.id})">
                Cancel Meeting
              </button>
            </div>
          ` : ''}
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<div style="color:var(--danger); text-align:center;">Failed to load meetings.</div>`;
    }
  },

  async completeMeeting(id) {
    try {
      await API.updateMeeting(id, { status: 'Completed' });
      this.toast('Meeting status marked Completed');
      this.renderMeetings();
    } catch (err) {
      this.toast('Failed to update meeting', 'error');
    }
  },

  async deleteMeeting(id) {
    if (!confirm('Cancel and delete this meeting?')) return;
    try {
      await API.deleteMeeting(id);
      this.toast('Meeting cancelled');
      this.renderMeetings();
    } catch (err) {
      this.toast('Failed to delete meeting', 'error');
    }
  },

  // -------------------------------------------------------------
  // 12. SCHOOL RULES VIEW (Principal Musharaf Khan Authority)
  // -------------------------------------------------------------
  async renderRules() {
    const container = document.getElementById('rulesFeed');
    if (!container) return;

    try {
      const category = document.getElementById('ruleCategoryFilter')?.value || '';
      const rules = await API.getRules(category);

      if (rules.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:32px; color:var(--text-muted);">No rules found for this category.</div>`;
        return;
      }

      container.innerHTML = rules.map((r, i) => `
        <div class="timeline-card">
          <div class="timeline-header">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-family:var(--font-display); font-size:1.15rem; font-weight:700;">#${i + 1}. ${r.title}</span>
              <span class="pill-rule-category">${r.category}</span>
            </div>
            <span class="notice-badge-principal">👑 Authorized by ${r.approved_by || 'Principal Musharaf Khan'}</span>
          </div>

          <p style="font-size:0.92rem; color:var(--text-main); line-height:1.5; margin: 10px 0;">
            ${r.description}
          </p>

          ${r.penalty_or_note ? `
            <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); border-radius:6px; padding:8px 12px; font-size:0.82rem; color:#fca5a5;">
              ⚠️ <strong>Directive & Penalty:</strong> ${r.penalty_or_note}
            </div>
          ` : ''}

          ${(this.currentUser?.role === 'principal' || this.currentUser?.role === 'admin') ? `
            <div style="display:flex; justify-content:flex-end; margin-top:10px;">
              <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="App.deleteRule(${r.id})">
                Remove Rule
              </button>
            </div>
          ` : ''}
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<div style="color:var(--danger); text-align:center;">Failed to load school rules.</div>`;
    }
  },

  async deleteRule(id) {
    if (!confirm('Remove this official school rule?')) return;
    try {
      await API.deleteRule(id);
      this.toast('Rule removed');
      this.renderRules();
    } catch (err) {
      this.toast('Failed to remove rule', 'error');
    }
  },

  // -------------------------------------------------------------
  // 13. NOTICES VIEW
  // -------------------------------------------------------------
  async renderNotices() {
    const container = document.getElementById('noticesFeedFull');
    if (!container) return;

    try {
      const notices = await API.getNotices();
      if (notices.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:32px; color:var(--text-muted);">No circulars posted yet.</div>`;
        return;
      }

      container.innerHTML = notices.map(n => `
        <div class="panel" style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
            <div>
              <div style="display:flex; gap:8px; align-items:center;">
                <span class="status-pill ${n.priority === 'Urgent' ? 'absent' : (n.priority === 'Important' ? 'pending' : 'active')}">
                  ${n.priority}
                </span>
                <span style="font-size:0.8rem; color:var(--secondary); font-weight:600;">Audience: ${n.audience}</span>
              </div>
              <h3 style="margin-top:8px; font-size:1.15rem; font-family:var(--font-display);">${n.title}</h3>
            </div>
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="font-size:0.8rem; color:var(--text-dim);">${n.date ? n.date.split('T')[0] : 'N/A'}</span>
              ${(this.currentUser?.role === 'admin' || this.currentUser?.role === 'principal') ? `
                <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="App.deleteNotice(${n.id})">
                  Remove
                </button>
              ` : ''}
            </div>
          </div>
          <p style="font-size:0.9rem; color:var(--text-muted); line-height:1.5;">${n.content}</p>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<div style="color:var(--danger); text-align:center;">Failed to load notices.</div>`;
    }
  },

  async deleteNotice(id) {
    if (!confirm('Remove this announcement?')) return;
    try {
      await API.deleteNotice(id);
      this.toast('Announcement removed');
      this.renderNotices();
    } catch (err) {
      this.toast('Failed to remove notice', 'error');
    }
  },

  // -------------------------------------------------------------
  // FORM SUBMISSION HANDLERS
  // -------------------------------------------------------------
  setupFormSubmissions() {
    // New Student Form (With Father Contact & Sequential Roll No)
    const studentForm = document.getElementById('newStudentForm');
    if (studentForm) {
      studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(studentForm);
        const data = Object.fromEntries(formData.entries());

        if (!data.parent_phone) {
          return this.toast('Father / Parent contact number is strictly required!', 'error');
        }

        try {
          await API.createStudent(data);
          this.toast('Student registered successfully in class with sequential roll number!');
          this.closeModal('newStudentModal');
          studentForm.reset();
          await this.preloadCommonData();
          if (this.currentView === 'students') this.renderStudents();
          if (this.currentView === 'dashboard') this.renderDashboard();
        } catch (err) {
          this.toast(err.message, 'error');
        }
      });
    }

    // New Teacher Form
    const teacherForm = document.getElementById('newTeacherForm');
    if (teacherForm) {
      teacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(teacherForm);
        const data = Object.fromEntries(formData.entries());

        try {
          await API.createTeacher(data);
          this.toast('Faculty member added successfully!');
          this.closeModal('newTeacherModal');
          teacherForm.reset();
          if (this.currentView === 'teachers') this.renderTeachers();
        } catch (err) {
          this.toast(err.message, 'error');
        }
      });
    }

    // New Class Form (Capacity 1 to 100, Fee in PKR)
    const classForm = document.getElementById('newClassForm');
    if (classForm) {
      classForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(classForm);
        const data = Object.fromEntries(formData.entries());

        try {
          const newCls = await API.createClass(data);
          this.toast(`New class "${data.name} (${data.section})" created successfully!`, 'success');
          this.closeModal('newClassModal');
          classForm.reset();
          await this.preloadCommonData();
          if (newCls && newCls.id) {
            this.activeHubClassId = newCls.id;
          }
          if (this.currentView === 'classes') this.renderClasses();
        } catch (err) {
          this.toast(err.message || 'Failed to create class', 'error');
        }
      });
    }

    // New Mark Form (Grades Only, Pass mark > 33)
    const markForm = document.getElementById('newMarkForm');
    if (markForm) {
      markForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(markForm);
        const data = Object.fromEntries(formData.entries());

        data.requesting_role = this.currentUser?.role || 'admin';
        data.managed_class_id = this.currentUser?.managedClassId || null;

        try {
          await API.saveMark(data);
          this.toast('Subject mark recorded successfully!');
          this.closeModal('newMarkModal');
          markForm.reset();
          if (this.currentView === 'grades') this.fetchMarks();
        } catch (err) {
          this.toast(err.message, 'error');
        }
      });
    }

    // New Fee Invoice Form (in PKR)
    const feeForm = document.getElementById('newFeeForm');
    if (feeForm) {
      feeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(feeForm);
        const data = Object.fromEntries(formData.entries());

        try {
          await API.createFee(data);
          this.toast('Fee invoice generated in PKR!');
          this.closeModal('newFeeModal');
          feeForm.reset();
          if (this.currentView === 'fees') this.renderFees();
          if (this.currentView === 'dashboard') this.renderDashboard();
        } catch (err) {
          this.toast(err.message, 'error');
        }
      });
    }

    // New Notice Form
    const noticeForm = document.getElementById('newNoticeForm');
    if (noticeForm) {
      noticeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(noticeForm);
        const data = Object.fromEntries(formData.entries());

        try {
          await API.createNotice(data);
          this.toast('Announcement published!');
          this.closeModal('newNoticeModal');
          noticeForm.reset();
          if (this.currentView === 'notices') this.renderNotices();
          if (this.currentView === 'dashboard') this.renderDashboard();
        } catch (err) {
          this.toast(err.message, 'error');
        }
      });
    }

    // New Meeting Form (Principal Authority)
    const meetingForm = document.getElementById('newMeetingForm');
    if (meetingForm) {
      meetingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(meetingForm);
        const data = Object.fromEntries(formData.entries());
        data.arranged_by = 'Principal Musharaf Khan';

        try {
          await API.createMeeting(data);
          this.toast('Meeting scheduled by Principal Musharaf Khan!');
          this.closeModal('newMeetingModal');
          meetingForm.reset();
          if (this.currentView === 'meetings') this.renderMeetings();
        } catch (err) {
          this.toast(err.message, 'error');
        }
      });
    }

    // New Rule Form (Principal Authority)
    const ruleForm = document.getElementById('newRuleForm');
    if (ruleForm) {
      ruleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(ruleForm);
        const data = Object.fromEntries(formData.entries());
        data.approved_by = 'Principal Musharaf Khan';

        try {
          await API.createRule(data);
          this.toast('School rule published!');
          this.closeModal('newRuleModal');
          ruleForm.reset();
          if (this.currentView === 'rules') this.renderRules();
        } catch (err) {
          this.toast(err.message, 'error');
        }
      });
    }

    // New Assignment / Test Form (Teacher Authority)
    const assignmentForm = document.getElementById('newAssignmentForm');
    if (assignmentForm) {
      assignmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(assignmentForm);
        const data = Object.fromEntries(formData.entries());
        if (this.currentUser?.teacherId) {
          data.teacher_id = this.currentUser.teacherId;
        }

        try {
          await API.createAssignment(data);
          this.toast('Test / Assignment created successfully!');
          this.closeModal('newAssignmentModal');
          assignmentForm.reset();
          if (this.currentView === 'assignments') this.renderAssignments();
        } catch (err) {
          this.toast(err.message, 'error');
        }
      });
    }

    // Edit Assignment / Test Form (Teacher Authority)
    const editAssignForm = document.getElementById('editAssignmentForm');
    if (editAssignForm) {
      editAssignForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editAssignId').value;
        const data = {
          title: document.getElementById('editAssignTitle').value,
          test_topic: document.getElementById('editAssignTopic').value,
          test_date: document.getElementById('editAssignTestDate').value,
          submission_date: document.getElementById('editAssignSubDate').value || null,
          instructions: document.getElementById('editAssignInstructions').value || null
        };

        try {
          await API.updateAssignment(id, data);
          this.toast('Test topic & date updated successfully!');
          this.closeModal('editAssignmentModal');
          if (this.currentView === 'assignments') this.renderAssignments();
        } catch (err) {
          this.toast(err.message, 'error');
        }
      });
    }

    // Morning Assembly Form (PT Sir Authority)
    const assemblyForm = document.getElementById('newAssemblyForm');
    if (assemblyForm) {
      assemblyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(assemblyForm);
        const data = Object.fromEntries(formData.entries());

        try {
          await API.saveAssembly(data);
          this.toast('Morning Assembly plan arranged by PT Sir saved!');
          this.closeModal('newAssemblyModal');
          assemblyForm.reset();
          if (this.currentView === 'assembly') this.renderAssembly();
        } catch (err) {
          this.toast(err.message, 'error');
        }
      });
    }
  }
};

window.App = App;
