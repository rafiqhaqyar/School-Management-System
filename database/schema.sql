-- ========================================================
-- School Management System (SMS) - MySQL Database Schema
-- Database: `school-management-system`
-- Target Server: MySQL 5.7+ / MariaDB / phpMyAdmin
-- ========================================================

CREATE DATABASE IF NOT EXISTS `school-management-system` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `school-management-system`;

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Table: classes
-- --------------------------------------------------------
DROP TABLE IF EXISTS `classes`;
CREATE TABLE `classes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `section` VARCHAR(50) NOT NULL,
  `room_number` VARCHAR(50) DEFAULT NULL,
  `capacity` INT DEFAULT 40,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_class_section` (`name`, `section`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: teachers
-- --------------------------------------------------------
DROP TABLE IF EXISTS `teachers`;
CREATE TABLE `teachers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` VARCHAR(50) NOT NULL UNIQUE,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(50) DEFAULT NULL,
  `subject_specialization` VARCHAR(150) DEFAULT NULL,
  `qualification` VARCHAR(150) DEFAULT NULL,
  `joining_date` DATE DEFAULT NULL,
  `salary` DECIMAL(10,2) DEFAULT 0.00,
  `status` ENUM('Active', 'On Leave', 'Inactive') DEFAULT 'Active',
  `avatar` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: subjects
-- --------------------------------------------------------
DROP TABLE IF EXISTS `subjects`;
CREATE TABLE `subjects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `class_id` INT DEFAULT NULL,
  `teacher_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_class_id` (`class_id`),
  KEY `idx_teacher_id` (`teacher_id`),
  CONSTRAINT `fk_subjects_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_subjects_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: students
-- --------------------------------------------------------
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admission_no` VARCHAR(50) NOT NULL UNIQUE,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `gender` ENUM('Male', 'Female', 'Other') DEFAULT 'Other',
  `dob` DATE DEFAULT NULL,
  `class_id` INT DEFAULT NULL,
  `roll_no` VARCHAR(50) DEFAULT NULL,
  `parent_name` VARCHAR(150) DEFAULT NULL,
  `parent_phone` VARCHAR(50) DEFAULT NULL,
  `parent_email` VARCHAR(150) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `status` ENUM('Active', 'Graduated', 'Suspended', 'Transferred') DEFAULT 'Active',
  `admission_date` DATE DEFAULT NULL,
  `avatar` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_student_class` (`class_id`),
  KEY `idx_student_status` (`status`),
  CONSTRAINT `fk_students_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: attendance
-- --------------------------------------------------------
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `status` ENUM('Present', 'Absent', 'Late', 'Excused') DEFAULT 'Present',
  `notes` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_student_date` (`student_id`, `date`),
  KEY `idx_attendance_date` (`date`),
  CONSTRAINT `fk_attendance_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: exams
-- --------------------------------------------------------
DROP TABLE IF EXISTS `exams`;
CREATE TABLE `exams` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `term` VARCHAR(50) NOT NULL,
  `session_year` VARCHAR(50) NOT NULL,
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: marks
-- --------------------------------------------------------
DROP TABLE IF EXISTS `marks`;
CREATE TABLE `marks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `exam_id` INT NOT NULL,
  `subject_id` INT NOT NULL,
  `marks_obtained` DECIMAL(5,2) NOT NULL,
  `max_marks` DECIMAL(5,2) DEFAULT 100.00,
  `remarks` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_student_exam_subject` (`student_id`, `exam_id`, `subject_id`),
  KEY `idx_marks_student` (`student_id`),
  KEY `idx_marks_exam` (`exam_id`),
  KEY `idx_marks_subject` (`subject_id`),
  CONSTRAINT `fk_marks_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_marks_exam` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_marks_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: fees
-- --------------------------------------------------------
DROP TABLE IF EXISTS `fees`;
CREATE TABLE `fees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_no` VARCHAR(50) NOT NULL UNIQUE,
  `student_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `due_date` DATE NOT NULL,
  `status` ENUM('Paid', 'Pending', 'Overdue') DEFAULT 'Pending',
  `paid_date` DATE DEFAULT NULL,
  `payment_method` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_fees_student` (`student_id`),
  KEY `idx_fees_status` (`status`),
  CONSTRAINT `fk_fees_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: notices
-- --------------------------------------------------------
DROP TABLE IF EXISTS `notices`;
CREATE TABLE `notices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `content` TEXT NOT NULL,
  `audience` ENUM('All', 'Students', 'Teachers', 'Parents') DEFAULT 'All',
  `priority` ENUM('Normal', 'Important', 'Urgent') DEFAULT 'Normal',
  `date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================================
-- Initial Demonstration Seed Data
-- ========================================================

-- Classes
INSERT INTO `classes` (`id`, `name`, `section`, `room_number`, `capacity`) VALUES
(1, 'Grade 9', 'A', 'Room 101', 35),
(2, 'Grade 9', 'B', 'Room 102', 35),
(3, 'Grade 10', 'A', 'Room 201', 35),
(4, 'Grade 10', 'B', 'Room 202', 35),
(5, 'Grade 11 - Science', 'A', 'Lab 301', 30),
(6, 'Grade 12 - Science', 'A', 'Lab 302', 30);

-- Faculty / Teachers
INSERT INTO `teachers` (`id`, `employee_id`, `first_name`, `last_name`, `email`, `phone`, `subject_specialization`, `qualification`, `joining_date`, `salary`, `status`) VALUES
(1, 'TCH-1001', 'David', 'Miller', 'david.miller@school.edu', '+1 555-0101', 'Mathematics', 'M.Sc Mathematics', '2021-08-15', 54000.00, 'Active'),
(2, 'TCH-1002', 'Sarah', 'Jenkins', 'sarah.j@school.edu', '+1 555-0102', 'Physics', 'Ph.D Physics', '2020-03-10', 58000.00, 'Active'),
(3, 'TCH-1003', 'Robert', 'Alvarez', 'robert.a@school.edu', '+1 555-0103', 'English Literature', 'M.A English', '2019-09-01', 52000.00, 'Active'),
(4, 'TCH-1004', 'Elena', 'Rostova', 'elena.r@school.edu', '+1 555-0104', 'Computer Science', 'M.S Computer Science', '2022-01-15', 62000.00, 'Active'),
(5, 'TCH-1005', 'Marcus', 'Chen', 'marcus.chen@school.edu', '+1 555-0105', 'Chemistry', 'M.Sc Chemistry', '2023-08-20', 51000.00, 'Active');

-- Subjects
INSERT INTO `subjects` (`id`, `code`, `name`, `class_id`, `teacher_id`) VALUES
(1, 'MATH-10', 'Advanced Mathematics', 3, 1),
(2, 'PHY-10', 'General Physics', 3, 2),
(3, 'ENG-10', 'World Literature', 3, 3),
(4, 'CS-10', 'Computer Programming', 3, 4),
(5, 'CHEM-10', 'Introductory Chemistry', 3, 5);

-- Students
INSERT INTO `students` (`id`, `admission_no`, `first_name`, `last_name`, `gender`, `dob`, `class_id`, `roll_no`, `parent_name`, `parent_phone`, `parent_email`, `address`, `status`, `admission_date`) VALUES
(1, 'ADM-2024-001', 'Alexander', 'Wright', 'Male', '2008-05-14', 3, '10A-01', 'Thomas Wright', '+1 555-0201', 't.wright@mail.com', '742 Evergreen Terrace, Springfield', 'Active', '2023-09-01'),
(2, 'ADM-2024-002', 'Sophia', 'Martinez', 'Female', '2008-09-22', 3, '10A-02', 'Carlos Martinez', '+1 555-0202', 'carlos.m@mail.com', '124 Conch Street, Riverdale', 'Active', '2023-09-01'),
(3, 'ADM-2024-003', 'Liam', 'Johnson', 'Male', '2008-11-03', 3, '10A-03', 'Karen Johnson', '+1 555-0203', 'karen.j@mail.com', '43 Oakwood Avenue, Brookline', 'Active', '2023-09-01'),
(4, 'ADM-2024-004', 'Emma', 'Watson', 'Female', '2008-04-18', 3, '10A-04', 'George Watson', '+1 555-0204', 'g.watson@mail.com', '98 Baker Street, Londonway', 'Active', '2023-09-01'),
(5, 'ADM-2024-005', 'Noah', 'Patel', 'Male', '2008-07-30', 3, '10A-05', 'Amit Patel', '+1 555-0205', 'amit.patel@mail.com', '15 Maple Lane, Sunnyvale', 'Active', '2023-09-01'),
(6, 'ADM-2024-006', 'Olivia', 'Kim', 'Female', '2008-02-11', 3, '10A-06', 'Sun-Woo Kim', '+1 555-0206', 'sw.kim@mail.com', '512 Pinecrest Blvd, Cambridge', 'Active', '2023-09-01'),
(7, 'ADM-2024-007', 'Ethan', 'Brooks', 'Male', '2008-12-05', 3, '10A-07', 'Diana Brooks', '+1 555-0207', 'dbrooks@mail.com', '88 High Street, Oxford', 'Active', '2023-09-01'),
(8, 'ADM-2024-008', 'Mia', 'Gomez', 'Female', '2008-08-19', 3, '10A-08', 'Luis Gomez', '+1 555-0208', 'lgomez@mail.com', '33 Sunset Blvd, Pasadena', 'Active', '2023-09-01'),
(9, 'ADM-2024-009', 'Lucas', 'Silva', 'Male', '2009-01-15', 1, '9A-01', 'Mateo Silva', '+1 555-0209', 'msilva@mail.com', '19 Horizon Way, Austin', 'Active', '2024-09-01'),
(10, 'ADM-2024-010', 'Isabella', 'Rossi', 'Female', '2007-06-25', 5, '11A-01', 'Marco Rossi', '+1 555-0210', 'mrossi@mail.com', '702 Cedar Drive, Seattle', 'Active', '2022-09-01');

-- Attendance
INSERT INTO `attendance` (`student_id`, `date`, `status`, `notes`) VALUES
(1, CURDATE(), 'Present', NULL),
(2, CURDATE(), 'Present', NULL),
(3, CURDATE(), 'Present', NULL),
(4, CURDATE(), 'Present', NULL),
(5, CURDATE(), 'Late', 'Bus delay'),
(6, CURDATE(), 'Present', NULL),
(7, CURDATE(), 'Absent', 'Medical leave'),
(8, CURDATE(), 'Present', NULL),
(9, CURDATE(), 'Present', NULL),
(10, CURDATE(), 'Present', NULL);

-- Exams
INSERT INTO `exams` (`id`, `name`, `term`, `session_year`, `start_date`, `end_date`) VALUES
(1, 'Mid-Term Examinations 2026', 'Term 1', '2025-2026', '2026-03-10', '2026-03-24');

-- Marks
INSERT INTO `marks` (`student_id`, `exam_id`, `subject_id`, `marks_obtained`, `max_marks`, `remarks`) VALUES
(1, 1, 1, 92.00, 100.00, 'Outstanding analytical ability'),
(1, 1, 2, 88.00, 100.00, 'Excellent lab work'),
(1, 1, 3, 85.00, 100.00, 'Very good essay structure'),
(1, 1, 4, 96.00, 100.00, 'Exceptional coding logic'),
(2, 1, 1, 89.00, 100.00, 'Great problem solving'),
(2, 1, 2, 94.00, 100.00, 'Top physics scorer'),
(2, 1, 3, 91.00, 100.00, 'Fluent and articulate'),
(2, 1, 4, 88.00, 100.00, 'Good project demonstration'),
(3, 1, 1, 74.00, 100.00, 'Consistent effort'),
(3, 1, 2, 79.00, 100.00, 'Solid understanding of concepts'),
(4, 1, 1, 95.00, 100.00, 'Flawless calculations');

-- Fees
INSERT INTO `fees` (`invoice_no`, `student_id`, `title`, `amount`, `due_date`, `status`, `paid_date`, `payment_method`) VALUES
('INV-2026-001', 1, 'Tuition Fee - Q1 2026', 1250.00, '2026-01-31', 'Paid', '2026-01-20', 'Bank Transfer'),
('INV-2026-002', 2, 'Tuition Fee - Q1 2026', 1250.00, '2026-01-31', 'Paid', '2026-01-18', 'Credit Card'),
('INV-2026-003', 3, 'Tuition Fee - Q1 2026', 1250.00, '2026-01-31', 'Pending', NULL, NULL),
('INV-2026-004', 4, 'Tuition Fee - Q1 2026', 1250.00, '2026-01-31', 'Paid', '2026-01-25', 'Online Portal'),
('INV-2026-005', 5, 'Tuition Fee - Q1 2026', 1250.00, '2026-02-15', 'Overdue', NULL, NULL),
('INV-2026-006', 6, 'Tuition Fee - Q1 2026', 1250.00, '2026-01-31', 'Paid', '2026-01-22', 'Bank Transfer');

-- Notices
INSERT INTO `notices` (`title`, `content`, `audience`, `priority`, `date`) VALUES
('Annual Science & Innovation Fair 2026', 'We are delighted to announce that our Annual Science Fair will be hosted on November 14th in the main auditorium. Students are encouraged to submit project proposals by next Friday.', 'All', 'Important', '2026-10-20'),
('Parent-Teacher Conference Scheduled', 'First term Parent-Teacher consultations will occur this Saturday from 9:00 AM to 3:00 PM. Appointment booking is available via the parent portal.', 'Parents', 'Urgent', '2026-10-22'),
('Curriculum Workshop for Faculty', 'Mandatory professional development workshop on STEM integration on Friday afternoon at 2:00 PM in Conference Room A.', 'Teachers', 'Normal', '2026-10-18');
