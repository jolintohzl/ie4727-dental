<?php
/* GET  api/profile.php — the logged-in patient's details
   POST api/profile.php — { name, nric, phone, email } saves changes */
require __DIR__ . '/bootstrap.php';
$patientId = require_login();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    respond(['patient' => find_patient($patientId)]);
}

require_method('POST');
[$clean, $errors] = validate_patient(read_json(), false);
if (!$errors) {
    $errors = uniqueness_errors($clean, $patientId);
}
if ($errors) {
    fail('Please fix the highlighted fields.', 422, $errors);
}

try {
    $stmt = db()->prepare('UPDATE patients SET name = ?, nric = ?, phone = ?, email = ? WHERE id = ?');
    $stmt->execute([$clean['name'], $clean['nric'], $clean['phone'], $clean['email'], $patientId]);
} catch (PDOException $e) {
    if (is_duplicate($e)) {
        fail('That email or NRIC/FIN is already used by another account.', 409);
    }
    throw $e;
}

respond(['patient' => find_patient($patientId)]);
