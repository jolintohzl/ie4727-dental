<?php
/* POST api/cancel.php   { id } */
require __DIR__ . '/bootstrap.php';
require_method('POST');
$patientId = require_login();

$appt = find_appointment(int_field(read_json(), 'id'), $patientId);
if (!$appt || !$appt['upcoming']) {
    fail('This appointment can no longer be cancelled.', 404);
}

$stmt = db()->prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ? AND patient_id = ?");
$stmt->execute([$appt['id'], $patientId]);

respond(['appointment' => find_appointment($appt['id'], $patientId)]);
