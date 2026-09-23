-- ==========================================================
-- Adds the booking_drafts table to an EXISTING smile_dental database
-- without wiping any accounts or bookings.
--
-- Only needed if you imported schema.sql before this table was added.
-- phpMyAdmin → click smile_dental → Import → choose this file → Go
-- (schema.sql already includes the table for fresh installs.)
-- ==========================================================

USE smile_dental;

CREATE TABLE IF NOT EXISTS booking_drafts (
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


