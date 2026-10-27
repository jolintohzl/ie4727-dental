<?php
/* ==========================================================
   Shared by doctor-login.php and doctor-dashboard.php.

   Doctors log in separately from patients: their id is kept in
   $_SESSION['doctor_id'], so a doctor and a patient session never
   mix. Like login.php, these pages are plain HTML forms that post
   back to themselves — no JavaScript requests and no JSON.

   Every form changes something only on POST, and the session cookie
   is SameSite=Lax (api/bootstrap.php), so another website cannot
   submit these forms with the doctor's login.
   ========================================================== */
require_once __DIR__ . '/../api/bootstrap.php';
require_once __DIR__ . '/result-page.php';

// These pages are HTML; bootstrap.php set a JSON header for the /api endpoints.
header_remove('Content-Type');
header('Content-Type: text/html; charset=utf-8');

// ...and anything unexpected should draw a page, not answer in JSON.
set_exception_handler(function (Throwable $e) {
    error_log($e);
    render_result_page('Something went wrong', 'error',
        '<p>Something went wrong on our side. Please try again.</p>'
        . '<p><a href="doctor-dashboard.php" class="btn btn-primary btn-lg">Back to my schedule</a></p>', 500);
});

function e($value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}


/* ---------- Login ---------- */

function current_doctor_id(): ?int
{
    return isset($_SESSION['doctor_id']) ? (int) $_SESSION['doctor_id'] : null;
}

function find_doctor(int $id): ?array
{
    $stmt = db()->prepare('SELECT id, name, role, email FROM doctors WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function log_in_doctor(int $doctorId)
{
    // a fresh session id on login stops session-fixation attacks
    session_regenerate_id(true);
    $_SESSION['doctor_id'] = $doctorId;
}

function log_out_doctor()
{
    unset($_SESSION['doctor_id']);
    session_regenerate_id(true);
}


/* ---------- One-time messages ----------
   Set before a redirect, shown once on the next page load:
     flash('notice', 'Appointment cancelled.');   // set
     $notice = flash('notice');                   // read + forget */
function flash(string $key, $value = null)
{
    if ($value !== null) {
        $_SESSION['flash'][$key] = $value;
        return null;
    }
    $value = $_SESSION['flash'][$key] ?? null;
    unset($_SESSION['flash'][$key]);
    return $value;
}


/* ---------- The doctor's appointments ---------- */

const DOCTOR_APPOINTMENT_SELECT = "
    SELECT a.id, a.status,
           DATE_FORMAT(a.appt_date, '%Y-%m-%d') AS date,
           TIME_FORMAT(a.appt_time, '%H:%i')    AS time,
           a.patient_id AS patientId,
           a.doctor_id  AS doctorId,
           a.branch_id  AS branchId,
           a.service_id AS serviceId,
           p.name AS patient,
           s.name AS service,
           b.name AS branch
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      JOIN services s ON s.id = a.service_id
      JOIN branches b ON b.id = a.branch_id
";

// Every appointment with this doctor, earliest first.
function doctor_appointments(int $doctorId): array
{
    $stmt = db()->prepare(DOCTOR_APPOINTMENT_SELECT . ' WHERE a.doctor_id = ? ORDER BY a.appt_date, a.appt_time');
    $stmt->execute([$doctorId]);
    return array_map('shape_doctor_appointment', $stmt->fetchAll());
}

function find_doctor_appointment(int $id, int $doctorId): ?array
{
    $stmt = db()->prepare(DOCTOR_APPOINTMENT_SELECT . ' WHERE a.id = ? AND a.doctor_id = ?');
    $stmt->execute([$id, $doctorId]);
    $row = $stmt->fetch();
    return $row ? shape_doctor_appointment($row) : null;
}

function shape_doctor_appointment(array $row): array
{
    $row = shape_appointment($row);   // ids → int, upcoming, reference
    $row['patientId'] = (int) $row['patientId'];
    return $row;
}

// Each start time at the appointment's branch on $date → is this doctor free then?
// The appointment's own current slot counts as taken.
function doctor_free_slots(array $appt, string $date): array
{
    $booked = booked_times([$appt['doctorId']], $date);
    $slots = [];
    foreach (branch_slots($appt['branchId'], $date) as $time) {
        $slots[$time] = !isset($booked[$time]);
    }
    return $slots;
}


/* ---------- Formatting (same as js/site.js) ---------- */

// "2026-10-28" → "Wed, 28 October 2026"
function format_date(string $iso): string
{
    return date('D, j F Y', strtotime($iso));
}

// "13:30" → "1.30pm"
function format_time(string $hhmm): string
{
    return date('g.ia', strtotime($hhmm));
}
