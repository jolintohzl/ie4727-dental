<?php
/* GET api/slots.php?service=3&branch=1&date=2026-10-01
   GET api/slots.php?doctor=6&branch=1&date=2026-10-01   (rescheduling)

   Lists every timeslot that day and which doctors are still free in it:
   { slots: [ { time: "09:00", freeDoctors: [5, 7] }, ... ] }
   A slot with no free doctors is fully booked. */
require __DIR__ . '/bootstrap.php';
require_method('GET');

$serviceId = int_field($_GET, 'service');
$doctorId  = int_field($_GET, 'doctor');
$branchId  = int_field($_GET, 'branch');
$date      = str_field($_GET, 'date');

if ($error = date_error($date)) {
    fail($error, 422);
}
if ($branchId <= 0 || ($serviceId <= 0 && $doctorId <= 0)) {
    fail('Choose a branch and a service first.', 422);
}

$doctorIds = $doctorId > 0 ? [$doctorId] : doctors_for_service($serviceId);
$booked = booked_times($doctorIds, $date);

$slots = [];
foreach (branch_slots($branchId, $date) as $time) {
    $slots[] = [
        'time'        => $time,
        'freeDoctors' => array_values(array_diff($doctorIds, $booked[$time] ?? [])),
    ];
}

respond(['date' => $date, 'slots' => $slots]);
