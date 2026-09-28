<?php
/* POST api/apply.php   (multipart/form-data — it carries a file)
   fullName, email, contact, position, message, resume

   Takes the careers form on about-us.html: checks everything again on the
   server, saves the resume to storage/resumes/ under a random name, records
   the application, and emails the applicant a confirmation.

   The rules here deliberately mirror js/validators.js. Anything in the
   browser can be bypassed, so the browser copy is a convenience and this
   one is the real gate.

   NOTE ON CSRF: every other endpoint insists on a JSON content type, which
   a cross-site HTML form cannot send. A file upload has to be multipart, so
   that protection does not apply here. The worst a forged post can do is
   lodge a junk application — no login state changes — but if this ever holds
   anything sensitive, add a token. */
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/mail.php';
require_method('POST');

const RESUME_DIR       = __DIR__ . '/../storage/resumes';
const RESUME_MAX_BYTES = 5 * 1024 * 1024;              // 5 MB, as the form says
const RESUME_TYPES     = ['pdf', 'doc', 'docx'];
const CAREERS_INBOX    = 'careers@smiledental.local';

// The <select> on about-us.html — value => label for the emails
const POSITIONS = [
    'receptionist' => 'Front Desk Receptionist',
    'implants'     => 'Dental Implants Specialist',
    'assistant'    => 'Dental Assistant',
    'hygienist'    => 'Dental Hygienist',
    'general'      => 'General Application',
];


/* ---- 0. Did the whole POST get thrown away for being too big? ----
   When a request exceeds post_max_size, PHP discards $_POST and $_FILES and
   reports nothing at all. Without this check the user would be told their
   name is missing, which is baffling. */
if (!$_POST && !$_FILES && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
    fail('That upload was too large for the server to accept.', 413,
         ['resume' => 'Resume must be 5 MB or smaller.']);
}


/* ---- 1. The text fields ---- */
$clean = [
    'fullName' => preg_replace('/\s+/', ' ', str_field($_POST, 'fullName')),
    'email'    => strtolower(str_field($_POST, 'email')),
    // accept "+65 9123 4567" or "9123-4567" — keep only the 8 digits
    'contact'  => preg_replace('/^\+?65(?=\d{8}$)/', '',
                  preg_replace('/[\s\-]/', '', str_field($_POST, 'contact'))),
    'position' => str_field($_POST, 'position'),
    'message'  => str_field($_POST, 'message'),
];
$errors = [];

if (mb_strlen($clean['fullName']) < 2) {
    $errors['fullName'] = 'Please enter your full name.';
} elseif (!preg_match("/^[\p{L} .,'\/@()-]{2,100}$/u", $clean['fullName'])) {
    $errors['fullName'] = 'Name can only contain letters, spaces and . , \' - / @ ( )';
}

if ($clean['email'] === '') {
    $errors['email'] = 'Please enter your email address.';
} elseif (strlen($clean['email']) > 255 || !filter_var($clean['email'], FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Please enter a valid email address.';
}

if ($clean['contact'] === '') {
    $errors['contact'] = 'Please enter your contact number.';
} elseif (!preg_match('/^[689]\d{7}$/', $clean['contact'])) {
    $errors['contact'] = 'Enter an 8-digit Singapore number starting with 6, 8 or 9.';
}

if (!isset(POSITIONS[$clean['position']])) {
    $errors['position'] = 'Please choose the position you are applying for.';
}

if (mb_strlen($clean['message']) > 2000) {
    $errors['message'] = 'Please keep this under 2000 characters.';
}


/* ---- 2. The resume ---- */
$file = $_FILES['resume'] ?? null;

if (!$file || !is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
    $errors['resume'] = 'Please attach your resume.';
} elseif ($file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE) {
    $errors['resume'] = 'Resume must be 5 MB or smaller.';
} elseif ($file['error'] !== UPLOAD_ERR_OK) {
    $errors['resume'] = 'That file could not be uploaded. Please try again.';
} elseif (!is_uploaded_file($file['tmp_name'])) {
    // only true for a genuine upload — blocks a path smuggled in as a field
    $errors['resume'] = 'That file could not be uploaded. Please try again.';
} elseif ($file['size'] <= 0) {
    $errors['resume'] = 'That file is empty. Please attach your resume.';
} elseif ($file['size'] > RESUME_MAX_BYTES) {
    $errors['resume'] = 'Resume must be 5 MB or smaller.';
} else {
    // Take the extension from the submitted name, but never the name itself:
    // it can contain "../", a null byte, or a second extension.
    $extension = strtolower(pathinfo((string) $file['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, RESUME_TYPES, true)) {
        $errors['resume'] = 'Resume must be a PDF, DOC or DOCX file.';
    }
}

if ($errors) {
    fail('Please fix the highlighted fields.', 422, $errors);
}


/* ---- 3. Save the file ----
   The stored name is random, so nothing the applicant typed reaches the
   filesystem, and two people uploading "cv.pdf" cannot collide. */
if (!is_dir(RESUME_DIR) && !@mkdir(RESUME_DIR, 0775, true)) {
    error_log('[apply] cannot create ' . RESUME_DIR);
    fail('We could not store your resume. Please try again later.', 500);
}
if (!is_writable(RESUME_DIR)) {
    error_log('[apply] ' . RESUME_DIR . ' is not writable by ' . (get_current_user() ?: 'the web server'));
    fail('We could not store your resume. Please try again later.', 500);
}

$storedName = date('Ymd-His') . '-' . bin2hex(random_bytes(8)) . '.' . $extension;
$storedPath = RESUME_DIR . '/' . $storedName;

if (!move_uploaded_file($file['tmp_name'], $storedPath)) {
    error_log('[apply] move_uploaded_file failed for ' . $storedName);
    fail('We could not store your resume. Please try again later.', 500);
}
@chmod($storedPath, 0640);


/* ---- 4. Record it ---- */
try {
    $stmt = db()->prepare(
        'INSERT INTO job_applications
            (full_name, email, phone, position, message, resume_name, resume_file, resume_size, submitted_ip)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $clean['fullName'],
        $clean['email'],
        $clean['contact'],
        $clean['position'],
        $clean['message'] !== '' ? $clean['message'] : null,
        mb_substr((string) $file['name'], 0, 255),
        $storedName,
        (int) $file['size'],
        $_SERVER['REMOTE_ADDR'] ?? null,
    ]);
    $applicationId = (int) db()->lastInsertId();
} catch (PDOException $e) {
    // do not leave an orphan file behind if the row could not be written
    @unlink($storedPath);
    throw $e;
}


/* ---- 5. Tell the applicant, and the clinic ----
   After the row is saved, and never fatal — the application is already
   safely recorded by this point. */
$reference = 'SDG-APP-' . str_pad((string) $applicationId, 5, '0', STR_PAD_LEFT);
send_application_emails($clean, POSITIONS[$clean['position']], $reference, $file['name'], CAREERS_INBOX);

respond([
    'reference' => $reference,
    'position'  => POSITIONS[$clean['position']],
], 201);
