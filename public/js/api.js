/**
 * School Management System - Client API Service
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
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
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

  createTeacher(data) {
    return this.request('/teachers', {
      method: 'POST',
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

  createClass(data) {
    return this.request('/classes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
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

  // Fees
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
  }
};

window.API = API;
