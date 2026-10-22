/**
 * School Management System - Main Interactive Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  currentView: 'dashboard',
  classesList: [],
  teachersList: [],
  examsList: [],
  activeAttendanceRecords: [],

  async init() {
    this.setupTheme();
    this.setupNavigation();
    this.setupGlobalEvents();
    this.setupSearch();
    await this.preloadCommonData();
    this.loadView('dashboard');
  },

  // Preload classes and teachers for select dropdowns
  async preloadCommonData() {
    try {
      this.classesList = await API.getClasses();
      this.teachersList = await API.getTeachers();
      this.examsList = await API.getExams();
      this.populateClassSelects();
    } catch (err) {
      console.warn('Could not preload all metadata:', err);
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
        opt.textContent = `${c.name} (${c.section})`;
        select.appendChild(opt);
      });
      if (currentVal) select.value = currentVal;
    });
  },

  // Theme Management (Sleek Dark Mode default)
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

  // SPA Navigation
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

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-view="${viewName}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Switch view section visibility
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Trigger view-specific data loader
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
      case 'grades':
        this.renderGrades();
        break;
      case 'fees':
        this.renderFees();
        break;
      case 'notices':
        this.renderNotices();
        break;
    }
  },

  // Global UI Setup (Modals, Toasts, Buttons)
  setupGlobalEvents() {
    // Modal Close buttons
    document.querySelectorAll('.modal-close, [data-modal-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
      });
    });

    // Close on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    });

    // Form Submissions
    this.setupFormSubmissions();
  },

  openModal(modalId) {
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

  // Live Search with Debounce
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
  // DASHBOARD VIEW
  // -------------------------------------------------------------
  async renderDashboard() {
    try {
      const data = await API.getDashboard();
      const m = data.metrics;

      // Update KPI numbers
      document.getElementById('kpiTotalStudents').textContent = m.totalStudents;
      document.getElementById('kpiTotalTeachers').textContent = m.totalTeachers;
      document.getElementById('kpiAttendanceRate').textContent = `${m.attendanceRate}%`;
      document.getElementById('kpiFeesCollected').textContent = `$${m.feeCollection.total_collected.toLocaleString()}`;

      // Render recent students table
      const studentTbody = document.getElementById('dashboardRecentStudents');
      if (studentTbody) {
        if (data.recentStudents.length === 0) {
          studentTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted)">No students recorded yet.</td></tr>`;
        } else {
          studentTbody.innerHTML = data.recentStudents.map(s => `
            <tr>
              <td>
                <div class="student-meta">
                  <div class="student-avatar">${s.first_name[0]}${s.last_name[0]}</div>
                  <div>
                    <div class="student-name">${s.first_name} ${s.last_name}</div>
                    <div class="student-sub">${s.admission_no}</div>
                  </div>
                </div>
              </td>
              <td>${s.class_name ? `${s.class_name} (${s.class_section})` : 'Unassigned'}</td>
              <td><span class="status-pill active">${s.status}</span></td>
              <td>
                <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.78rem;" onclick="App.viewStudentProfile(${s.id})">
                  View Profile
                </button>
              </td>
            </tr>
          `).join('');
        }
      }

      // Render notices feed
      const noticesFeed = document.getElementById('dashboardNoticesFeed');
      if (noticesFeed) {
        noticesFeed.innerHTML = data.recentNotices.map(n => `
          <div class="notice-item">
            <div class="notice-meta">
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

      // Render Class distribution badges
      const classDistContainer = document.getElementById('dashboardClassDist');
      if (classDistContainer) {
        classDistContainer.innerHTML = data.charts.classDist.map(c => `
          <div style="margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
              <span>${c.name}</span>
              <span style="font-weight:600;">${c.count} Students</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${Math.min(100, (c.count / 35) * 100)}%;"></div>
            </div>
          </div>
        `).join('');
      }
    } catch (err) {
      this.toast('Failed to load dashboard metrics', 'error');
    }
  },

  // -------------------------------------------------------------
  // STUDENTS VIEW
  // -------------------------------------------------------------
  async renderStudents(searchTerm = '') {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color:var(--text-muted)">Loading students roster...</td></tr>`;

    try {
      const classFilter = document.getElementById('studentClassFilter')?.value || '';
      const statusFilter = document.getElementById('studentStatusFilter')?.value || '';

      const students = await API.getStudents({
        search: searchTerm,
        class_id: classFilter,
        status: statusFilter
      });

      if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color:var(--text-muted)">No students found matching your criteria.</td></tr>`;
        return;
      }

      tbody.innerHTML = students.map(s => `
        <tr>
          <td>
            <div class="student-meta">
              <div class="student-avatar">${s.first_name[0]}${s.last_name[0]}</div>
              <div>
                <div class="student-name">${s.first_name} ${s.last_name}</div>
                <div class="student-sub">Roll: ${s.roll_no || 'N/A'}</div>
              </div>
            </div>
          </td>
          <td><strong>${s.admission_no}</strong></td>
          <td>${s.class_name ? `${s.class_name} (${s.class_section})` : '<span style="color:var(--text-dim)">Unassigned</span>'}</td>
          <td>${s.parent_name || 'N/A'}<br><small style="color:var(--text-dim);">${s.parent_phone || ''}</small></td>
          <td><span class="status-pill ${s.status === 'Active' ? 'active' : 'inactive'}">${s.status}</span></td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.78rem;" onclick="App.viewStudentProfile(${s.id})" title="Profile">
                👁️ View
              </button>
              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.78rem;" onclick="App.openReportCard(${s.id})" title="Report Card">
                📜 Transcript
              </button>
              <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.78rem;" onclick="App.deleteStudent(${s.id})" title="Delete">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger); text-align:center;">Failed to load students.</td></tr>`;
    }
  },

  async viewStudentProfile(studentId) {
    try {
      const s = await API.getStudent(studentId);
      document.getElementById('profileStudentName').textContent = `${s.first_name} ${s.last_name}`;
      document.getElementById('profileAdmissionNo').textContent = s.admission_no;
      document.getElementById('profileClass').textContent = s.class_name ? `${s.class_name} (${s.class_section})` : 'Unassigned';
      document.getElementById('profileRollNo').textContent = s.roll_no || 'N/A';
      document.getElementById('profileDob').textContent = s.dob || 'N/A';
      document.getElementById('profileGender').textContent = s.gender || 'N/A';
      document.getElementById('profileParentName').textContent = s.parent_name || 'N/A';
      document.getElementById('profileParentPhone').textContent = s.parent_phone || 'N/A';
      document.getElementById('profileAddress').textContent = s.address || 'N/A';

      // Attendance summary badge
      const att = s.attendance_summary;
      const attRate = att && att.total > 0 ? Math.round(((att.present + att.late) / att.total) * 100) : 100;
      document.getElementById('profileAttRate').textContent = `${attRate}% (${att.present || 0} Present, ${att.absent || 0} Absent)`;

      this.openModal('studentProfileModal');
    } catch (err) {
      this.toast('Could not fetch student profile', 'error');
    }
  },

  async deleteStudent(id) {
    if (!confirm('Are you sure you want to remove this student record?')) return;
    try {
      await API.deleteStudent(id);
      this.toast('Student record deleted successfully');
      this.renderStudents();
    } catch (err) {
      this.toast('Failed to delete student', 'error');
    }
  },

  // -------------------------------------------------------------
  // TEACHERS VIEW
  // -------------------------------------------------------------
  async renderTeachers(searchTerm = '') {
    const grid = document.getElementById('teachersGrid');
    if (!grid) return;

    grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:32px; color:var(--text-muted);">Loading faculty directory...</div>`;

    try {
      const teachers = await API.getTeachers({ search: searchTerm });
      if (teachers.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:32px; color:var(--text-muted);">No faculty members found.</div>`;
        return;
      }

      grid.innerHTML = teachers.map(t => `
        <div class="class-card">
          <div class="class-header">
            <div class="student-meta">
              <div class="student-avatar" style="background: linear-gradient(135deg, var(--accent-purple), var(--primary));">
                ${t.first_name[0]}${t.last_name[0]}
              </div>
              <div>
                <div class="student-name">${t.first_name} ${t.last_name}</div>
                <div class="student-sub">${t.employee_id}</div>
              </div>
            </div>
            <span class="status-pill active">${t.status}</span>
          </div>

          <div style="font-size:0.85rem; color:var(--text-muted); display:flex; flex-direction:column; gap:6px; margin: 14px 0;">
            <div>📘 <strong>Subject:</strong> ${t.subject_specialization || 'General'}</div>
            <div>🎓 <strong>Degree:</strong> ${t.qualification || 'N/A'}</div>
            <div>✉️ <strong>Email:</strong> ${t.email}</div>
            <div>📞 <strong>Phone:</strong> ${t.phone || 'N/A'}</div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:12px;">
            <span style="font-size:0.8rem; color:var(--text-dim);">Joined: ${t.joining_date || 'N/A'}</span>
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="App.deleteTeacher(${t.id})">
              Remove
            </button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      grid.innerHTML = `<div style="color:var(--danger); text-align:center;">Failed to load teachers.</div>`;
    }
  },

  async deleteTeacher(id) {
    if (!confirm('Are you sure you want to delete this teacher profile?')) return;
    try {
      await API.deleteTeacher(id);
      this.toast('Teacher removed successfully');
      this.renderTeachers();
    } catch (err) {
      this.toast('Failed to delete teacher', 'error');
    }
  },

  // -------------------------------------------------------------
  // CLASSES VIEW
  // -------------------------------------------------------------
  async renderClasses() {
    const grid = document.getElementById('classesGrid');
    if (!grid) return;

    try {
      this.classesList = await API.getClasses();
      grid.innerHTML = this.classesList.map(c => `
        <div class="class-card">
          <div class="class-header">
            <div>
              <div style="font-family:var(--font-display); font-size:1.2rem; font-weight:700;">${c.name}</div>
              <div style="font-size:0.82rem; color:var(--text-muted);">Section ${c.section} • ${c.room_number || 'Room TBD'}</div>
            </div>
            <span class="class-badge">${c.student_count} / ${c.capacity}</span>
          </div>

          <div style="margin: 16px 0;">
            <div style="display:flex; justify-content:space-between; font-size:0.78rem; color:var(--text-muted); margin-bottom:4px;">
              <span>Class Capacity</span>
              <span>${Math.round((c.student_count / c.capacity) * 100)}% Occupancy</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${Math.min(100, (c.student_count / c.capacity) * 100)}%;"></div>
            </div>
          </div>

          <div style="display:flex; gap:10px; margin-top:14px;">
            <button class="btn btn-secondary" style="flex:1; justify-content:center; font-size:0.8rem;" onclick="App.filterStudentsByClass(${c.id})">
              View Students
            </button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      grid.innerHTML = `<div style="color:var(--danger);">Failed to load classes.</div>`;
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

  // -------------------------------------------------------------
  // ATTENDANCE REGISTER VIEW
  // -------------------------------------------------------------
  async renderAttendance() {
    const dateInput = document.getElementById('attendanceDatePicker');
    const classSelect = document.getElementById('attendanceClassSelect');

    if (!dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    const date = dateInput.value;
    const classId = classSelect ? classSelect.value : '';

    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:var(--text-muted);">Loading class attendance roster...</td></tr>`;

    try {
      const data = await API.getAttendance(date, classId);
      this.activeAttendanceRecords = data.records;

      // Update summary cards
      document.getElementById('attStatTotal').textContent = data.summary.total;
      document.getElementById('attStatPresent').textContent = data.summary.present;
      document.getElementById('attStatAbsent').textContent = data.summary.absent;
      document.getElementById('attStatLate').textContent = data.summary.late;

      if (data.records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:var(--text-muted);">No active students found in this class.</td></tr>`;
        return;
      }

      tbody.innerHTML = data.records.map((r, idx) => `
        <tr data-student-id="${r.student_id}">
          <td><strong>${r.roll_no || idx + 1}</strong></td>
          <td>
            <div class="student-name">${r.first_name} ${r.last_name}</div>
            <div class="student-sub">${r.admission_no}</div>
          </td>
          <td>${r.class_name ? `${r.class_name} (${r.class_section})` : 'N/A'}</td>
          <td>
            <div class="attendance-actions">
              <button type="button" class="att-btn ${r.status === 'Present' ? 'selected-present' : ''}" onclick="App.setRecordStatus(${r.student_id}, 'Present', this)">
                Present
              </button>
              <button type="button" class="att-btn ${r.status === 'Late' ? 'selected-late' : ''}" onclick="App.setRecordStatus(${r.student_id}, 'Late', this)">
                Late
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
      tbody.innerHTML = `<tr><td colspan="5" style="color:var(--danger); text-align:center;">Failed to load attendance.</td></tr>`;
    }
  },

  setRecordStatus(studentId, status, btnElement) {
    const record = this.activeAttendanceRecords.find(r => r.student_id === studentId);
    if (record) {
      record.status = status;
    }

    // Toggle button styles
    const parent = btnElement.parentElement;
    parent.querySelectorAll('.att-btn').forEach(b => {
      b.className = 'att-btn';
    });
    if (status === 'Present') btnElement.classList.add('selected-present');
    if (status === 'Late') btnElement.classList.add('selected-late');
    if (status === 'Absent') btnElement.classList.add('selected-absent');
  },

  setRecordNotes(studentId, notes) {
    const record = this.activeAttendanceRecords.find(r => r.student_id === studentId);
    if (record) record.notes = notes;
  },

  markAllPresent() {
    this.activeAttendanceRecords.forEach(r => {
      r.status = 'Present';
    });
    document.querySelectorAll('#attendanceTableBody tr').forEach(tr => {
      const btns = tr.querySelectorAll('.att-btn');
      btns.forEach(b => b.className = 'att-btn');
      if (btns[0]) btns[0].classList.add('selected-present');
    });
    this.toast('All students marked Present');
  },

  async saveAttendance() {
    const date = document.getElementById('attendanceDatePicker').value;
    if (!date) {
      this.toast('Please select a valid date', 'error');
      return;
    }

    try {
      await API.saveAttendance(date, this.activeAttendanceRecords);
      this.toast('Attendance saved successfully!');
      this.renderAttendance();
    } catch (err) {
      this.toast('Failed to save attendance records', 'error');
    }
  },

  // -------------------------------------------------------------
  // GRADES & EXAMINATIONS VIEW
  // -------------------------------------------------------------
  async renderGrades() {
    const examSelect = document.getElementById('gradesExamSelect');
    try {
      this.examsList = await API.getExams();
      examSelect.innerHTML = this.examsList.map(e => `
        <option value="${e.id}">${e.name} (${e.term})</option>
      `).join('');

      this.fetchMarks();
    } catch (err) {
      this.toast('Failed to load exams', 'error');
    }
  },

  async fetchMarks() {
    const examId = document.getElementById('gradesExamSelect')?.value;
    const classId = document.getElementById('gradesClassSelect')?.value;
    const tbody = document.getElementById('gradesTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">Loading exam marks...</td></tr>`;

    try {
      const marks = await API.getMarks({ exam_id: examId, class_id: classId });
      if (marks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">No marks recorded for this examination yet. Click "+ Record Mark" above to enter scores.</td></tr>`;
        return;
      }

      tbody.innerHTML = marks.map(m => `
        <tr>
          <td>${m.roll_no || 'N/A'}</td>
          <td><strong>${m.first_name} ${m.last_name}</strong></td>
          <td>${m.subject_name} (${m.subject_code})</td>
          <td><strong>${m.marks_obtained}</strong> / ${m.max_marks}</td>
          <td>${m.percentage}%</td>
          <td><span class="status-pill active">${m.grade_letter} (GPA ${m.gpa})</span></td>
          <td>
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="App.openReportCard(${m.student_id})">
              Report Card
            </button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger); text-align:center;">Failed to load marks.</td></tr>`;
    }
  },

  async openReportCard(studentId) {
    try {
      const data = await API.getReportCard(studentId);
      const s = data.student;
      const sum = data.summary;

      document.getElementById('rcStudentName').textContent = `${s.first_name} ${s.last_name}`;
      document.getElementById('rcAdmissionNo').textContent = s.admission_no;
      document.getElementById('rcClass').textContent = `${s.class_name} (${s.class_section})`;
      document.getElementById('rcRollNo').textContent = s.roll_no || 'N/A';
      document.getElementById('rcDate').textContent = new Date().toLocaleDateString();

      const tbody = document.getElementById('rcTableBody');
      tbody.innerHTML = data.results.map(r => `
        <tr>
          <td>${r.subject_name} (${r.subject_code})</td>
          <td>${r.max_marks}</td>
          <td><strong>${r.marks_obtained}</strong></td>
          <td>${r.percentage}%</td>
          <td><strong>${r.grade}</strong></td>
          <td>${r.performance}</td>
        </tr>
      `).join('');

      document.getElementById('rcAverage').textContent = `${sum.averagePercentage}%`;
      document.getElementById('rcOverallGpa').textContent = sum.overallGpa;
      document.getElementById('rcOverallGrade').textContent = sum.overallGrade;

      this.openModal('reportCardModal');
    } catch (err) {
      this.toast('Could not generate report card', 'error');
    }
  },

  // -------------------------------------------------------------
  // FEES & FINANCES VIEW
  // -------------------------------------------------------------
  async renderFees() {
    const tbody = document.getElementById('feesTableBody');
    if (!tbody) return;

    try {
      const stats = await API.getFeeStats();
      document.getElementById('feeStatCollected').textContent = `$${(stats.total_collected || 0).toLocaleString()}`;
      document.getElementById('feeStatPending').textContent = `$${(stats.total_pending || 0).toLocaleString()}`;
      document.getElementById('feeStatOverdue').textContent = `$${(stats.total_overdue || 0).toLocaleString()}`;

      const statusFilter = document.getElementById('feeStatusFilter')?.value || '';
      const fees = await API.getFees({ status: statusFilter });

      if (fees.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">No fee invoices found.</td></tr>`;
        return;
      }

      tbody.innerHTML = fees.map(f => `
        <tr>
          <td><strong>${f.invoice_no}</strong></td>
          <td>${f.first_name} ${f.last_name}<br><small style="color:var(--text-dim);">${f.admission_no}</small></td>
          <td>${f.title}</td>
          <td><strong>$${f.amount.toLocaleString()}</strong></td>
          <td>${f.due_date}</td>
          <td>
            <span class="status-pill ${f.status === 'Paid' ? 'paid' : (f.status === 'Pending' ? 'pending' : 'overdue')}">
              ${f.status}
            </span>
          </td>
          <td>
            ${f.status !== 'Paid' ? `
              <button class="btn btn-success" style="padding:4px 8px; font-size:0.75rem;" onclick="App.recordPayment(${f.id})">
                💳 Mark Paid
              </button>
            ` : `<span style="font-size:0.8rem; color:var(--text-dim);">${f.payment_method || 'Paid'}</span>`}
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger); text-align:center;">Failed to load invoices.</td></tr>`;
    }
  },

  async recordPayment(feeId) {
    const method = prompt('Enter payment method (e.g. Bank Transfer, Cash, Card, Online):', 'Bank Transfer');
    if (!method) return;

    try {
      await API.markFeePaid(feeId, method);
      this.toast('Payment recorded successfully!');
      this.renderFees();
    } catch (err) {
      this.toast('Failed to record payment', 'error');
    }
  },

  // -------------------------------------------------------------
  // NOTICES VIEW
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
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
            <div>
              <div style="display:flex; align-items:center; gap:10px;">
                <span class="status-pill ${n.priority === 'Urgent' ? 'absent' : (n.priority === 'Important' ? 'pending' : 'active')}">
                  ${n.priority}
                </span>
                <span style="font-size:0.8rem; color:var(--secondary); font-weight:600;">Audience: ${n.audience}</span>
              </div>
              <h3 style="margin-top:8px; font-size:1.15rem; font-family:var(--font-display);">${n.title}</h3>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:0.8rem; color:var(--text-dim);">${n.date}</span>
              <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="App.deleteNotice(${n.id})">
                ✕
              </button>
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
    // New Student Form
    const studentForm = document.getElementById('newStudentForm');
    if (studentForm) {
      studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(studentForm);
        const data = Object.fromEntries(formData.entries());

        try {
          await API.createStudent(data);
          this.toast('Student registered successfully!');
          this.closeModal('newStudentModal');
          studentForm.reset();
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

    // New Class Form
    const classForm = document.getElementById('newClassForm');
    if (classForm) {
      classForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(classForm);
        const data = Object.fromEntries(formData.entries());

        try {
          await API.createClass(data);
          this.toast('Class created successfully!');
          this.closeModal('newClassModal');
          classForm.reset();
          await this.preloadCommonData();
          if (this.currentView === 'classes') this.renderClasses();
        } catch (err) {
          this.toast(err.message, 'error');
        }
      });
    }

    // New Invoice Form
    const feeForm = document.getElementById('newFeeForm');
    if (feeForm) {
      feeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(feeForm);
        const data = Object.fromEntries(formData.entries());

        try {
          await API.createFee(data);
          this.toast('Fee invoice generated!');
          this.closeModal('newFeeModal');
          feeForm.reset();
          if (this.currentView === 'fees') this.renderFees();
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

    // New Mark Form
    const markForm = document.getElementById('newMarkForm');
    if (markForm) {
      markForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(markForm);
        const data = Object.fromEntries(formData.entries());

        try {
          await API.saveMark(data);
          this.toast('Marks entered successfully!');
          this.closeModal('newMarkModal');
          markForm.reset();
          if (this.currentView === 'grades') this.fetchMarks();
        } catch (err) {
          this.toast(err.message, 'error');
        }
      });
    }
  }
};

window.App = App;
