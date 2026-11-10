# 🎓 School Management System (SMS)
### Professional Academic, Administrative & Student Management Portal
**Currency: PKR (Pakistani Rupee)**  
**Developer: Rafiq Haqyar**  
📱 **Contact:** `+92 322-9594616` | 📧 **Email:** `rafiqhaqyar524@gmail.com`  
🌐 **Source Repository:** [https://github.com/rafiqhaqyar/School-Management-System](https://github.com/rafiqhaqyar/School-Management-System)  
📦 **Direct Download (ZIP):** [Download Latest Release](https://github.com/rafiqhaqyar/School-Management-System/archive/refs/heads/main.zip)

---

## 🌟 Key System Features

1. **Self-Contained & Attached Database**:
   - Database schema and complete seed data (`database/schema.sql`) are directly attached to the project.
   - Automated 1-click database installer (`server/setup-db.js` / `install.bat`) creates the database and initializes all tables automatically without manual phpMyAdmin setup.

2. **Full Grade Range (Prep A to Class 8)**:
   - Full sequential grade structure: **Prep A, Prep B, Class 1, Class 2, Class 3, Class 4, Class 5, Class 6, Class 7, Class 8**.
   - **➕ Create New Class**: Easily add new classes with custom section, monthly fee (in PKR), room number, and capacity (1 to 100 students).
   - **🗑️ Remove Class**: One-click class removal with safety confirmation if a class was created by mistake.
   - **Clean Internal Header**: Class names and pill buttons display cleanly without cluttering fees; monthly tuition fees are displayed prominently once inside the dedicated internal class header.

3. **Multi-Role Security & Portal Logins**:
   - Role-based authorization for **Administrator**, **Principal (Musharaf Khan)**, **Teacher**, and **Student**.
   - Universal brute-force protection (lockout after 5 consecutive failed attempts).
   - Real-time password and username update directly saved to the MySQL database.
   - **Multi-Factor Account Recovery / Forgot Password**: Recover account via Gmail, Mobile Phone / Father's Contact Number, or Secret Security Word.

4. **Academic & Administrative Modules**:
   - **Student Management**: Sequential roll numbers, mandatory father/guardian contact numbers, and student privacy protection.
   - **Teacher Workload & Attendance**: Track due classes, completed classes, and remaining workload in real time.
   - **Principal Authority**: Manage high-level faculty meetings, formal school policies, and academic oversight.
   - **Morning Assembly Module**: Daily assembly schedules managed by PT Sir (Tariq Mehmood) with Tilawat, Naat, Speech topic, drill activity, and discipline ratings.
   - **Automated Attendance Register**: Daily attendance with real-time absent, leave, and present counters plus monthly attendance reports.
   - **Examinations & Report Cards**: Letter grade calculation (Pass mark > 33; 33 or below declares fail) without GPA.
   - **School Branding & Profile**: Editable school name, contact information, sports week dates, daily recess break, and SSD logo upload.

---

## 🚀 Easy Installation On Any Computer / System

### Method 1: One-Click Installer (Windows) — Recommended
1. **Download or Clone the project:**
   ```bash
   git clone https://github.com/rafiqhaqyar/School-Management-System.git
   cd "School Management System"
   ```
   *(Or download the [ZIP file](https://github.com/rafiqhaqyar/School-Management-System/archive/refs/heads/main.zip) and extract it).*

2. **Double-click `install.bat`**:
   - Checks if Node.js is installed.
   - Installs all dependencies (`npm install`).
   - Automatically connects to MySQL and creates `school-management-system` database.
   - Imports all tables and seed data automatically.

3. **Double-click `start.bat`**:
   - Launches the local server and automatically opens `http://localhost:3000` in your browser.

---

### Method 2: Manual Terminal Setup (Windows, macOS, Linux)

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Setup Attached Database:**
   ```bash
   npm run setup
   ```
   *(This connects to MySQL, creates the database, and seeds all default accounts, classes, and records).*

3. **Start Application:**
   ```bash
   npm start
   ```

4. **Access in Browser:**
   ```
   http://localhost:3000
   ```

---

## 🔑 Default Login Credentials

All demo accounts are pre-seeded and ready to use immediately:

| Role | Username | Password | Display Name / Incharge | Recovery Secret Word |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | System Administrator | `admin` |
| **Principal** | `principal` | `principal123` | Principal Musharaf Khan | `principal` |
| **Principal (Alt)** | `musharaf` | `musharaf123` | Principal Musharaf Khan | `musharaf` |
| **Teacher** | `teacher` | `teacher123` | David Miller (Class 8 Incharge) | `teacher` |
| **PT Sir** | `ptsir` | `ptsir123` | Tariq Mehmood (PT Instructor) | `ptsir` |
| **Student** | `student` | `student123` | Alexander Wright (Class 8) | `student` |

---

## ⚙️ Environment Configuration (`.env`)

The system works out of the box with default MySQL settings (root user without password). You can customize credentials in the `.env` file:

```env
PORT=3000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=school-management-system
```

---

## 📦 Database Backup & Export

To re-export the current live database at any time:
```bash
npm run db:export
```
This saves the latest snapshot directly to `database/schema.sql` and `database/database-backup.sql`.

---

## 👨‍💻 Developer & Support

- **Developer:** Rafiq Haqyar
- **WhatsApp / Phone:** `+92 322-9594616`
- **Email:** `rafiqhaqyar524@gmail.com`
- **GitHub Repository:** [https://github.com/rafiqhaqyar/School-Management-System](https://github.com/rafiqhaqyar/School-Management-System)
