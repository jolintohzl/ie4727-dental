-- ==========================================================
-- SMILE DENTAL GROUP — database schema + starter data
--
-- HOW TO RUN (XAMPP):
--   phpMyAdmin → Import → choose this file → Go
--   or in a terminal:
--   /Applications/XAMPP/xamppfiles/bin/mysql -u root < database/schema.sql
--
-- Running it again wipes every table and starts fresh.
-- ==========================================================

CREATE DATABASE IF NOT EXISTS smile_dental
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE smile_dental;

DROP TABLE IF EXISTS job_applications;
DROP TABLE IF EXISTS booking_drafts;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS doctor_services;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS branch_hours;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS patients;


-- ----------------------------------------------------------
-- 1. PATIENTS  (one row per registered account)
-- ----------------------------------------------------------
CREATE TABLE patients (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    nric          CHAR(9)      NOT NULL UNIQUE,     -- e.g. T0498462A
    phone         VARCHAR(8)   NOT NULL,            -- 8 digits, no +65
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,            -- from PHP password_hash()
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- ----------------------------------------------------------
-- 2. BRANCHES + OPENING HOURS  (same details as locate-us.html)
-- ----------------------------------------------------------
CREATE TABLE branches (
    id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug     VARCHAR(40)  NOT NULL UNIQUE,
    name     VARCHAR(60)  NOT NULL,
    address  VARCHAR(160) NOT NULL,
    phone    VARCHAR(20)  NOT NULL,
    map_img  VARCHAR(120) NOT NULL
) ENGINE=InnoDB;

-- weekday: 0 = Sunday ... 6 = Saturday (same as JavaScript's getDay()).
-- A day with no row means the branch is closed.
CREATE TABLE branch_hours (
    branch_id  INT UNSIGNED NOT NULL,
    weekday    TINYINT      NOT NULL,
    open_time  TIME         NOT NULL,
    close_time TIME         NOT NULL,
    PRIMARY KEY (branch_id, weekday),
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- ----------------------------------------------------------
-- 3. SERVICES  (same six as services.html)
-- ----------------------------------------------------------
CREATE TABLE services (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug        VARCHAR(40)  NOT NULL UNIQUE,
    name        VARCHAR(60)  NOT NULL,
    summary     VARCHAR(255) NOT NULL,
    price_from  INT UNSIGNED NOT NULL
) ENGINE=InnoDB;


-- ----------------------------------------------------------
-- 4. DOCTORS  (same people as doctors.html) + what each one treats
-- ----------------------------------------------------------
CREATE TABLE doctors (
    id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name      VARCHAR(80)  NOT NULL,
    specialty VARCHAR(40)  NOT NULL,   -- matches the section ids on doctors.html
    role      VARCHAR(60)  NOT NULL,
    bio       VARCHAR(255) NOT NULL,
    photo     VARCHAR(120) NOT NULL,
    email         VARCHAR(255) NULL UNIQUE,   -- doctor-login.php; NULL = cannot log in
    password_hash VARCHAR(255) NULL           -- from PHP password_hash()
) ENGINE=InnoDB;

CREATE TABLE doctor_services (
    doctor_id  INT UNSIGNED NOT NULL,
    service_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (doctor_id, service_id),
    FOREIGN KEY (doctor_id)  REFERENCES doctors(id)  ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- ----------------------------------------------------------
-- 5. APPOINTMENTS
--
-- Every appointment is one 30-minute slot. A doctor can only be in one
-- place at a time, so (doctor, date, time) must be unique — but only for
-- bookings that are still active. `active_slot` is 1 while booked and NULL
-- once cancelled; NULLs never clash in a UNIQUE index, so a cancelled slot
-- can be booked again.
-- ----------------------------------------------------------
CREATE TABLE appointments (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id  INT UNSIGNED NOT NULL,
    doctor_id   INT UNSIGNED NOT NULL,
    service_id  INT UNSIGNED NOT NULL,
    branch_id   INT UNSIGNED NOT NULL,
    appt_date   DATE         NOT NULL,
    appt_time   TIME         NOT NULL,
    status      ENUM('booked', 'cancelled') NOT NULL DEFAULT 'booked',
    active_slot TINYINT AS (IF(status = 'booked', 1, NULL)) PERSISTENT,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY one_booking_per_slot (doctor_id, appt_date, appt_time, active_slot),
    KEY by_patient (patient_id, appt_date),

    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id)  REFERENCES doctors(id),
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (branch_id)  REFERENCES branches(id)
) ENGINE=InnoDB;


-- ----------------------------------------------------------
-- 6. BOOKING DRAFTS  (a booking that has been started but not confirmed)
--
-- appointment.php saves what has been filled in after every step, so a
-- refresh can put it all back. Nothing here is a real booking — that only
-- happens in `appointments` once "Confirm booking" is clicked, and then the
-- draft is deleted. Drafts untouched for 7 days are deleted automatically.
--
-- Whose draft it is:
--   logged in  → patient_id  (survives closing the browser)
--   guest      → session_id  (PHP's session cookie; lasts until the browser closes)
-- The password is never stored here.
-- ----------------------------------------------------------
CREATE TABLE booking_drafts (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id  VARCHAR(128) NULL UNIQUE,
    patient_id  INT UNSIGNED NULL UNIQUE,
    step        TINYINT UNSIGNED NOT NULL DEFAULT 1,    -- the step they were on (1 – 4)

    -- step 1 (guests only; logged-in patients' details are in `patients`)
    name        VARCHAR(100) NULL,
    nric        CHAR(9)      NULL,
    phone       VARCHAR(8)   NULL,
    email       VARCHAR(255) NULL,

    -- steps 2 – 4
    service_id  INT UNSIGNED NULL,
    branch_id   INT UNSIGNED NULL,
    appt_date   DATE         NULL,
    appt_time   TIME         NULL,
    doctor_id   INT UNSIGNED NULL,

    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
    FOREIGN KEY (branch_id)  REFERENCES branches(id) ON DELETE SET NULL,
    FOREIGN KEY (doctor_id)  REFERENCES doctors(id)  ON DELETE SET NULL
) ENGINE=InnoDB;


-- ----------------------------------------------------------
-- Applications sent by the careers form on about-us.html.
-- The resume itself lives in storage/resumes/ under a random
-- name; resume_name is only what the applicant called it.
-- ----------------------------------------------------------
CREATE TABLE job_applications (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name    VARCHAR(100) NOT NULL,
    email        VARCHAR(255) NOT NULL,
    phone        VARCHAR(8)   NOT NULL,
    position     VARCHAR(32)  NOT NULL,          -- matches the <select> values
    message      TEXT         NULL,

    resume_name  VARCHAR(255) NOT NULL,
    resume_file  VARCHAR(80)  NOT NULL,
    resume_size  INT UNSIGNED NOT NULL,

    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_ip VARCHAR(45) NULL,

    INDEX (email),
    INDEX (submitted_at)
) ENGINE=InnoDB;


-- ==========================================================
-- STARTER DATA
-- ==========================================================

INSERT INTO branches (id, slug, name, address, phone, map_img) VALUES
(1, 'orchard',     'Orchard',     '123 Orchard Road, #05-12, Singapore 238888',        '+65 6123 4567', 'images/map-orchard.svg'),
(2, 'tampines',    'Tampines',    '8 Tampines Central 1, #03-21, Singapore 529536',    '+65 6234 5678', 'images/map-tampines.svg'),
(3, 'jurong-east', 'Jurong East', '50 Jurong Gateway Road, #04-07, Singapore 608549',  '+65 6345 6789', 'images/map-jurong.svg');

INSERT INTO branch_hours (branch_id, weekday, open_time, close_time) VALUES
-- Orchard: Mon–Fri 9.00am–7.00pm, Sat 9.00am–2.00pm, Sun closed
(1, 1, '09:00', '19:00'), (1, 2, '09:00', '19:00'), (1, 3, '09:00', '19:00'),
(1, 4, '09:00', '19:00'), (1, 5, '09:00', '19:00'), (1, 6, '09:00', '14:00'),
-- Tampines: Mon–Fri 10.00am–8.00pm, Sat 9.00am–5.00pm, Sun 9.00am–1.00pm
(2, 1, '10:00', '20:00'), (2, 2, '10:00', '20:00'), (2, 3, '10:00', '20:00'),
(2, 4, '10:00', '20:00'), (2, 5, '10:00', '20:00'), (2, 6, '09:00', '17:00'),
(2, 0, '09:00', '13:00'),
-- Jurong East: Mon–Fri 9.00am–6.30pm, Sat 9.00am–4.00pm, Sun closed
(3, 1, '09:00', '18:30'), (3, 2, '09:00', '18:30'), (3, 3, '09:00', '18:30'),
(3, 4, '09:00', '18:30'), (3, 5, '09:00', '18:30'), (3, 6, '09:00', '16:00');

INSERT INTO services (id, slug, name, summary, price_from) VALUES
(1, 'general-dentistry', 'General Dentistry',   'Check-ups, scaling and polishing, X-rays and simple fillings.',                  45),
(2, 'braces',            'Braces / Invisalign', 'Straightening teeth with fixed braces or clear removable aligners.',             5500),
(3, 'root-canal',        'Root Canal',          'Clears infection inside a tooth so it can be saved instead of taken out.',       1100),
(4, 'implants',          'Dental Implants',     'A titanium post and crown that replace a missing tooth.',                        4500),
(5, 'crowns-bridges',    'Crowns and Bridges',  'Caps for cracked or worn teeth, and bridges that fill a gap.',                   1300),
(6, 'dentures',          'Dentures',            'Removable replacements for several missing teeth or a full arch.',               700);

INSERT INTO doctors (id, name, specialty, role, bio, photo) VALUES
-- General dentists
(1,  'Dr. Tan Wei Ling',   'general', 'Family Dentistry',     'Graduated from NUS Dentistry in 2011 and has spent her career in family practice.',           'images/doctor-general-1.jpg'),
(2,  'Dr. Marcus Lim',     'general', 'Preventive Care',      'Twelve years of experience and a strong preference for catching problems early.',            'images/doctor-general-2.jpg'),
(3,  'Dr. Daniel Ong',     'general', 'Paediatric Dentistry', 'Trained in Melbourne; makes first dental visits something children do not dread.',          'images/doctor-general-3.jpg'),
(4,  'Dr. Aaron Tan',      'general', 'Emergency Care',       'Nine years in practice, much of it on our walk-in emergency list.',                          'images/doctor-general-4.jpg'),
-- Endodontists
(5,  'Dr. Jason Koh',      'endodontics', 'Retreatment',        'Fifteen years in specialist practice, taking on cases other clinics could not settle.',   'images/doctor-endodontics-2.jpg'),
(6,  'Dr. Lim Hui Min',    'endodontics', 'Root Canal Therapy', 'Master''s in Endodontics (HKU) and well over two thousand root canal treatments.',          'images/doctor-endodontics-1.jpg'),
(7,  'Dr. Benjamin Sim',   'endodontics', 'Microsurgery',       'Trained in surgical endodontics in the UK; works under the operating microscope.',        'images/doctor-endodontics-3.jpg'),
(8,  'Dr. Ryan Chua',      'endodontics', 'Dental Trauma',      'Seven years in hospital practice with knocked-out and fractured teeth.',                  'images/doctor-endodontics-4.jpg'),
-- Orthodontists
(9,  'Dr. Ethan Wong',     'orthodontics', 'Fixed Braces',    'Orthodontic residency in Sydney and fourteen years of complex bite corrections.',            'images/doctor-orthodontics-2.jpg'),
(10, 'Dr. Samuel Teo',     'orthodontics', 'Early Treatment', 'Focuses on children aged seven to twelve, guiding growth early.',                           'images/doctor-orthodontics-3.jpg'),
(11, 'Dr. Nicholas Yeo',   'orthodontics', 'Retention',       'Ten years in orthodontics, looking after the retention stage.',                              'images/doctor-orthodontics-4.jpg'),
(12, 'Dr. Ng Jia Hui',     'orthodontics', 'Clear Aligners',  'Certified aligner provider since 2015 with more than a thousand cases planned.',            'images/doctor-orthodontics-1.jpg'),
-- Periodontists
(13, 'Dr. Chua Mei Xin',   'periodontics', 'Gum Disease',         'Specialist periodontist (King''s College London), thirteen years treating gum disease.', 'images/doctor-periodontics-1.jpg'),
(14, 'Dr. Kelvin Ho',      'periodontics', 'Gum Grafting',        'Eleven years of experience rebuilding receded gum lines.',                              'images/doctor-periodontics-2.jpg'),
(15, 'Dr. Darren Loh',     'periodontics', 'Implant Maintenance', 'Keeps the gum and bone around implants healthy.',                                       'images/doctor-periodontics-3.jpg'),
-- Prosthodontists
(16, 'Dr. Goh Shu Fen',    'prosthodontics', 'Crowns & Bridges', 'Trained in Japan; sixteen years in full-mouth rehabilitation and shade matching.',       'images/doctor-prosthodontics-1.jpg'),
(17, 'Dr. Jonathan Neo',   'prosthodontics', 'Dental Implants',  'Over a decade placing and restoring implants, with advanced bone-grafting training.',   'images/doctor-prosthodontics-2.jpg'),
(18, 'Dr. Bryan Seah',     'prosthodontics', 'Dentures',         'Twelve years on removable prosthetics; known for making a difficult denture fit.',       'images/doctor-prosthodontics-3.jpg');

-- Doctor log-ins for doctor-login.php: "Dr. Tan Wei Ling" → tan.wei.ling@smiledental.local
-- TEST PASSWORD for every doctor: Doctor123   (change these before going live)
UPDATE doctors
   SET email = CONCAT(LOWER(REPLACE(REPLACE(name, 'Dr. ', ''), ' ', '.')), '@smiledental.local'),
       password_hash = '$2y$10$GrSS8PH91GG1gKBXCzxnfugDjAkLZ51hW5tFyxFFzE7465LdwboMe';

-- Who can be booked for which service
INSERT INTO doctor_services (doctor_id, service_id) VALUES
-- General Dentistry: the four general dentists + the gum-disease specialist
(1, 1), (2, 1), (3, 1), (4, 1), (13, 1),
-- Braces / Invisalign: orthodontists
(9, 2), (10, 2), (11, 2), (12, 2),
-- Root Canal: endodontists
(5, 3), (6, 3), (7, 3), (8, 3),
-- Dental Implants: implant surgeon + the two implant-related periodontists
(17, 4), (14, 4), (15, 4),
-- Crowns and Bridges / Dentures: prosthodontists
(16, 5), (17, 5), (18, 5),
(16, 6), (18, 6);
