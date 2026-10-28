<?php
/* POST api/check-details.php  { name, nric, phone, email }
   Step 1 of booking asks this before moving on, so a guest using an
   email or NRIC that already has an account finds out straight away,
   not after picking a time. book.php checks it all again at the end. */
require __DIR__ . '/bootstrap.php';
require_method('POST');

[, $errors] = booking_details(read_json(), current_patient_id(), false);
if ($errors) {
    fail('Please fix the highlighted fields.', 422, $errors);
}

respond([]);
