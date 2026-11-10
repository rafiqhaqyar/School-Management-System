-- ========================================================
-- School Management System (SMS) - Self-Contained Database
-- Auto-Installer & Attached Standalone Schema
-- Currency: PKR (Pakistani Rupee)
-- Developer: Rafiq Haqyar (Contact: 923229594616, Email: rafiqhaqyar524@gmail.com)
-- Target: MySQL 5.7+ / MariaDB / phpMyAdmin / XAMPP / WampServer
-- Generated: 2026-11-10T11:03:21.001Z
-- ========================================================

CREATE DATABASE IF NOT EXISTS `school-management-system` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `school-management-system`;

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Table structure for `assembly_schedules`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `assembly_schedules`;
CREATE TABLE `assembly_schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assembly_date` date NOT NULL,
  `pt_sir_name` varchar(100) DEFAULT 'Tariq Mehmood (PT Sir)',
  `tilawat_student` varchar(150) DEFAULT 'Muhammad Ali',
  `naat_student` varchar(150) DEFAULT 'Ahmad Hassan',
  `speech_topic` varchar(255) DEFAULT 'Importance of Punctuality & Physical Fitness',
  `drill_activity` varchar(255) DEFAULT 'Morning PT & March-Past Drill',
  `special_announcement` text DEFAULT NULL,
  `discipline_rating` varchar(50) DEFAULT 'Excellent',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `assembly_date` (`assembly_date`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping seed data for table `assembly_schedules` (3 rows)
INSERT INTO `assembly_schedules` (`id`, `assembly_date`, `pt_sir_name`, `tilawat_student`, `naat_student`, `speech_topic`, `drill_activity`, `special_announcement`, `discipline_rating`, `created_at`) VALUES
(1, '2026-10-29 19:00:00', 'Tariq Mehmood (PT Sir)', 'Muhammad Bilal (Class 8)', 'Ahmad Raza (Class 7)', 'The Role of Physical Fitness and Discipline in Student Life', 'Jumping Jacks, Arm Rotations, March-Past in Sections', 'Mid-Term Exam Date Sheet announced by Principal Musharaf Khan', 'Outstanding', '2026-10-31 01:13:56'),
(2, '2026-10-28 19:00:00', 'Tariq Mehmood (PT Sir)', 'Usman Tariq (Class 6)', 'Hamza Khan (Class 5)', 'Respect for Teachers and School Property', 'Morning Calisthenics & Deep Breathing Exercises', 'Inter-class Cricket Tournament begins this Friday', 'Excellent', '2026-10-31 01:13:56'),
(3, '2026-01-08 19:00:00', 'Sir liaqat ali', 'qari awais ', 'zubair khan', 'hidayat ullah', 'Morning Calisthenics, Arm Drills & March-Past', 'Strickly follow  the assembly time , the time is 8 am', 'Outstanding', '2026-10-31 01:33:10');

-- --------------------------------------------------------
-- Table structure for `assignment_submissions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `assignment_submissions`;
CREATE TABLE `assignment_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assignment_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `submission_title` varchar(255) NOT NULL,
  `submission_content` text NOT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'Submitted',
  `teacher_feedback` text DEFAULT NULL,
  `grade_score` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assignment_id` (`assignment_id`),
  KEY `student_id` (`student_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `assignment_submissions_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `assignments_tests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `assignment_submissions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `assignment_submissions_ibfk_3` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping seed data for table `assignment_submissions` (1 rows)
INSERT INTO `assignment_submissions` (`id`, `assignment_id`, `student_id`, `teacher_id`, `submission_title`, `submission_content`, `submitted_at`, `status`, `teacher_feedback`, `grade_score`) VALUES
(1, 2, 1, 1, 'Factorization Questions 1-10 Solutions', 'Attached are all completed factorization steps for Ex 3.2 including Q1 to Q10 with quadratic formula.', '2026-10-31 03:58:03', 'Submitted', NULL, NULL);

-- --------------------------------------------------------
-- Table structure for `assignments_tests`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `assignments_tests`;
CREATE TABLE `assignments_tests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) NOT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `subject_name` varchar(150) NOT NULL,
  `title` varchar(200) NOT NULL,
  `test_topic` varchar(255) NOT NULL,
  `test_date` date NOT NULL,
  `submission_date` date DEFAULT NULL,
  `total_marks` decimal(5,2) DEFAULT 25.00,
  `type` enum('Test','Assignment') DEFAULT 'Test',
  `instructions` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_assign_class` (`class_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping seed data for table `assignments_tests` (2 rows)
INSERT INTO `assignments_tests` (`id`, `class_id`, `teacher_id`, `subject_name`, `title`, `test_topic`, `test_date`, `submission_date`, `total_marks`, `type`, `instructions`, `created_at`) VALUES
(1, 16, 1, 'Mathematics', 'Linear Equations Test', 'Chapter 4: Linear Equations & Graphs', '2026-11-01 19:00:00', NULL, '25.00', 'Test', 'Bring geometry box and scientific calculators.', '2026-10-31 01:13:56'),
(2, 16, 1, 'Mathematics', 'Algebra Homework Assignment', 'Exercise 3.2: Factorization Problem Set', '2026-10-30 19:00:00', '2026-11-02 19:00:00', '15.00', 'Assignment', 'Complete all questions neatly in mathematics homework notebook.', '2026-10-31 01:13:56');

-- --------------------------------------------------------
-- Table structure for `attendance`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `status` enum('Present','Absent','Late','Excused') DEFAULT 'Present',
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_student_date` (`student_id`,`date`),
  KEY `idx_attendance_date` (`date`),
  CONSTRAINT `fk_attendance_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping seed data for table `attendance` (29 rows)
INSERT INTO `attendance` (`id`, `student_id`, `date`, `status`, `notes`, `created_at`) VALUES
(1, 1, '2026-10-21 19:00:00', 'Present', NULL, '2026-10-22 16:40:18'),
(2, 2, '2026-10-21 19:00:00', 'Present', NULL, '2026-10-22 16:40:18'),
(3, 3, '2026-10-21 19:00:00', 'Present', NULL, '2026-10-22 16:40:18'),
(4, 4, '2026-10-21 19:00:00', 'Present', NULL, '2026-10-22 16:40:18'),
(5, 5, '2026-10-21 19:00:00', 'Late', 'Bus delay', '2026-10-22 16:40:18'),
(6, 6, '2026-10-21 19:00:00', 'Present', NULL, '2026-10-22 16:40:18'),
(7, 7, '2026-10-21 19:00:00', 'Absent', 'Medical leave', '2026-10-22 16:40:18'),
(8, 8, '2026-10-21 19:00:00', 'Present', NULL, '2026-10-22 16:40:18'),
(9, 9, '2026-10-21 19:00:00', 'Present', NULL, '2026-10-22 16:40:18'),
(10, 10, '2026-10-21 19:00:00', 'Present', NULL, '2026-10-22 16:40:18'),
(11, 1, '2026-10-20 19:00:00', '', NULL, '2026-10-22 16:50:34'),
(12, 2, '2026-10-20 19:00:00', '', NULL, '2026-10-22 16:50:34'),
(13, 3, '2026-10-20 19:00:00', '', NULL, '2026-10-22 16:50:34'),
(14, 4, '2026-10-20 19:00:00', '', NULL, '2026-10-22 16:50:34'),
(15, 5, '2026-10-20 19:00:00', '', NULL, '2026-10-22 16:50:34'),
(16, 6, '2026-10-20 19:00:00', '', NULL, '2026-10-22 16:50:34'),
(17, 7, '2026-10-20 19:00:00', '', NULL, '2026-10-22 16:50:34'),
(18, 8, '2026-10-20 19:00:00', '', NULL, '2026-10-22 16:50:34'),
(19, 10, '2026-10-20 19:00:00', '', NULL, '2026-10-22 16:50:34'),
(20, 11, '2026-10-20 19:00:00', 'Present', NULL, '2026-10-22 16:50:34'),
(21, 9, '2026-10-20 19:00:00', '', NULL, '2026-10-22 16:50:34'),
(22, 1, '2026-10-29 19:00:00', 'Present', NULL, '2026-10-31 02:37:00'),
(23, 12, '2026-10-29 19:00:00', 'Present', NULL, '2026-10-31 02:37:00'),
(24, 2, '2026-10-29 19:00:00', 'Absent', NULL, '2026-10-31 02:37:00'),
(28, 11, '2026-10-29 19:00:00', 'Present', NULL, '2026-10-31 03:21:43'),
(29, 11, '2026-09-29 19:00:00', 'Present', NULL, '2026-10-31 03:21:57'),
(30, 11, '2026-09-30 19:00:00', 'Present', NULL, '2026-10-31 03:22:09'),
(31, 5, '2026-09-30 19:00:00', 'Excused', NULL, '2026-10-31 03:22:55'),
(36, 13, '2026-10-29 19:00:00', 'Present', NULL, '2026-10-31 08:25:36');

-- --------------------------------------------------------
-- Table structure for `class_timetable`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `class_timetable`;
CREATE TABLE `class_timetable` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) NOT NULL,
  `day_of_week` varchar(20) NOT NULL,
  `period_number` int(11) NOT NULL,
  `start_time` varchar(20) NOT NULL,
  `end_time` varchar(20) NOT NULL,
  `subject_name` varchar(150) NOT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `teacher_name` varchar(150) DEFAULT NULL,
  `is_break` tinyint(1) DEFAULT 0,
  `break_label` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_timetable_class` (`class_id`),
  CONSTRAINT `fk_timetable_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping seed data for table `class_timetable` (60 rows)
INSERT INTO `class_timetable` (`id`, `class_id`, `day_of_week`, `period_number`, `start_time`, `end_time`, `subject_name`, `teacher_id`, `teacher_name`, `is_break`, `break_label`, `created_at`) VALUES
(1, 9, 'Daily (Mon-Sat)', 1, '08:00 AM', '08:45 AM', 'Mathematics', NULL, 'David Miller', 0, NULL, '2026-10-31 02:07:52'),
(2, 9, 'Daily (Mon-Sat)', 2, '08:45 AM', '09:30 AM', 'General Science', NULL, 'Sarah Jenkins', 0, NULL, '2026-10-31 02:07:52'),
(3, 9, 'Daily (Mon-Sat)', 3, '09:30 AM', '10:15 AM', 'English Literature', NULL, 'Robert Alvarez', 0, NULL, '2026-10-31 02:07:52'),
(4, 9, 'Daily (Mon-Sat)', 4, '10:15 AM', '10:45 AM', 'Recess / Tea Break', NULL, 'All Faculty & Students', 1, '30-Minute Rest & Tea Break', '2026-10-31 02:07:52'),
(5, 9, 'Daily (Mon-Sat)', 5, '10:45 AM', '11:30 AM', 'Urdu / Islamiat', NULL, 'Marcus Chen', 0, NULL, '2026-10-31 02:07:52'),
(6, 9, 'Daily (Mon-Sat)', 6, '11:30 AM', '12:15 PM', 'Physical Drill & Sports', NULL, 'Tariq Mehmood (PT Sir)', 0, NULL, '2026-10-31 02:07:52'),
(7, 10, 'Daily (Mon-Sat)', 1, '08:00 AM', '08:45 AM', 'Mathematics', NULL, 'David Miller', 0, NULL, '2026-10-31 02:07:52'),
(8, 10, 'Daily (Mon-Sat)', 2, '08:45 AM', '09:30 AM', 'General Science', NULL, 'Sarah Jenkins', 0, NULL, '2026-10-31 02:07:52'),
(9, 10, 'Daily (Mon-Sat)', 3, '09:30 AM', '10:15 AM', 'English Literature', NULL, 'Robert Alvarez', 0, NULL, '2026-10-31 02:07:52'),
(10, 10, 'Daily (Mon-Sat)', 4, '10:15 AM', '10:45 AM', 'Recess / Tea Break', NULL, 'All Faculty & Students', 1, '30-Minute Rest & Tea Break', '2026-10-31 02:07:52'),
(11, 10, 'Daily (Mon-Sat)', 5, '10:45 AM', '11:30 AM', 'Urdu / Islamiat', NULL, 'Marcus Chen', 0, NULL, '2026-10-31 02:07:52'),
(12, 10, 'Daily (Mon-Sat)', 6, '11:30 AM', '12:15 PM', 'Physical Drill & Sports', NULL, 'Tariq Mehmood (PT Sir)', 0, NULL, '2026-10-31 02:07:52'),
(13, 11, 'Daily (Mon-Sat)', 1, '08:00 AM', '08:45 AM', 'Mathematics', NULL, 'David Miller', 0, NULL, '2026-10-31 02:07:52'),
(14, 11, 'Daily (Mon-Sat)', 2, '08:45 AM', '09:30 AM', 'General Science', NULL, 'Sarah Jenkins', 0, NULL, '2026-10-31 02:07:52'),
(15, 11, 'Daily (Mon-Sat)', 3, '09:30 AM', '10:15 AM', 'English Literature', NULL, 'Robert Alvarez', 0, NULL, '2026-10-31 02:07:52'),
(16, 11, 'Daily (Mon-Sat)', 4, '10:15 AM', '10:45 AM', 'Recess / Tea Break', NULL, 'All Faculty & Students', 1, '30-Minute Rest & Tea Break', '2026-10-31 02:07:52'),
(17, 11, 'Daily (Mon-Sat)', 5, '10:45 AM', '11:30 AM', 'Urdu / Islamiat', NULL, 'Marcus Chen', 0, NULL, '2026-10-31 02:07:52'),
(18, 11, 'Daily (Mon-Sat)', 6, '11:30 AM', '12:15 PM', 'Physical Drill & Sports', NULL, 'Tariq Mehmood (PT Sir)', 0, NULL, '2026-10-31 02:07:52'),
(19, 12, 'Daily (Mon-Sat)', 1, '08:00 AM', '08:45 AM', 'Mathematics', NULL, 'David Miller', 0, NULL, '2026-10-31 02:07:52'),
(20, 12, 'Daily (Mon-Sat)', 2, '08:45 AM', '09:30 AM', 'General Science', NULL, 'Sarah Jenkins', 0, NULL, '2026-10-31 02:07:52'),
(21, 12, 'Daily (Mon-Sat)', 3, '09:30 AM', '10:15 AM', 'English Literature', NULL, 'Robert Alvarez', 0, NULL, '2026-10-31 02:07:52'),
(22, 12, 'Daily (Mon-Sat)', 4, '10:15 AM', '10:45 AM', 'Recess / Tea Break', NULL, 'All Faculty & Students', 1, '30-Minute Rest & Tea Break', '2026-10-31 02:07:52'),
(23, 12, 'Daily (Mon-Sat)', 5, '10:45 AM', '11:30 AM', 'Urdu / Islamiat', NULL, 'Marcus Chen', 0, NULL, '2026-10-31 02:07:52'),
(24, 12, 'Daily (Mon-Sat)', 6, '11:30 AM', '12:15 PM', 'Physical Drill & Sports', NULL, 'Tariq Mehmood (PT Sir)', 0, NULL, '2026-10-31 02:07:52'),
(25, 13, 'Daily (Mon-Sat)', 1, '08:00 AM', '08:45 AM', 'Mathematics', NULL, 'David Miller', 0, NULL, '2026-10-31 02:07:52'),
(26, 13, 'Daily (Mon-Sat)', 2, '08:45 AM', '09:30 AM', 'General Science', NULL, 'Sarah Jenkins', 0, NULL, '2026-10-31 02:07:52'),
(27, 13, 'Daily (Mon-Sat)', 3, '09:30 AM', '10:15 AM', 'English Literature', NULL, 'Robert Alvarez', 0, NULL, '2026-10-31 02:07:52'),
(28, 13, 'Daily (Mon-Sat)', 4, '10:15 AM', '10:45 AM', 'Recess / Tea Break', NULL, 'All Faculty & Students', 1, '30-Minute Rest & Tea Break', '2026-10-31 02:07:52'),
(29, 13, 'Daily (Mon-Sat)', 5, '10:45 AM', '11:30 AM', 'Urdu / Islamiat', NULL, 'Marcus Chen', 0, NULL, '2026-10-31 02:07:52'),
(30, 13, 'Daily (Mon-Sat)', 6, '11:30 AM', '12:15 PM', 'Physical Drill & Sports', NULL, 'Tariq Mehmood (PT Sir)', 0, NULL, '2026-10-31 02:07:52'),
(31, 14, 'Daily (Mon-Sat)', 1, '08:00 AM', '08:45 AM', 'Mathematics', NULL, 'David Miller', 0, NULL, '2026-10-31 02:07:52'),
(32, 14, 'Daily (Mon-Sat)', 2, '08:45 AM', '09:30 AM', 'General Science', NULL, 'Sarah Jenkins', 0, NULL, '2026-10-31 02:07:52'),
(33, 14, 'Daily (Mon-Sat)', 3, '09:30 AM', '10:15 AM', 'English Literature', NULL, 'Robert Alvarez', 0, NULL, '2026-10-31 02:07:52'),
(34, 14, 'Daily (Mon-Sat)', 4, '10:15 AM', '10:45 AM', 'Recess / Tea Break', NULL, 'All Faculty & Students', 1, '30-Minute Rest & Tea Break', '2026-10-31 02:07:52'),
(35, 14, 'Daily (Mon-Sat)', 5, '10:45 AM', '11:30 AM', 'Urdu / Islamiat', NULL, 'Marcus Chen', 0, NULL, '2026-10-31 02:07:52'),
(36, 14, 'Daily (Mon-Sat)', 6, '11:30 AM', '12:15 PM', 'Physical Drill & Sports', NULL, 'Tariq Mehmood (PT Sir)', 0, NULL, '2026-10-31 02:07:52'),
(37, 15, 'Daily (Mon-Sat)', 1, '08:00 AM', '08:45 AM', 'Mathematics', NULL, 'David Miller', 0, NULL, '2026-10-31 02:07:52'),
(38, 15, 'Daily (Mon-Sat)', 2, '08:45 AM', '09:30 AM', 'General Science', NULL, 'Sarah Jenkins', 0, NULL, '2026-10-31 02:07:52'),
(39, 15, 'Daily (Mon-Sat)', 3, '09:30 AM', '10:15 AM', 'English Literature', NULL, 'Robert Alvarez', 0, NULL, '2026-10-31 02:07:52'),
(40, 15, 'Daily (Mon-Sat)', 4, '10:15 AM', '10:45 AM', 'Recess / Tea Break', NULL, 'All Faculty & Students', 1, '30-Minute Rest & Tea Break', '2026-10-31 02:07:52'),
(41, 15, 'Daily (Mon-Sat)', 5, '10:45 AM', '11:30 AM', 'Urdu / Islamiat', NULL, 'Marcus Chen', 0, NULL, '2026-10-31 02:07:52'),
(42, 15, 'Daily (Mon-Sat)', 6, '11:30 AM', '12:15 PM', 'Physical Drill & Sports', NULL, 'Tariq Mehmood (PT Sir)', 0, NULL, '2026-10-31 02:07:52'),
(43, 16, 'Daily (Mon-Sat)', 1, '08:00 AM', '08:45 AM', 'Mathematics', NULL, 'David Miller', 0, NULL, '2026-10-31 02:07:52'),
(44, 16, 'Daily (Mon-Sat)', 2, '08:45 AM', '09:30 AM', 'General Science', NULL, 'Sarah Jenkins', 0, NULL, '2026-10-31 02:07:52'),
(45, 16, 'Daily (Mon-Sat)', 3, '09:30 AM', '10:15 AM', 'English Literature', NULL, 'Robert Alvarez', 0, NULL, '2026-10-31 02:07:52'),
(46, 16, 'Daily (Mon-Sat)', 4, '10:15 AM', '10:45 AM', 'Recess / Tea Break', NULL, 'All Faculty & Students', 1, '30-Minute Rest & Tea Break', '2026-10-31 02:07:52'),
(47, 16, 'Daily (Mon-Sat)', 5, '10:45 AM', '11:30 AM', 'Urdu / Islamiat', NULL, 'Marcus Chen', 0, NULL, '2026-10-31 02:07:52'),
(48, 16, 'Daily (Mon-Sat)', 6, '11:30 AM', '12:15 PM', 'Physical Drill & Sports', NULL, 'Tariq Mehmood (PT Sir)', 0, NULL, '2026-10-31 02:07:52'),
(49, 7, 'Daily (Mon-Sat)', 1, '08:00 AM', '08:45 AM', 'Mathematics', NULL, 'David Miller', 0, NULL, '2026-10-31 02:07:52'),
(50, 7, 'Daily (Mon-Sat)', 2, '08:45 AM', '09:30 AM', 'General Science', NULL, 'Sarah Jenkins', 0, NULL, '2026-10-31 02:07:52'),
(51, 7, 'Daily (Mon-Sat)', 3, '09:30 AM', '10:15 AM', 'English Literature', NULL, 'Robert Alvarez', 0, NULL, '2026-10-31 02:07:52'),
(52, 7, 'Daily (Mon-Sat)', 4, '10:15 AM', '10:45 AM', 'Recess / Tea Break', NULL, 'All Faculty & Students', 1, '30-Minute Rest & Tea Break', '2026-10-31 02:07:52'),
(53, 7, 'Daily (Mon-Sat)', 5, '10:45 AM', '11:30 AM', 'Urdu / Islamiat', NULL, 'Marcus Chen', 0, NULL, '2026-10-31 02:07:52'),
(54, 7, 'Daily (Mon-Sat)', 6, '11:30 AM', '12:15 PM', 'Physical Drill & Sports', NULL, 'Tariq Mehmood (PT Sir)', 0, NULL, '2026-10-31 02:07:52'),
(55, 8, 'Daily (Mon-Sat)', 1, '08:00 AM', '08:45 AM', 'Mathematics', NULL, 'David Miller', 0, NULL, '2026-10-31 02:07:52'),
(56, 8, 'Daily (Mon-Sat)', 2, '08:45 AM', '09:30 AM', 'General Science', NULL, 'Sarah Jenkins', 0, NULL, '2026-10-31 02:07:52'),
(57, 8, 'Daily (Mon-Sat)', 3, '09:30 AM', '10:15 AM', 'English Literature', NULL, 'Robert Alvarez', 0, NULL, '2026-10-31 02:07:52'),
(58, 8, 'Daily (Mon-Sat)', 4, '10:15 AM', '10:45 AM', 'Recess / Tea Break', NULL, 'All Faculty & Students', 1, '30-Minute Rest & Tea Break', '2026-10-31 02:07:52'),
(59, 8, 'Daily (Mon-Sat)', 5, '10:45 AM', '11:30 AM', 'Urdu / Islamiat', NULL, 'Marcus Chen', 0, NULL, '2026-10-31 02:07:52'),
(60, 8, 'Daily (Mon-Sat)', 6, '11:30 AM', '12:15 PM', 'Physical Drill & Sports', NULL, 'Tariq Mehmood (PT Sir)', 0, NULL, '2026-10-31 02:07:52');

-- --------------------------------------------------------
-- Table structure for `classes`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `classes`;
CREATE TABLE `classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `section` varchar(50) NOT NULL,
  `room_number` varchar(50) DEFAULT NULL,
  `capacity` int(11) DEFAULT 40,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `monthly_fee` decimal(10,2) DEFAULT 900.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_class_section` (`name`,`section`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping seed data for table `classes` (11 rows)
INSERT INTO `classes` (`id`, `name`, `section`, `room_number`, `capacity`, `created_at`, `updated_at`, `monthly_fee`) VALUES
(7, 'Prep', 'A', 'Room 01', 100, '2026-10-31 01:13:56', '2026-10-31 02:57:22', '450.00'),
(8, 'Prep', 'B', 'Room 02', 100, '2026-10-31 01:13:56', '2026-10-31 02:57:22', '500.00'),
(9, 'Class 1', 'A', 'Room 101', 100, '2026-10-31 01:13:56', '2026-10-31 02:57:22', '550.00'),
(10, 'Class 2', 'A', 'Room 102', 100, '2026-10-31 01:13:56', '2026-10-31 02:57:22', '600.00'),
(11, 'Class 3', 'A', 'Room 103', 100, '2026-10-31 01:13:56', '2026-10-31 02:57:22', '650.00'),
(12, 'Class 4', 'A', 'Room 104', 100, '2026-10-31 01:13:56', '2026-10-31 02:57:22', '700.00'),
(13, 'Class 5', 'A', 'Room 105', 100, '2026-10-31 01:13:56', '2026-10-31 02:57:22', '750.00'),
(14, 'Class 6', 'A', 'Room 106', 100, '2026-10-31 01:13:56', '2026-10-31 02:57:22', '800.00'),
(15, 'Class 7', 'A', 'Room 107', 100, '2026-10-31 01:13:56', '2026-10-31 02:57:22', '850.00'),
(16, 'Class 8', 'A', 'Room 108', 100, '2026-10-31 01:13:56', '2026-10-31 02:57:22', '900.00'),
(17, 'class 8th', 'A', '2', 50, '2026-10-31 04:02:07', '2026-10-31 04:02:07', '1000.00');

-- --------------------------------------------------------
-- Table structure for `exams`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `exams`;
CREATE TABLE `exams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `term` varchar(50) NOT NULL,
  `session_year` varchar(50) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping seed data for table `exams` (1 rows)
INSERT INTO `exams` (`id`, `name`, `term`, `session_year`, `start_date`, `end_date`, `created_at`) VALUES
(1, 'Mid-Term Examinations 2026', 'Term 1', '2025-2026', '2026-03-08 19:00:00', '2026-03-22 19:00:00', '2026-10-22 16:40:18');

-- --------------------------------------------------------
-- Table structure for `fees`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `fees`;
CREATE TABLE `fees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_no` varchar(50) NOT NULL,
  `student_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `due_date` date NOT NULL,
  `status` enum('Paid','Pending','Overdue') DEFAULT 'Pending',
  `paid_date` date DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_no` (`invoice_no`),
  KEY `idx_fees_student` (`student_id`),
  KEY `idx_fees_status` (`status`),
  CONSTRAINT `fk_fees_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping seed data for table `fees` (9 rows)
INSERT INTO `fees` (`id`, `invoice_no`, `student_id`, `title`, `amount`, `due_date`, `status`, `paid_date`, `payment_method`, `created_at`) VALUES
(1, 'INV-2026-001', 1, 'Tuition Fee - Q1 2026', '900.00', '2026-01-29 19:00:00', 'Paid', '2026-01-18 19:00:00', 'Bank Transfer', '2026-10-22 16:40:18'),
(2, 'INV-2026-002', 2, 'Tuition Fee - Q1 2026', '900.00', '2026-01-29 19:00:00', 'Paid', '2026-01-16 19:00:00', 'Credit Card', '2026-10-22 16:40:18'),
(3, 'INV-2026-003', 3, 'Tuition Fee - Q1 2026', '850.00', '2026-01-29 19:00:00', 'Pending', NULL, NULL, '2026-10-22 16:40:18'),
(4, 'INV-2026-004', 4, 'Tuition Fee - Q1 2026', '800.00', '2026-01-29 19:00:00', 'Paid', '2026-01-23 19:00:00', 'Online Portal', '2026-10-22 16:40:18'),
(5, 'INV-2026-005', 5, 'Tuition Fee - Q1 2026', '750.00', '2026-02-13 19:00:00', 'Paid', '2026-10-29 19:00:00', 'Cash', '2026-10-22 16:40:18'),
(6, 'INV-2026-006', 6, 'Tuition Fee - Q1 2026', '700.00', '2026-01-29 19:00:00', 'Paid', '2026-01-20 19:00:00', 'Bank Transfer', '2026-10-22 16:40:18'),
(7, 'INV-2026-007', 7, 'Tuition Fee - Monthly', '650.00', '2026-11-08 19:00:00', 'Paid', NULL, NULL, '2026-10-31 01:15:12'),
(8, 'INV-2026-011', 11, 'Tuition Fee - Monthly', '450.00', '2026-11-08 19:00:00', 'Paid', '2026-10-29 19:00:00', 'Cash', '2026-10-31 01:15:12'),
(9, 'INV-2026-5076', 11, 'Monthly Tuition Fee', '450.00', '2005-01-01 19:00:00', 'Pending', NULL, NULL, '2026-10-31 04:03:23');

-- --------------------------------------------------------
-- Table structure for `marks`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `marks`;
CREATE TABLE `marks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `exam_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `marks_obtained` decimal(5,2) NOT NULL,
  `max_marks` decimal(5,2) DEFAULT 100.00,
  `remarks` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_student_exam_subject` (`student_id`,`exam_id`,`subject_id`),
  KEY `idx_marks_student` (`student_id`),
  KEY `idx_marks_exam` (`exam_id`),
  KEY `idx_marks_subject` (`subject_id`),
  CONSTRAINT `fk_marks_exam` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_marks_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_marks_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping seed data for table `marks` (12 rows)
INSERT INTO `marks` (`id`, `student_id`, `exam_id`, `subject_id`, `marks_obtained`, `max_marks`, `remarks`, `created_at`) VALUES
(1, 1, 1, 1, '92.00', '100.00', 'Outstanding analytical ability', '2026-10-22 16:40:18'),
(2, 1, 1, 2, '88.00', '100.00', 'Excellent lab work', '2026-10-22 16:40:18'),
(3, 1, 1, 3, '85.00', '100.00', 'Very good essay structure', '2026-10-22 16:40:18'),
(4, 1, 1, 4, '96.00', '100.00', 'Exceptional coding logic', '2026-10-22 16:40:18'),
(5, 2, 1, 1, '89.00', '100.00', 'Great problem solving', '2026-10-22 16:40:18'),
(6, 2, 1, 2, '94.00', '100.00', 'Top physics scorer', '2026-10-22 16:40:18'),
(7, 2, 1, 3, '91.00', '100.00', 'Fluent and articulate', '2026-10-22 16:40:18'),
(8, 2, 1, 4, '88.00', '100.00', 'Good project demonstration', '2026-10-22 16:40:18'),
(9, 3, 1, 1, '74.00', '100.00', 'Consistent effort', '2026-10-22 16:40:18'),
(10, 3, 1, 2, '79.00', '100.00', 'Solid understanding of concepts', '2026-10-22 16:40:18'),
(11, 4, 1, 1, '95.00', '100.00', 'Flawless calculations', '2026-10-22 16:40:18'),
(12, 11, 1, 2, '99.00', '100.00', NULL, '2026-10-31 03:21:25');

-- --------------------------------------------------------
-- Table structure for `meetings`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `meetings`;
CREATE TABLE `meetings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `agenda` text NOT NULL,
  `meeting_date` date NOT NULL,
  `meeting_time` varchar(50) NOT NULL,
  `venue` varchar(100) DEFAULT 'Principal Office',
  `attendees` varchar(100) DEFAULT 'All Teachers',
  `status` enum('Scheduled','Completed','Postponed') DEFAULT 'Scheduled',
  `arranged_by` varchar(100) DEFAULT 'Principal Musharaf Khan',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping seed data for table `meetings` (3 rows)
INSERT INTO `meetings` (`id`, `title`, `agenda`, `meeting_date`, `meeting_time`, `venue`, `attendees`, `status`, `arranged_by`, `created_at`) VALUES
(1, 'Monthly Academic & Syllabus Review', 'Review curriculum progress for Prep through Class 8, discuss upcoming mid-term exam schedule and student discipline.', '2026-10-31 19:00:00', '10:30 AM', 'Principal Conference Room', 'All Teachers', 'Scheduled', 'Principal Musharaf Khan', '2026-10-31 01:13:56'),
(2, 'Parent-Teacher Advisory Council', 'Address student attendance, academic improvement plans, and PKR fee collection schedules.', '2026-11-03 19:00:00', '11:00 AM', 'Main School Auditorium', 'Parents & Faculty', 'Scheduled', 'Principal Musharaf Khan', '2026-10-31 01:13:56'),
(3, 'Morning Assembly & Drill Enhancement', 'Coordination with PT Sir Tariq Mehmood regarding weekly physical exercises and national anthem discipline.', '2026-10-26 19:00:00', '09:00 AM', 'Principal Office', 'PT Instructor & Discipline Committee', 'Completed', 'Principal Musharaf Khan', '2026-10-31 01:13:56');

-- --------------------------------------------------------
-- Table structure for `notices`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `notices`;
CREATE TABLE `notices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `content` text NOT NULL,
  `audience` enum('All','Students','Teachers','Parents') DEFAULT 'All',
  `priority` enum('Normal','Important','Urgent') DEFAULT 'Normal',
  `date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping seed data for table `notices` (3 rows)
INSERT INTO `notices` (`id`, `title`, `content`, `audience`, `priority`, `date`, `created_at`) VALUES
(1, 'Annual Science & Innovation Fair 2026', 'We are delighted to announce that our Annual Science Fair will be hosted on November 14th in the main auditorium. Students are encouraged to submit project proposals by next Friday.', 'All', 'Important', '2026-10-18 19:00:00', '2026-10-22 16:40:18'),
(2, 'Parent-Teacher Conference Scheduled', 'First term Parent-Teacher consultations will occur this Saturday from 9:00 AM to 3:00 PM. Appointment booking is available via the parent portal.', 'Parents', 'Urgent', '2026-10-20 19:00:00', '2026-10-22 16:40:18'),
(3, 'Curriculum Workshop for Faculty', 'Mandatory professional development workshop on STEM integration on Friday afternoon at 2:00 PM in Conference Room A.', 'Teachers', 'Normal', '2026-10-16 19:00:00', '2026-10-22 16:40:18');

-- --------------------------------------------------------
-- Table structure for `school_rules`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `school_rules`;
CREATE TABLE `school_rules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `category` enum('Discipline','Dress Code','Examinations','Fee Policy','General Conduct') DEFAULT 'General Conduct',
  `description` text NOT NULL,
  `penalty_or_note` varchar(255) DEFAULT NULL,
  `approved_by` varchar(100) DEFAULT 'Principal Musharaf Khan',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping seed data for table `school_rules` (5 rows)
INSERT INTO `school_rules` (`id`, `title`, `category`, `description`, `penalty_or_note`, `approved_by`, `created_at`) VALUES
(1, 'Morning Assembly & Punctuality', 'General Conduct', 'All students and teachers must assemble in the ground promptly at 7:45 AM. PT Sir will lead drill exercises and national anthem.', 'Latecomers must report to Discipline Incharge', 'Principal Musharaf Khan', '2026-10-31 01:13:56'),
(2, 'Approved School Uniform Code', 'Dress Code', 'Students must wear neat, pressed uniform with school badge and polished black shoes. PT uniform on designated exercise days.', 'Uniform inspection held every morning during assembly', 'Principal Musharaf Khan', '2026-10-31 01:13:56'),
(3, 'Tuition Fee Submission Policy', 'Fee Policy', 'School fees are tiered from Prep (PKR 450) up to Class 8 (PKR 900 max). Due date is the 10th of every calendar month in PKR.', 'Late fee surcharge of PKR 50 applies after due date', 'Principal Musharaf Khan', '2026-10-31 01:13:56'),
(4, 'Classroom & Examination Integrity', 'Examinations', 'Strict zero tolerance towards copying, cheating, or whispering during class tests and term examinations.', 'Paper cancellation and guardian call for severe infractions', 'Principal Musharaf Khan', '2026-10-31 01:13:56'),
(5, 'Prohibition of Unauthorized Devices', 'Discipline', 'Mobile phones, electronic gadgets, and non-academic items are strictly prohibited inside classrooms.', 'Devices will be confiscated and returned only to parents', 'Principal Musharaf Khan', '2026-10-31 01:13:56');

-- --------------------------------------------------------
-- Table structure for `school_settings`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `school_settings`;
CREATE TABLE `school_settings` (
  `id` int(11) NOT NULL DEFAULT 1,
  `school_name` varchar(200) NOT NULL DEFAULT 'EduPulse Academy',
  `tagline` varchar(255) DEFAULT 'Excellence in Academic and Character Development',
  `logo_icon` varchar(50) DEFAULT '?',
  `phone` varchar(50) DEFAULT '+92 322-9594616',
  `email` varchar(150) DEFAULT 'rafiqhaqyar524@gmail.com',
  `address` text DEFAULT NULL,
  `sports_week_date` varchar(100) DEFAULT 'Nov 18 - Nov 24, 2026',
  `recess_break_minutes` int(11) DEFAULT 30,
  `recess_break_label` varchar(100) DEFAULT '30-Minute Break (Tea & Student Rest)',
  `developer_name` varchar(100) DEFAULT 'Rafiq Haqyar',
  `developer_phone` varchar(50) DEFAULT '923229594616',
  `developer_email` varchar(100) DEFAULT 'rafiqhaqyar524@gmail.com',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `logo_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping seed data for table `school_settings` (1 rows)
INSERT INTO `school_settings` (`id`, `school_name`, `tagline`, `logo_icon`, `phone`, `email`, `address`, `sports_week_date`, `recess_break_minutes`, `recess_break_label`, `developer_name`, `developer_phone`, `developer_email`, `updated_at`, `logo_url`) VALUES
(1, 'The Center School Odegram', 'Today reading , Tomarow  leading', 'book', '+92 322-9594616', 'rafiqhaqyar524@gmail.com', 'Bajaur  tehsile salarzai odegram', 'Nov 18 - Nov 24, 2026', 30, '30-Minute Break (Tea & Student Rest)', 'Rafiq Haqyar', '923229594616', 'rafiqhaqyar524@gmail.com', '2026-10-31 03:23:52', '/uploads/school-logo-1793435032050.jpeg');

-- --------------------------------------------------------
-- Table structure for `students`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admission_no` varchar(50) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `gender` enum('Male','Female','Other') DEFAULT 'Other',
  `dob` date DEFAULT NULL,
  `class_id` int(11) DEFAULT NULL,
  `roll_no` varchar(50) DEFAULT NULL,
  `parent_name` varchar(150) DEFAULT NULL,
  `parent_phone` varchar(50) DEFAULT NULL,
  `parent_email` varchar(150) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `status` enum('Active','Graduated','Suspended','Transferred') DEFAULT 'Active',
  `admission_date` date DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `admission_no` (`admission_no`),
  KEY `idx_student_class` (`class_id`),
  KEY `idx_student_status` (`status`),
  CONSTRAINT `fk_students_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping seed data for table `students` (14 rows)
INSERT INTO `students` (`id`, `admission_no`, `first_name`, `last_name`, `gender`, `dob`, `class_id`, `roll_no`, `parent_name`, `parent_phone`, `parent_email`, `address`, `status`, `admission_date`, `avatar`, `created_at`, `updated_at`) VALUES
(1, 'ADM-2024-001', 'Alexander', 'Wright', 'Male', '2008-05-12 19:00:00', 16, '1', 'Thomas Wright', '+1 555-0201', 't.wright@mail.com', '742 Evergreen Terrace, Springfield', 'Active', '2023-08-30 19:00:00', NULL, '2026-10-22 16:40:18', '2026-10-31 02:07:52'),
(2, 'ADM-2024-002', 'Sophia', 'Martinez', 'Female', '2008-09-20 18:00:00', 16, '2', 'Carlos Martinez', '+1 555-0202', 'carlos.m@mail.com', '124 Conch Street, Riverdale', 'Active', '2023-08-30 19:00:00', NULL, '2026-10-22 16:40:18', '2026-10-31 02:07:52'),
(3, 'ADM-2024-003', 'Liam', 'Johnson', 'Male', '2008-11-01 19:00:00', 15, '1', 'Karen Johnson', '+1 555-0203', 'karen.j@mail.com', '43 Oakwood Avenue, Brookline', 'Active', '2023-08-30 19:00:00', NULL, '2026-10-22 16:40:18', '2026-10-31 02:07:52'),
(4, 'ADM-2024-004', 'Emma', 'Watson', 'Female', '2008-04-16 19:00:00', 14, '1', 'George Watson', '+1 555-0204', 'g.watson@mail.com', '98 Baker Street, Londonway', 'Active', '2023-08-30 19:00:00', NULL, '2026-10-22 16:40:18', '2026-10-31 02:07:52'),
(5, 'ADM-2024-005', 'Noah', 'Patel', 'Male', '2008-07-28 18:00:00', 13, '1', 'Amit Patel', '+1 555-0205', 'amit.patel@mail.com', '15 Maple Lane, Sunnyvale', 'Active', '2023-08-30 19:00:00', NULL, '2026-10-22 16:40:18', '2026-10-31 02:07:52'),
(6, 'ADM-2024-006', 'Olivia', 'Kim', 'Female', '2008-02-09 19:00:00', 12, '1', 'Sun-Woo Kim', '+1 555-0206', 'sw.kim@mail.com', '512 Pinecrest Blvd, Cambridge', 'Active', '2023-08-30 19:00:00', NULL, '2026-10-22 16:40:18', '2026-10-31 02:07:52'),
(7, 'ADM-2024-007', 'Ethan', 'Brooks', 'Male', '2008-12-03 19:00:00', 11, '1', 'Diana Brooks', '+1 555-0207', 'dbrooks@mail.com', '88 High Street, Oxford', 'Active', '2023-08-30 19:00:00', NULL, '2026-10-22 16:40:18', '2026-10-31 02:07:52'),
(8, 'ADM-2024-008', 'Mia', 'Gomez', 'Female', '2008-08-17 18:00:00', 10, '1', 'Luis Gomez', '+1 555-0208', 'lgomez@mail.com', '33 Sunset Blvd, Pasadena', 'Active', '2023-08-30 19:00:00', NULL, '2026-10-22 16:40:18', '2026-10-31 02:07:52'),
(9, 'ADM-2024-009', 'Lucas', 'Silva', 'Male', '2009-01-13 19:00:00', 9, '1', 'Mateo Silva', '+1 555-0209', 'msilva@mail.com', '19 Horizon Way, Austin', 'Active', '2024-08-30 19:00:00', NULL, '2026-10-22 16:40:18', '2026-10-31 02:07:52'),
(10, 'ADM-2024-010', 'Isabella', 'Rossi', 'Female', '2007-06-23 19:00:00', 8, '1', 'Marco Rossi', '+1 555-0210', 'mrossi@mail.com', '702 Cedar Drive, Seattle', 'Active', '2022-08-30 19:00:00', NULL, '2026-10-22 16:40:18', '2026-10-31 02:07:52'),
(11, 'ADM-2026-3433', 'Rafiq', 'Ullah', 'Male', '2026-10-19 19:00:00', 7, '1', 'Shams Ur Rahman', '+923229594616', 'rafiqhaqyar524@gmail.com', 'Odegram Tehsil Salarzai District Bajaur', 'Active', '2026-10-20 19:00:00', NULL, '2026-10-22 16:49:46', '2026-10-31 02:07:52'),
(12, 'ADM-2026-6164', 'said arif', 'khan', 'Male', '2005-01-01 19:00:00', 16, '2', 'arif', '03033857259', NULL, 'odegram', 'Active', '2026-10-29 19:00:00', NULL, '2026-10-31 02:34:31', '2026-10-31 02:34:31'),
(13, 'ADM-2026-4044', 'Bilal', 'Khan', 'Male', NULL, 16, '3', 'Khan Baba', '+92 322-9594616', NULL, NULL, 'Active', '2026-10-29 19:00:00', NULL, '2026-10-31 03:18:44', '2026-10-31 03:18:44'),
(14, 'ADM-2026-1719', 'khalil', 'ullah', 'Male', '2012-12-31 19:00:00', 13, '5', 'shams ur rahan', '03261510898', NULL, 'odegram', 'Active', '2026-10-29 19:00:00', NULL, '2026-10-31 08:37:18', '2026-10-31 08:37:18');

-- --------------------------------------------------------
-- Table structure for `subjects`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `subjects`;
CREATE TABLE `subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_teacher_id` (`teacher_id`),
  CONSTRAINT `fk_subjects_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_subjects_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping seed data for table `subjects` (5 rows)
INSERT INTO `subjects` (`id`, `code`, `name`, `class_id`, `teacher_id`, `created_at`) VALUES
(1, 'MATH-10', 'Advanced Mathematics', 16, 1, '2026-10-22 16:40:18'),
(2, 'PHY-10', 'General Physics', 16, 2, '2026-10-22 16:40:18'),
(3, 'ENG-10', 'World Literature', 16, 3, '2026-10-22 16:40:18'),
(4, 'CS-10', 'Computer Programming', 16, 4, '2026-10-22 16:40:18'),
(5, 'CHEM-10', 'Introductory Chemistry', 16, 5, '2026-10-22 16:40:18');

-- --------------------------------------------------------
-- Table structure for `teacher_attendance`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `teacher_attendance`;
CREATE TABLE `teacher_attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `status` enum('Present','Absent','Leave','Late') DEFAULT 'Present',
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_teacher_date` (`teacher_id`,`date`),
  KEY `idx_teacher_att_date` (`date`),
  CONSTRAINT `fk_teacher_att` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping seed data for table `teacher_attendance` (6 rows)
INSERT INTO `teacher_attendance` (`id`, `teacher_id`, `date`, `status`, `notes`, `created_at`) VALUES
(1, 1, '2026-10-29 19:00:00', 'Present', 'Class 8 Incharge - On time', '2026-10-31 02:07:52'),
(2, 2, '2026-10-29 19:00:00', 'Present', 'Class 7 Incharge', '2026-10-31 02:07:52'),
(3, 3, '2026-10-29 19:00:00', 'Present', 'English Dept', '2026-10-31 02:07:52'),
(4, 4, '2026-10-29 19:00:00', 'Leave', 'Approved Casual Leave', '2026-10-31 02:07:52'),
(5, 7, '2026-10-29 19:00:00', 'Present', 'Principal Musharaf Khan in office', '2026-10-31 02:07:52'),
(6, 8, '2026-10-29 19:00:00', 'Present', 'PT Sir Tariq Mehmood - Led Morning Assembly', '2026-10-31 02:07:52');

-- --------------------------------------------------------
-- Table structure for `teachers`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `teachers`;
CREATE TABLE `teachers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(50) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `subject_specialization` varchar(150) DEFAULT NULL,
  `qualification` varchar(150) DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT 0.00,
  `status` enum('Active','On Leave','Inactive') DEFAULT 'Active',
  `avatar` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `role_designation` varchar(100) DEFAULT 'Teacher',
  `assigned_class_id` int(11) DEFAULT NULL,
  `due_classes` int(11) DEFAULT 24,
  `completed_classes` int(11) DEFAULT 18,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping seed data for table `teachers` (10 rows)
INSERT INTO `teachers` (`id`, `employee_id`, `first_name`, `last_name`, `email`, `phone`, `subject_specialization`, `qualification`, `joining_date`, `salary`, `status`, `avatar`, `created_at`, `updated_at`, `role_designation`, `assigned_class_id`, `due_classes`, `completed_classes`) VALUES
(1, 'TCH-1001', 'David', 'Miller', 'david.miller@school.edu', '+1 555-0101', 'Mathematics', 'M.Sc Mathematics', '2021-08-13 19:00:00', '55000.00', 'Active', NULL, '2026-10-22 16:40:18', '2026-11-10 04:51:33', 'Class 8 Incharge / Math Teacher', 16, 24, 19),
(2, 'TCH-1002', 'Sarah', 'Jenkins', 'sarah.j@school.edu', '+1 555-0102', 'Physics', 'Ph.D Physics', '2020-03-08 19:00:00', '52000.00', 'Active', NULL, '2026-10-22 16:40:18', '2026-10-31 01:15:12', 'Class 7 Incharge / Science Teacher', 15, 24, 18),
(3, 'TCH-1003', 'Robert', 'Alvarez', 'robert.a@school.edu', '+1 555-0103', 'English Literature', 'M.A English', '2019-08-30 19:00:00', '50000.00', 'Active', NULL, '2026-10-22 16:40:18', '2026-10-31 01:15:12', 'Class 6 Incharge / English Teacher', 14, 24, 18),
(4, 'TCH-1004', 'Elena', 'Rostova', 'elena.r@school.edu', '+1 555-0104', 'Computer Science', 'M.S Computer Science', '2022-01-13 19:00:00', '62000.00', 'Active', NULL, '2026-10-22 16:40:18', '2026-10-22 16:40:18', 'Teacher', NULL, 24, 18),
(5, 'TCH-1005', 'Marcus', 'Chen', 'marcus.chen@school.edu', '+1 555-0105', 'Chemistry', 'M.Sc Chemistry', '2023-08-18 19:00:00', '51000.00', 'Active', NULL, '2026-10-22 16:40:18', '2026-10-22 16:40:18', 'Teacher', NULL, 24, 18),
(6, 'TCH-2878', 'Rafiq ', 'Haqyar', 'rafiqhaqyar524@gmail.com', '+923229594616', 'Mathimatics,chemistry, bilogy', 'BS Computer science ', '2005-01-01 19:00:00', '50000.00', 'Active', NULL, '2026-10-31 00:58:18', '2026-10-31 01:13:56', 'Teacher', NULL, 24, 18),
(7, 'PRN-1001', 'Musharaf', 'Khan', 'principal.musharaf@school.edu', '+92 300-1234567', 'Academic Leadership & Administration', 'M.Ed, M.Phil Educational Administration', '2018-01-08 19:00:00', '85000.00', 'Active', NULL, '2026-10-31 01:13:56', '2026-10-31 02:57:22', 'Principal', NULL, 12, 10),
(8, 'PT-1002', 'Tariq', 'Mehmood (PT Sir)', 'pt.tariq@school.edu', '+92 312-9876543', 'Physical Education, Sports & Assembly Drills', 'B.P.Ed (Physical Education)', '2019-03-13 19:00:00', '45000.00', 'Active', NULL, '2026-10-31 01:13:56', '2026-10-31 02:57:22', 'PT Instructor', NULL, 20, 16),
(9, 'TCH-9147', 'Kamran', 'Ali', 'testteach_1793434724191@school.edu.pk', '+92 322-9594616', 'Physics & Chemistry', 'B.Ed / M.Sc', NULL, '50000.00', 'Active', NULL, '2026-10-31 03:18:44', '2026-10-31 03:18:44', 'Senior Science Teacher', NULL, 24, 0),
(10, 'TCH-2526', 'farhaz', 'khan', 'farhaz12@gmail.com', '03275097092', 'biology and chemistry', 'bs zoology', '2026-01-09 19:00:00', '15000.00', 'Active', NULL, '2026-10-31 08:30:56', '2026-10-31 08:30:56', 'Teacher', 16, 24, 0);

-- --------------------------------------------------------
-- Table structure for `users`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','principal','teacher','student') NOT NULL,
  `display_name` varchar(150) NOT NULL,
  `ref_id` int(11) DEFAULT NULL,
  `managed_class_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `secret_word` varchar(100) DEFAULT 'pakistan',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping seed data for table `users` (6 rows)
INSERT INTO `users` (`id`, `username`, `password`, `role`, `display_name`, `ref_id`, `managed_class_id`, `created_at`, `email`, `phone`, `secret_word`) VALUES
(1, 'admin', 'admin1', 'admin', 'System Administrator', NULL, NULL, '2026-10-31 01:13:56', 'rafiqhaqyar524@gmail.com', '+92 322-9594616', 'admin'),
(2, 'principal', 'principal123', 'principal', 'Principal Musharaf Khan', 7, NULL, '2026-10-31 01:13:56', 'musharaf@school.edu.pk', '+92 300-1234567', 'principal'),
(3, 'musharaf', 'musharaf123', 'principal', 'Principal Musharaf Khan', 7, NULL, '2026-10-31 01:13:56', 'musharaf@school.edu.pk', '+92 300-1234567', 'principal'),
(4, 'teacher', 'teacher123', 'teacher', 'David Miller (Class 8)', 1, 16, '2026-10-31 01:13:56', 'david.miller@school.edu.pk', '+92 333-5550201', 'teacher'),
(5, 'ptsir', 'ptsir123', 'teacher', 'Tariq Mehmood (PT Sir)', 8, NULL, '2026-10-31 01:13:56', 'tariq.pt@school.edu.pk', '+92 333-8889999', 'ptsir'),
(6, 'student', 'student123', 'student', 'Alexander Wright (Class 8)', 1, 16, '2026-10-31 01:13:56', 'alexander@student.school.edu.pk', '+1 555-0201', 'student');

SET FOREIGN_KEY_CHECKS = 1;
