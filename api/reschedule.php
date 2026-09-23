<?php
/* POST api/reschedule.php   { id, date, time }
   Moves an upcoming appointment to a new slot with the same doctor and branch. */
require __DIR__ . '/bootstrap.php';
require_method('POST');
$patientId = require_login();

$in   = read_json();
$appt = find_appointment(int_field($in, 'id'), $patientId);
$date = str_field($in, 'date');
$time = str_field($in, 'time');

if (!$appt || !$appt['upcoming']) {
    fail('This appointment can no longer be changed.', 404);
}
if ($error = date_error($date)) {
    fail($error, 422, ['date' => $error]);
}
if (!in_array($time, branch_slots($appt['branchId'], $date), true)) {
    fail('Please choose one of the available times.', 422, ['time' => 'Please choose one of the available times.']);
}
if ($date === $appt['date'] && $time === $appt['time']) {
    fail('That is already your appointment time.', 422, ['time' => 'That is already your appointment time.']);
}
if (patient_busy($patientId, $date, $time, $appt['id'])) {
    fail('You already have another appointment at this time.', 409, ['time' => 'You already have another appointment at this time.']);
}

try {
    $stmt = db()->prepare('UPDATE appointments SET appt_date = ?, appt_time = ? WHERE id = ? AND patient_id = ?');
    $stmt->execute([$date, $time, $appt['id'], $patientId]);
} catch (PDOException $e) {
    if (is_duplicate($e)) {
        fail('Sorry, that timeslot was just taken. Please choose another time.', 409, ['time' => 'This time was just taken.']);
    }
    throw $e;
}

respond(['appointment' => find_appointment($appt['id'], $patientId)]);
