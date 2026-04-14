-- ============================================================================
-- 🏥 Hospital Management System — Complete MySQL Database Schema
-- ============================================================================
-- Project   : Hospital Management System (HMS)
-- Database  : hms_db
-- Engine    : MySQL 8.0+ (InnoDB)
-- Charset   : utf8mb4 / utf8mb4_unicode_ci
-- Framework : Django 6.0 + Django REST Framework
-- ============================================================================
-- Usage:
--   1. mysql -u root -p < hms_database.sql
--   2. Then run: python manage.py migrate
--      (Django will detect existing tables and skip creation)
-- ============================================================================

-- ── Create Database ─────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS `hms_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `hms_db`;

-- ── Django Auth & System Tables ─────────────────────────────────────────────
-- These are auto-created by `python manage.py migrate`, but included here
-- for completeness so everything is in a single file.

-- Django Content Types
CREATE TABLE IF NOT EXISTS `django_content_type` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `app_label` VARCHAR(100) NOT NULL,
  `model` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_uniq` (`app_label`, `model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Django Migrations Tracker
CREATE TABLE IF NOT EXISTS `django_migrations` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `app` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `applied` DATETIME(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Django Auth Permission
CREATE TABLE IF NOT EXISTS `auth_permission` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `content_type_id` INT NOT NULL,
  `codename` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_uniq` (`content_type_id`, `codename`),
  CONSTRAINT `auth_permission_content_type_fk` FOREIGN KEY (`content_type_id`)
    REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Django Auth Group
CREATE TABLE IF NOT EXISTS `auth_group` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_name_uniq` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Django Auth Group Permissions (M2M)
CREATE TABLE IF NOT EXISTS `auth_group_permissions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `group_id` INT NOT NULL,
  `permission_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_uniq` (`group_id`, `permission_id`),
  CONSTRAINT `auth_group_permissions_group_fk` FOREIGN KEY (`group_id`)
    REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_group_permissions_permission_fk` FOREIGN KEY (`permission_id`)
    REFERENCES `auth_permission` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Django Auth User
CREATE TABLE IF NOT EXISTS `auth_user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `password` VARCHAR(128) NOT NULL,
  `last_login` DATETIME(6) DEFAULT NULL,
  `is_superuser` TINYINT(1) NOT NULL DEFAULT 0,
  `username` VARCHAR(150) NOT NULL,
  `first_name` VARCHAR(150) NOT NULL DEFAULT '',
  `last_name` VARCHAR(150) NOT NULL DEFAULT '',
  `email` VARCHAR(254) NOT NULL DEFAULT '',
  `is_staff` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `date_joined` DATETIME(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_username_uniq` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Django Auth User Groups (M2M)
CREATE TABLE IF NOT EXISTS `auth_user_groups` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `group_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_groups_user_id_group_id_uniq` (`user_id`, `group_id`),
  CONSTRAINT `auth_user_groups_user_fk` FOREIGN KEY (`user_id`)
    REFERENCES `auth_user` (`id`),
  CONSTRAINT `auth_user_groups_group_fk` FOREIGN KEY (`group_id`)
    REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Django Auth User Permissions (M2M)
CREATE TABLE IF NOT EXISTS `auth_user_user_permissions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `permission_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_user_permissions_user_id_permission_id_uniq` (`user_id`, `permission_id`),
  CONSTRAINT `auth_user_user_permissions_user_fk` FOREIGN KEY (`user_id`)
    REFERENCES `auth_user` (`id`),
  CONSTRAINT `auth_user_user_permissions_permission_fk` FOREIGN KEY (`permission_id`)
    REFERENCES `auth_permission` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Django Admin Log
CREATE TABLE IF NOT EXISTS `django_admin_log` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `action_time` DATETIME(6) NOT NULL,
  `object_id` LONGTEXT DEFAULT NULL,
  `object_repr` VARCHAR(200) NOT NULL,
  `action_flag` SMALLINT UNSIGNED NOT NULL,
  `change_message` LONGTEXT NOT NULL,
  `content_type_id` INT DEFAULT NULL,
  `user_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `django_admin_log_content_type_fk` FOREIGN KEY (`content_type_id`)
    REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_fk` FOREIGN KEY (`user_id`)
    REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Django Session
CREATE TABLE IF NOT EXISTS `django_session` (
  `session_key` VARCHAR(40) NOT NULL,
  `session_data` LONGTEXT NOT NULL,
  `expire_date` DATETIME(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_idx` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- ── HMS Application Tables (core app) ───────────────────────────────────────
-- ============================================================================

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  1. PATIENT — Central patient registration table                       │
-- │     - patient_id: unique identifier (format: PT-XXXXXX)               │
-- │     - token_number: daily queue number                                 │
-- │     - password: hashed via Django's make_password                     │
-- └─────────────────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS `core_patient` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `updated_at` DATETIME(6) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `age` INT UNSIGNED NOT NULL,
  `gender` VARCHAR(20) NOT NULL DEFAULT '',
  `phone` VARCHAR(20) NOT NULL DEFAULT '',
  `address` LONGTEXT NOT NULL DEFAULT (''),
  `patient_id` VARCHAR(24) NOT NULL,
  `token_number` INT UNSIGNED NOT NULL,
  `password` VARCHAR(128) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `core_patient_patient_id_uniq` (`patient_id`),
  KEY `core_patient_created_at_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  2. DOCTOR — Doctor master record                                      │
-- │     - consultation_fee: default 0.00                                   │
-- └─────────────────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS `core_doctor` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `updated_at` DATETIME(6) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `specialization` VARCHAR(120) NOT NULL,
  `consultation_fee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `core_doctor_name_idx` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  3. DOCTOR PROFILE — Auth & registration details for doctors           │
-- │     - Status flow: pending → approved | rejected (set by admin)       │
-- │     - password: hashed via Django's make_password                     │
-- │     - One-to-one link with core_doctor                                │
-- └─────────────────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS `core_doctorprofile` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `updated_at` DATETIME(6) NOT NULL,
  `email` VARCHAR(254) NOT NULL,
  `phone` VARCHAR(20) NOT NULL DEFAULT '',
  `registration_number` VARCHAR(50) NOT NULL DEFAULT '',
  `password` VARCHAR(128) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
  `doctor_id` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `core_doctorprofile_email_uniq` (`email`),
  UNIQUE KEY `core_doctorprofile_doctor_id_uniq` (`doctor_id`),
  CONSTRAINT `core_doctorprofile_doctor_fk` FOREIGN KEY (`doctor_id`)
    REFERENCES `core_doctor` (`id`) ON DELETE CASCADE,
  KEY `core_doctorprofile_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  4. APPOINTMENT — Links patients & doctors with a date                 │
-- │     - status: scheduled / completed / cancelled                       │
-- └─────────────────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS `core_appointment` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `updated_at` DATETIME(6) NOT NULL,
  `date` DATE NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  `patient_id` BIGINT NOT NULL,
  `doctor_id` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_appointment_patient_fk` (`patient_id`),
  KEY `core_appointment_doctor_fk` (`doctor_id`),
  KEY `core_appointment_date_idx` (`date`),
  CONSTRAINT `core_appointment_patient_fk` FOREIGN KEY (`patient_id`)
    REFERENCES `core_patient` (`id`) ON DELETE CASCADE,
  CONSTRAINT `core_appointment_doctor_fk` FOREIGN KEY (`doctor_id`)
    REFERENCES `core_doctor` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  5. CONSULTATION NOTE — Doctor's observations per patient visit        │
-- │     - observations: required clinical notes                           │
-- │     - diagnosis_summary: optional summary                             │
-- └─────────────────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS `core_consultationnote` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `updated_at` DATETIME(6) NOT NULL,
  `observations` LONGTEXT NOT NULL,
  `diagnosis_summary` LONGTEXT NOT NULL DEFAULT (''),
  `patient_id` BIGINT NOT NULL,
  `doctor_id` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_consultationnote_patient_fk` (`patient_id`),
  KEY `core_consultationnote_doctor_fk` (`doctor_id`),
  CONSTRAINT `core_consultationnote_patient_fk` FOREIGN KEY (`patient_id`)
    REFERENCES `core_patient` (`id`) ON DELETE CASCADE,
  CONSTRAINT `core_consultationnote_doctor_fk` FOREIGN KEY (`doctor_id`)
    REFERENCES `core_doctor` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  6. PRESCRIPTION — Medicines prescribed by doctor                     │
-- │     - ai_drug_recommendation: stores AI-generated drug suggestion     │
-- └─────────────────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS `core_prescription` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `updated_at` DATETIME(6) NOT NULL,
  `medicine_name` VARCHAR(120) NOT NULL,
  `dosage` VARCHAR(120) NOT NULL,
  `duration_days` INT UNSIGNED NOT NULL DEFAULT 1,
  `notes` VARCHAR(255) NOT NULL DEFAULT '',
  `ai_drug_recommendation` LONGTEXT NOT NULL DEFAULT (''),
  `patient_id` BIGINT NOT NULL,
  `doctor_id` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_prescription_patient_fk` (`patient_id`),
  KEY `core_prescription_doctor_fk` (`doctor_id`),
  CONSTRAINT `core_prescription_patient_fk` FOREIGN KEY (`patient_id`)
    REFERENCES `core_patient` (`id`) ON DELETE CASCADE,
  CONSTRAINT `core_prescription_doctor_fk` FOREIGN KEY (`doctor_id`)
    REFERENCES `core_doctor` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  7. DIAGNOSTIC TEST — Lab test orders and results                     │
-- │     - report_sent: True when lab tech clicks "Send Report"            │
-- │     - status: requested / in-progress / completed                     │
-- └─────────────────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS `core_diagnostictest` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `updated_at` DATETIME(6) NOT NULL,
  `test_name` VARCHAR(120) NOT NULL,
  `result` LONGTEXT NOT NULL DEFAULT (''),
  `lab_charge` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(20) NOT NULL DEFAULT 'requested',
  `report_sent` TINYINT(1) NOT NULL DEFAULT 0,
  `patient_id` BIGINT NOT NULL,
  `doctor_id` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_diagnostictest_patient_fk` (`patient_id`),
  KEY `core_diagnostictest_doctor_fk` (`doctor_id`),
  KEY `core_diagnostictest_status_idx` (`status`),
  CONSTRAINT `core_diagnostictest_patient_fk` FOREIGN KEY (`patient_id`)
    REFERENCES `core_patient` (`id`) ON DELETE CASCADE,
  CONSTRAINT `core_diagnostictest_doctor_fk` FOREIGN KEY (`doctor_id`)
    REFERENCES `core_doctor` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  8. PHARMACY DISPENSE — Medicines dispensed to patients               │
-- │     - Links to prescription for medicine details                      │
-- │     - dispensed: True when pharmacist marks as given                  │
-- └─────────────────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS `core_pharmacydispense` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `updated_at` DATETIME(6) NOT NULL,
  `medicine_cost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `dispensed` TINYINT(1) NOT NULL DEFAULT 0,
  `patient_id` BIGINT NOT NULL,
  `prescription_id` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_pharmacydispense_patient_fk` (`patient_id`),
  KEY `core_pharmacydispense_prescription_fk` (`prescription_id`),
  CONSTRAINT `core_pharmacydispense_patient_fk` FOREIGN KEY (`patient_id`)
    REFERENCES `core_patient` (`id`) ON DELETE CASCADE,
  CONSTRAINT `core_pharmacydispense_prescription_fk` FOREIGN KEY (`prescription_id`)
    REFERENCES `core_prescription` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  9. BILLING RECORD — Consolidated patient bills                       │
-- │     - Auto-calculated from: consultation + lab + pharmacy costs       │
-- └─────────────────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS `core_billingrecord` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `updated_at` DATETIME(6) NOT NULL,
  `consultation_fee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `test_charges` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `medicine_costs` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `patient_id` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_billingrecord_patient_fk` (`patient_id`),
  CONSTRAINT `core_billingrecord_patient_fk` FOREIGN KEY (`patient_id`)
    REFERENCES `core_patient` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- ── Sample Seed Data (Optional) ─────────────────────────────────────────────
-- Uncomment and run these INSERT statements to pre-populate the database
-- with sample doctors for testing purposes.
-- ============================================================================

/*
-- Sample Doctors
INSERT INTO `core_doctor` (`created_at`, `updated_at`, `name`, `specialization`, `consultation_fee`) VALUES
  (NOW(6), NOW(6), 'Dr. Rajesh Kumar',    'Cardiology',          500.00),
  (NOW(6), NOW(6), 'Dr. Priya Sharma',    'General Medicine',    300.00),
  (NOW(6), NOW(6), 'Dr. Anil Mehta',      'Orthopedics',         400.00),
  (NOW(6), NOW(6), 'Dr. Sunita Reddy',    'Pediatrics',          350.00),
  (NOW(6), NOW(6), 'Dr. Vikram Singh',    'Neurology',           600.00),
  (NOW(6), NOW(6), 'Dr. Meena Patel',     'Dermatology',         300.00),
  (NOW(6), NOW(6), 'Dr. Arjun Nair',      'ENT',                 350.00),
  (NOW(6), NOW(6), 'Dr. Kavita Joshi',    'Gynecology',          450.00),
  (NOW(6), NOW(6), 'Dr. Rohit Gupta',     'Psychiatry',          500.00),
  (NOW(6), NOW(6), 'Dr. Deepa Iyer',      'Ophthalmology',       400.00);
*/


-- ============================================================================
-- ── Entity Relationship Diagram (ASCII) ─────────────────────────────────────
-- ============================================================================
--
--  ┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
--  │  core_patient │──┐   │  core_doctor  │──┐   │ core_doctorprofile│
--  │──────────────│  │   │──────────────│  │   │──────────────────│
--  │ id (PK)      │  │   │ id (PK)      │  │   │ id (PK)          │
--  │ patient_id   │  │   │ name         │  │   │ doctor_id (FK→2) │
--  │ name         │  │   │ specialization│  │   │ email            │
--  │ age          │  │   │ consult_fee  │  │   │ password (hash)  │
--  │ gender       │  │   └──────────────┘  │   │ status           │
--  │ phone        │  │          │          │   └──────────────────┘
--  │ address      │  │          │          │
--  │ token_number │  │          │          │
--  │ password     │  │          │          │
--  └──────────────┘  │          │          │
--         │          │          │          │
--         │          │          │          │
--    ┌────▼──────────▼──────────▼──┐       │
--    │     core_appointment        │       │
--    │ patient_id (FK→1)           │       │
--    │ doctor_id  (FK→2)           │       │
--    │ date, status                │       │
--    └─────────────────────────────┘       │
--                                          │
--    ┌─────────────────────────────┐       │
--    │   core_consultationnote     │       │
--    │ patient_id (FK→1)           │◄──────┤
--    │ doctor_id  (FK→2)           │       │
--    │ observations, diagnosis     │       │
--    └─────────────────────────────┘       │
--                                          │
--    ┌─────────────────────────────┐       │
--    │     core_prescription       │       │
--    │ patient_id (FK→1)           │◄──────┤
--    │ doctor_id  (FK→2)           │       │
--    │ medicine_name, dosage       │       │
--    │ ai_drug_recommendation      │       │
--    └──────────┬──────────────────┘       │
--               │                          │
--    ┌──────────▼──────────────────┐       │
--    │   core_pharmacydispense     │       │
--    │ patient_id (FK→1)           │       │
--    │ prescription_id (FK→6)      │       │
--    │ medicine_cost, dispensed     │       │
--    └─────────────────────────────┘       │
--                                          │
--    ┌─────────────────────────────┐       │
--    │    core_diagnostictest      │       │
--    │ patient_id (FK→1)           │◄──────┘
--    │ doctor_id  (FK→2)           │
--    │ test_name, result           │
--    │ lab_charge, report_sent     │
--    └─────────────────────────────┘
--
--    ┌─────────────────────────────┐
--    │    core_billingrecord       │
--    │ patient_id (FK→1)           │
--    │ consultation_fee            │
--    │ test_charges                │
--    │ medicine_costs              │
--    │ total_amount                │
--    └─────────────────────────────┘
--
-- ============================================================================
-- End of HMS Database Schema
-- ============================================================================
