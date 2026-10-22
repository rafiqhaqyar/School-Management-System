# 🎓 EduPulse - School Management System (SMS)

A comprehensive, full-stack School Management System built with a Node.js/Express backend, SQLite database, and a modern, high-performance responsive web dashboard.

---

## 🌟 Key Features

1. **Dashboard & Analytics**
   - Live KPI overview (Total Students, Faculty Staff, Today's Attendance %, Tuition Collected).
   - Real-time class capacity meters and recent announcements feed.
   - Quick action shortcuts for student enrollment and circular publishing.

2. **Student Directory & Profiles**
   - Full student registration with admission number, class/section, roll number, and parent contact information.
   - Search & filtering by class and status.
   - Student profile modal with attendance rate and academic records.

3. **Faculty & Staff Directory**
   - Instructor directory with subject specialization, degrees, contact information, and status tracking.
   - Simple faculty enrollment and management.

4. **Class & Section Management**
   - Management of grade levels, sections, assigned rooms, and capacity utilization.
   - Instant filtering of student rosters by class.

5. **Daily Attendance Register**
   - Date picker and class selector.
   - 1-click status recording (**Present**, **Late**, **Absent**) with custom notes.
   - **"Mark All Present"** bulk action.
   - Real-time daily attendance KPI calculation.

6. **Examinations & Academic Grading**
   - Exam session tracking (Mid-term, Final, Term exams).
   - Subject-wise marks recording with automatic percentage, letter grade, and GPA calculations.
   - **Official Printable Academic Report Cards** with transcript formatting.

7. **Fee & Financial Billing**
   - Tuition invoice generation with due dates and student mapping.
   - Payment recording (Cash, Bank Transfer, Card, Online).
   - Summary statistics for Collected, Pending, and Overdue balances.

8. **Notice Board & Circulars**
   - Announcements targeted to All, Students, Faculty, or Parents.
   - Priority tagging (**Normal**, **Important**, **Urgent**).

9. **Sleek Dark / Light Mode**
   - Modern glassmorphic theme with persistent preferences.

---

## 🛠️ Technology Stack

- **Backend**: Node.js & Express 5
- **Database**: SQLite (via `better-sqlite3` with WAL mode)
- **Frontend**: Vanilla HTML5, Modern CSS3 (Glassmorphism, CSS Custom Properties), Vanilla JavaScript
- **Typography**: Google Fonts (*Plus Jakarta Sans* & *Outfit*)

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Git](https://git-scm.com/)

### 2. Installation
Clone the repository:
```bash
git clone https://github.com/rafiqhaqyar/School-Management-System.git
cd "School Management System"
```

Install dependencies:
```bash
npm install
```

### 3. Running Locally
Start the server:
```bash
npm start
```

Or run in development mode with auto-reload:
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status check |
| `GET` | `/api/stats/dashboard` | Dashboard analytics and KPI statistics |
| `GET` | `/api/students` | List students (supports `?search=`, `?class_id=`, `?status=`) |
| `GET` | `/api/students/:id` | Student profile dossier with attendance & marks |
| `POST` | `/api/students` | Enroll a new student |
| `PUT` | `/api/students/:id` | Update student profile |
| `DELETE`| `/api/students/:id` | Delete student record |
| `GET` | `/api/teachers` | List faculty members |
| `POST` | `/api/teachers` | Register new faculty member |
| `GET` | `/api/classes` | List classes with occupancy |
| `GET` | `/api/attendance` | Query attendance by date & class |
| `POST` | `/api/attendance/mark` | Batch record attendance |
| `GET` | `/api/grades/exams` | List examination sessions |
| `GET` | `/api/grades/marks` | Query student marks |
| `POST` | `/api/grades/marks` | Record or update student marks |
| `GET` | `/api/grades/report-card/:id` | Generate academic transcript data |
| `GET` | `/api/fees` | List tuition invoices |
| `POST` | `/api/fees` | Generate fee invoice |
| `PUT` | `/api/fees/:id/pay` | Record invoice payment |
| `GET` | `/api/fees/stats` | Financial collection totals |
| `GET` | `/api/notices` | List circular notices |
| `POST` | `/api/notices` | Publish announcement |

---

## 👤 Author
**Rafiq Haqyar**  
GitHub: [@rafiqhaqyar](https://github.com/rafiqhaqyar)
