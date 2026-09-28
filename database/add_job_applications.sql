-- ==========================================================
-- Adds the job_applications table to an EXISTING smile_dental database
-- without wiping any accounts or bookings.
--
-- Stores what the careers form on about-us.html sends. The resume file
-- itself is written to storage/resumes/ — only its name is kept here.
--
-- phpMyAdmin → click smile_dental → Import → choose this file → Go
-- (schema.sql already includes the table for fresh installs.)
-- ==========================================================

USE smile_dental;

CREATE TABLE IF NOT EXISTS job_applications (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name    VARCHAR(100) NOT NULL,
    email        VARCHAR(255) NOT NULL,
    phone        VARCHAR(8)   NOT NULL,
    position     VARCHAR(32)  NOT NULL,          -- matches the <select> values
    message      TEXT         NULL,

    -- the name the applicant's file had, kept only so the clinic can
    -- recognise it; never used to build a path
    resume_name  VARCHAR(255) NOT NULL,
    -- the randomly generated name it was actually saved as
    resume_file  VARCHAR(80)  NOT NULL,
    resume_size  INT UNSIGNED NOT NULL,

    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_ip VARCHAR(45) NULL,

    INDEX (email),
    INDEX (submitted_at)
) ENGINE=InnoDB;
