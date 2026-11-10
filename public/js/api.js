/**
 * School Management System - Client API Service
 * Currency: PKR (Pakistani Rupee)
 * Developer: Rafiq Haqyar (923229594616, rafiqhaqyar524@gmail.com)
 */

const API = {
  // Generic Fetch Helper
  async request(endpoint, options = {}) {
    const url = `/api${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err = new Error(errorData.error || `Request failed with status ${response.status}`);
        err.data = errorData;
        err.status = response.status;
        throw err;
      }
      return await response.json();
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // Authentication & Registration
  login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  register(data) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateProfile(data) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  forgotPassword(data) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getAuthUsers() {
    return this.request('/auth/users');
  },

  // School Settings & Logo Upload from SSD
  getSettings() {
    return this.request('/settings');
  },

  updateSettings(data) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async uploadLogo(formData) {
    const response = await fetch('/api/settings/logo', {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to upload school logo');
    }
    return await response.json();
  },

  resetLogo() {
    return this.request('/settings/logo', { method: 'DELETE' });
  },

  // Stats / Dashboard
  getDashboard() {
    return this.request('/stats/dashboard');
  },

  // Students
  getStudents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/students${query ? '?' + query : ''}`);
  },

  getStudent(id) {
    return this.request(`/students/${id}`);
  },

  createStudent(data) {
    return this.request('/students', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateStudent(id, data) {
    return this.request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteStudent(id) {
    return this.request(`/students/${id}`, { method: 'DELETE' });
  },

  // Teachers
  getTeachers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/teachers${query ? '?' + query : ''}`);
  },

  getTeacher(id) {
    return this.request(`/teachers/${id}`);
  },

  createTeacher(data) {
    return this.request('/teachers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateTeacher(id, data) {
    return this.request(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteTeacher(id) {
    return this.request(`/teachers/${id}`, { method: 'DELETE' });
  },

  // Classes
  getClasses() {
    return this.request('/classes');
  },

  getClass(id) {
    return this.request(`/classes/${id}`);
  },

  createClass(data) {
    return this.request('/classes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateClass(id, data) {
    return this.request(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteClass(id) {
    return this.request(`/classes/${id}`, {
      method: 'DELETE'
    });
  },

  // Timetable & Breaks
  getClassTimetable(classId) {
    return this.request(`/timetable/${classId}`);
  },

  createTimetableSlot(data) {
    return this.request('/timetable', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateTimetableSlot(id, data) {
    return this.request(`/timetable/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteTimetableSlot(id) {
    return this.request(`/timetable/${id}`, { method: 'DELETE' });
  },

  // Attendance
  getAttendance(date, classId) {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (classId) params.append('class_id', classId);
    return this.request(`/attendance?${params.toString()}`);
  },

  saveAttendance(date, records) {
    return this.request('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify({ date, records })
    });
  },

  getClassMonthlyAttendance(classId, month) {
    const params = new URLSearchParams();
    if (classId) params.append('class_id', classId);
    if (month) params.append('month', month);
    return this.request(`/attendance/class-monthly?${params.toString()}`);
  },

  getStudentMonthlyAttendance(studentId) {
    return this.request(`/attendance/student-monthly/${studentId}`);
  },

  getTeacherAttendance(date) {
    const params = date ? `?date=${date}` : '';
    return this.request(`/attendance/teachers${params}`);
  },

  saveTeacherAttendance(date, records) {
    return this.request('/attendance/teachers/mark', {
      method: 'POST',
      body: JSON.stringify({ date, records })
    });
  },

  // Grades & Exams
  getExams() {
    return this.request('/grades/exams');
  },

  createExam(data) {
    return this.request('/grades/exams', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getMarks(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/grades/marks${query ? '?' + query : ''}`);
  },

  saveMark(data) {
    return this.request('/grades/marks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getReportCard(studentId) {
    return this.request(`/grades/report-card/${studentId}`);
  },

  // Fees (in PKR)
  getFees(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/fees${query ? '?' + query : ''}`);
  },

  getFeeStats() {
    return this.request('/fees/stats');
  },

  createFee(data) {
    return this.request('/fees', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  markFeePaid(id, paymentMethod) {
    return this.request(`/fees/${id}/pay`, {
      method: 'PUT',
      body: JSON.stringify({ payment_method: paymentMethod })
    });
  },

  // Notices
  getNotices(audience) {
    const params = audience ? `?audience=${audience}` : '';
    return this.request(`/notices${params}`);
  },

  createNotice(data) {
    return this.request('/notices', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  deleteNotice(id) {
    return this.request(`/notices/${id}`, { method: 'DELETE' });
  },

  // Meetings (Principal Authority)
  getMeetings(status) {
    const params = status ? `?status=${status}` : '';
    return this.request(`/meetings${params}`);
  },

  createMeeting(data) {
    return this.request('/meetings', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateMeeting(id, data) {
    return this.request(`/meetings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteMeeting(id) {
    return this.request(`/meetings/${id}`, { method: 'DELETE' });
  },

  // School Rules (Principal Authority)
  getRules(category) {
    const params = category ? `?category=${category}` : '';
    return this.request(`/rules${params}`);
  },

  createRule(data) {
    return this.request('/rules', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  deleteRule(id) {
    return this.request(`/rules/${id}`, { method: 'DELETE' });
  },

  // Assignments & Tests (Teacher Authority)
  getAssignments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/assignments${query ? '?' + query : ''}`);
  },

  createAssignment(data) {
    return this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateAssignment(id, data) {
    return this.request(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteAssignment(id) {
    return this.request(`/assignments/${id}`, { method: 'DELETE' });
  },

  // Student Assignment Submissions
  submitAssignment(data) {
    return this.request('/assignments/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getAssignmentSubmissions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/assignments/submissions${query ? '?' + query : ''}`);
  },

  updateSubmission(id, data) {
    return this.request(`/assignments/submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Morning Assembly (PT Sir Authority)
  getAssembly() {
    return this.request('/assembly');
  },

  saveAssembly(data) {
    return this.request('/assembly', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  deleteAssembly(id) {
    return this.request(`/assembly/${id}`, { method: 'DELETE' });
  }
};

window.API = API;
