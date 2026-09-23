<?php
/* GET api/session.php — who is logged in (used by the navbar on every page) */
require __DIR__ . '/bootstrap.php';
require_method('GET');

$id = current_patient_id();
$patient = $id === null ? null : find_patient($id);

// the account may have been removed from the database since logging in
if ($id !== null && $patient === null) {
    $_SESSION = [];
    session_destroy();
}

respond([
    'loggedIn' => $patient !== null,
    'patient'  => $patient,
]);
