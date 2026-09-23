<?php
/* GET api/appointments.php — the logged-in patient's appointments,
   soonest first. Each one has "upcoming": true/false. */
require __DIR__ . '/bootstrap.php';
require_method('GET');
$patientId = require_login();

$stmt = db()->prepare(APPOINTMENT_SELECT . ' WHERE a.patient_id = ? ORDER BY a.appt_date, a.appt_time');
$stmt->execute([$patientId]);

respond(['appointments' => array_map('shape_appointment', $stmt->fetchAll())]);
