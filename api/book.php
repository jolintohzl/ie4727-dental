<?php
/* POST api/book.php
   { serviceId, branchId, doctorId, date, time }
   + { name, nric, phone, email, password } when nobody is logged in —
   in that case the account is created and logged in as part of the booking. */
require __DIR__ . '/bootstrap.php';
require_method('POST');

$in = read_json();
$pdo = db();
$patientId = current_patient_id();
$errors = [];

// ---- 1. Who is booking ----
if ($patientId === null) {
    [$patient, $errors] = validate_patient($in, true);
    $errors += uniqueness_errors($patient);
    if (isset($errors['email']) && strpos($errors['email'], 'already exists') !== false) {
        $errors['email'] .= ' Log in to book with it.';
    }
}

// ---- 2. What, where, who and when ----
$serviceId = int_field($in, 'serviceId');
$branchId  = int_field($in, 'branchId');
$doctorId  = int_field($in, 'doctorId');
$date      = str_field($in, 'date');
$time      = str_field($in, 'time');

$stmt = $pdo->prepare('SELECT id FROM services WHERE id = ?');
$stmt->execute([$serviceId]);
if (!$stmt->fetch()) {
    $errors['serviceId'] = 'Please choose a service.';
}

$stmt = $pdo->prepare('SELECT id FROM branches WHERE id = ?');
$stmt->execute([$branchId]);
if (!$stmt->fetch()) {
    $errors['branchId'] = 'Please choose a branch.';
}

if ($error = date_error($date)) {
    $errors['date'] = $error;
} elseif (!isset($errors['branchId']) && !in_array($time, branch_slots($branchId, $date), true)) {
    $errors['time'] = 'Please choose one of the available times.';
}

if (!isset($errors['serviceId']) && !in_array($doctorId, doctors_for_service($serviceId), true)) {
    $errors['doctorId'] = 'Please choose a doctor for this service.';
}

if ($errors) {
    fail('Please fix the highlighted fields.', 422, $errors);
}

if ($patientId !== null && patient_busy($patientId, $date, $time)) {
    fail('You already have an appointment at this time.', 409, ['time' => 'You already have an appointment at this time.']);
}

// ---- 3. Save (account + appointment together, or neither) ----
try {
    $pdo->beginTransaction();

    $isNewAccount = $patientId === null;
    if ($isNewAccount) {
        $stmt = $pdo->prepare('INSERT INTO patients (name, nric, phone, email, password_hash) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([
            $patient['name'], $patient['nric'], $patient['phone'], $patient['email'],
            password_hash($patient['password'], PASSWORD_DEFAULT),
        ]);
        $patientId = (int) $pdo->lastInsertId();
    }

    $stmt = $pdo->prepare(
        'INSERT INTO appointments (patient_id, doctor_id, service_id, branch_id, appt_date, appt_time)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$patientId, $doctorId, $serviceId, $branchId, $date, $time]);
    $appointmentId = (int) $pdo->lastInsertId();

    $pdo->commit();
} catch (PDOException $e) {
    $pdo->rollBack();
    if (is_duplicate($e)) {
        // someone else took the slot (or the email/NRIC) a moment ago
        fail('Sorry, that timeslot was just taken. Please choose another time.', 409, ['time' => 'This time was just taken.']);
    }
    throw $e;
}

if ($isNewAccount) {
    log_in($patientId);
}

respond([
    'appointment' => find_appointment($appointmentId, $patientId),
    'newAccount'  => $isNewAccount,
], 201);
