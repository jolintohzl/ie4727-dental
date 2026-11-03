-- ==========================================================
-- Gives every doctor a log-in for doctor-login.php, in an EXISTING
-- smile_dental database, without wiping any accounts or bookings.
--
-- Each doctor's email is made from their name:
--   "Dr. Tan Wei Ling" → tan.wei.ling@smiledental.local
-- TEST PASSWORD for every doctor: Doctor123
--
-- (schema.sql already includes the columns for fresh installs.)
-- ==========================================================

USE smile_dental;

ALTER TABLE doctors
    ADD COLUMN IF NOT EXISTS email         VARCHAR(255) NULL UNIQUE,
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL;

UPDATE doctors
   SET email = CONCAT(LOWER(REPLACE(REPLACE(name, 'Dr. ', ''), ' ', '.')), '@smiledental.local'),
       password_hash = '$2y$10$GrSS8PH91GG1gKBXCzxnfugDjAkLZ51hW5tFyxFFzE7465LdwboMe';
