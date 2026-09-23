<?php
/* ==========================================================
   The booking a visitor has started but not confirmed yet.

   GET  api/draft.php   → { draft: {...} }  or  { draft: null }
   POST api/draft.php   { step, name, nric, phone, email,
                          serviceId, branchId, date, time, doctorId }  → saves it
   POST api/draft.php   { clear: true }  → deletes it ("Start over")

   Logged in → the draft belongs to the account (patient_id).
   Guest     → it belongs to this browser's PHP session (session_id).

   A draft is only a memory of the form, so saving never fails
   because a value is missing or wrong — anything invalid is just
   stored as empty. book.php does the real checks at the end.
   ========================================================== */
require __DIR__ . '/bootstrap.php';

$pdo = db();
$patientId = current_patient_id();

// whose draft: the column to match on, and its value
$owner = $patientId !== null
    ? ['patient_id', $patientId]
    : ['session_id', session_id()];


/* ---------- GET: send the draft back to the form ---------- */

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare(
        "SELECT step, name, nric, phone, email,
                service_id AS serviceId, branch_id AS branchId, doctor_id AS doctorId,
                DATE_FORMAT(appt_date, '%Y-%m-%d') AS date,
                TIME_FORMAT(appt_time, '%H:%i')    AS time
           FROM booking_drafts
          WHERE {$owner[0]} = ?"
    );
    $stmt->execute([$owner[1]]);
    $draft = $stmt->fetch();

    if ($draft) {
        foreach (['step', 'serviceId', 'branchId', 'doctorId'] as $key) {
            $draft[$key] = $draft[$key] === null ? null : (int) $draft[$key];
        }
    }
    respond(['draft' => $draft ?: null]);
}


/* ---------- POST ---------- */

require_method('POST');
$in = read_json();

if (!empty($in['clear'])) {
    $stmt = $pdo->prepare("DELETE FROM booking_drafts WHERE {$owner[0]} = ?");
    $stmt->execute([$owner[1]]);
    respond(['draft' => null]);
}

// Returns $id if that row exists in $table, otherwise null.
function existing_id(string $table, int $id): ?int
{
    if ($id <= 0) {
        return null;
    }
    $stmt = db()->prepare("SELECT id FROM $table WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch() ? $id : null;
}

// Step 1 — guests only. Keep each detail that passes validation.
$details = ['name' => null, 'nric' => null, 'phone' => null, 'email' => null];
if ($patientId === null) {
    [$clean, $errors] = validate_patient($in, false);
    foreach ($details as $field => $_) {
        if (!isset($errors[$field])) {
            $details[$field] = $clean[$field];
        }
    }
}

// Steps 2 – 4
$serviceId = existing_id('services', int_field($in, 'serviceId'));
$branchId  = existing_id('branches', int_field($in, 'branchId'));

$date = str_field($in, 'date');
if ($date === '' || date_error($date) !== null) {
    $date = null;
}

$time = str_field($in, 'time');
if ($date === null || !preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $time)) {
    $time = null;
}

$doctorId = int_field($in, 'doctorId');
if ($serviceId === null || !in_array($doctorId, doctors_for_service($serviceId), true)) {
    $doctorId = null;
}

$step = min(max(int_field($in, 'step'), 1), 4);

// One draft per owner: insert the first time, update after that.
$stmt = $pdo->prepare(
    "INSERT INTO booking_drafts
            ({$owner[0]}, step, name, nric, phone, email, service_id, branch_id, appt_date, appt_time, doctor_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
            step = VALUES(step), name = VALUES(name), nric = VALUES(nric),
            phone = VALUES(phone), email = VALUES(email),
            service_id = VALUES(service_id), branch_id = VALUES(branch_id),
            appt_date = VALUES(appt_date), appt_time = VALUES(appt_time),
            doctor_id = VALUES(doctor_id)"
);
$stmt->execute([
    $owner[1], $step,
    $details['name'], $details['nric'], $details['phone'], $details['email'],
    $serviceId, $branchId, $date, $time, $doctorId,
]);

// housekeeping: forget drafts nobody has touched for a week
$pdo->exec('DELETE FROM booking_drafts WHERE updated_at < NOW() - INTERVAL 7 DAY');

respond(['saved' => true]);
