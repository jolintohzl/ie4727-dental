<?php
/* POST api/login.php   { email, password } */
require __DIR__ . '/bootstrap.php';
require_method('POST');

$in = read_json();
$email = strtolower(str_field($in, 'email'));
$password = isset($in['password']) && is_string($in['password']) ? $in['password'] : '';

$errors = [];
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Please enter a valid email address.';
}
if ($password === '') {
    $errors['password'] = 'Please enter your password.';
}
if ($errors) {
    fail('Please fix the highlighted fields.', 422, $errors);
}

$stmt = db()->prepare('SELECT id, password_hash FROM patients WHERE email = ?');
$stmt->execute([$email]);
$row = $stmt->fetch();

// Same message whether the email or the password was wrong, so the form
// does not reveal which emails have accounts.
if (!$row || !password_verify($password, $row['password_hash'])) {
    fail('Incorrect email or password.', 401);
}

log_in((int) $row['id']);
respond(['patient' => find_patient((int) $row['id'])]);
