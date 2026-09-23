<?php
/* ==========================================================
   Shared setup for every file in /api.
   Each endpoint starts with:  require __DIR__ . '/bootstrap.php';

   Every endpoint talks JSON: the browser sends JSON with fetch() and
   gets JSON back, e.g. { "ok": true, ... } or { "ok": false, "error": "..." }.
   ========================================================== */

require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

// Anything unexpected still answers in JSON instead of a PHP error page.
// The details go to Apache's error log, not to the browser.
set_exception_handler(function (Throwable $e) {
    error_log($e);
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Something went wrong on our side. Please try again.']);
});

// The login lives in a PHP session cookie. HttpOnly keeps JavaScript away
// from it; SameSite=Lax stops other websites from sending it with their forms.
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();


/* ---------- Responses ---------- */

function respond(array $data, int $status = 200)
{
    http_response_code($status);
    echo json_encode(['ok' => $status < 400] + $data);
    exit;
}

// $fields maps a form field name to its message, so the page can show
// each error under the right input.
function fail(string $message, int $status = 400, array $fields = [])
{
    respond(['error' => $message, 'fields' => (object) $fields], $status);
}


/* ---------- Requests ---------- */

function require_method(string $method)
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        fail('Method not allowed.', 405);
    }
}

// Reads the JSON body of a POST.
// Insisting on the JSON content type also blocks cross-site form posts:
// a plain HTML form on another site cannot send application/json.
function read_json(): array
{
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($type, 'application/json') !== 0) {
        fail('Expected a JSON request.', 415);
    }
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        fail('The request could not be read.', 400);
    }
    return $data;
}

function str_field(array $in, string $key): string
{
    return isset($in[$key]) && is_scalar($in[$key]) ? trim((string) $in[$key]) : '';
}

function int_field(array $in, string $key): int
{
    return isset($in[$key]) && is_numeric($in[$key]) ? (int) $in[$key] : 0;
}


/* ---------- Database ---------- */

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]
            );
        } catch (PDOException $e) {
            fail('Could not connect to the database. Is MySQL running, and has database/schema.sql been imported?', 500);
        }
    }
    return $pdo;
}

// MySQL error 1062 = a UNIQUE index rejected the row.
function is_duplicate(PDOException $e): bool
{
    return isset($e->errorInfo[1]) && (int) $e->errorInfo[1] === 1062;
}


/* ---------- Login ---------- */

function current_patient_id(): ?int
{
    return isset($_SESSION['patient_id']) ? (int) $_SESSION['patient_id'] : null;
}

function require_login(): int
{
    $id = current_patient_id();
    if ($id === null) {
        fail('Please log in first.', 401);
    }
    return $id;
}

function log_in(int $patientId)
{
    // a fresh session id on login stops session-fixation attacks
    session_regenerate_id(true);
    $_SESSION['patient_id'] = $patientId;
}

function find_patient(int $id): ?array
{
    $stmt = db()->prepare('SELECT id, name, nric, phone, email FROM patients WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ?: null;
}


/* ---------- Validation (same rules as js/validators.js) ---------- */

// Returns [cleanValues, errors]. errors is empty when everything is fine.
function validate_patient(array $in, bool $withPassword): array
{
    $clean = [
        'name'  => preg_replace('/\s+/', ' ', str_field($in, 'name')),
        'nric'  => strtoupper(str_field($in, 'nric')),
        // allow "+65 9123 4567" or "9123-4567" — keep only the 8 digits
        'phone' => preg_replace('/^\+?65(?=\d{8}$)/', '', preg_replace('/[\s\-]/', '', str_field($in, 'phone'))),
        'email' => strtolower(str_field($in, 'email')),
    ];
    $errors = [];

    if (mb_strlen($clean['name']) < 2) {
        $errors['name'] = 'Please enter your full name.';
    } elseif (!preg_match("/^[\p{L} .,'\/@()-]{2,100}$/u", $clean['name'])) {
        $errors['name'] = 'Name can only contain letters, spaces and . , \' - / @ ( )';
    }

    if ($clean['nric'] === '') {
        $errors['nric'] = 'Please enter your NRIC/FIN number.';
    } elseif (!preg_match('/^[STFGM]\d{7}[A-Z]$/', $clean['nric'])) {
        $errors['nric'] = 'NRIC/FIN should look like S1234567A.';
    }

    if ($clean['phone'] === '') {
        $errors['phone'] = 'Please enter your contact number.';
    } elseif (!preg_match('/^[689]\d{7}$/', $clean['phone'])) {
        $errors['phone'] = 'Enter an 8-digit Singapore number starting with 6, 8 or 9.';
    }

    if ($clean['email'] === '') {
        $errors['email'] = 'Please enter your email address.';
    } elseif (strlen($clean['email']) > 255 || !filter_var($clean['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Please enter a valid email address.';
    }

    if ($withPassword) {
        $password = isset($in['password']) && is_string($in['password']) ? $in['password'] : '';
        if (strlen($password) < 8 || !preg_match('/[A-Za-z]/', $password) || !preg_match('/\d/', $password)) {
            $errors['password'] = 'Use at least 8 characters with a letter and a number.';
        } elseif (strlen($password) > 72) {
            $errors['password'] = 'Password must be 72 characters or fewer.';
        }
        $clean['password'] = $password;
    }

    return [$clean, $errors];
}

// Checks email + NRIC are not already used by another account.
function uniqueness_errors(array $clean, ?int $exceptId = null): array
{
    $errors = [];
    $checks = [
        'email' => 'An account with this email already exists.',
        'nric'  => 'An account with this NRIC/FIN already exists.',
    ];
    foreach ($checks as $column => $message) {
        $stmt = db()->prepare("SELECT id FROM patients WHERE $column = ? AND id <> ?");
        $stmt->execute([$clean[$column], $exceptId ?? 0]);
        if ($stmt->fetch()) {
            $errors[$column] = $message;
        }
    }
    return $errors;
}


/* ---------- Dates and timeslots ---------- */

// Returns an error message, or null if the date can be booked.
function date_error(string $date): ?string
{
    $d = DateTime::createFromFormat('!Y-m-d', $date);
    if (!$d || $d->format('Y-m-d') !== $date) {
        return 'Please choose a date.';
    }
    $today = new DateTime('today');
    if ($d < $today) {
        return 'That date has already passed.';
    }
    if ($d > (clone $today)->modify('+' . BOOKING_WINDOW_DAYS . ' days')) {
        return 'Appointments can be booked up to ' . BOOKING_WINDOW_DAYS . ' days ahead.';
    }
    return null;
}

// Every bookable start time ("09:00", "09:30", ...) at a branch on a date.
// Empty when the branch is closed. Times already gone today are left out.
function branch_slots(int $branchId, string $date): array
{
    $weekday = (int) date('w', strtotime($date));
    $stmt = db()->prepare('SELECT open_time, close_time FROM branch_hours WHERE branch_id = ? AND weekday = ?');
    $stmt->execute([$branchId, $weekday]);
    $hours = $stmt->fetch();
    if (!$hours) {
        return [];
    }

    $slots = [];
    $start = strtotime("$date {$hours['open_time']}");
    $close = strtotime("$date {$hours['close_time']}");
    for ($t = $start; $t + SLOT_MINUTES * 60 <= $close; $t += SLOT_MINUTES * 60) {
        if ($t > time()) {
            $slots[] = date('H:i', $t);
        }
    }
    return $slots;
}

// For each time on $date, which of $doctorIds are already booked.
// Returns e.g. [ "09:00" => [3, 5], "11:30" => [3] ]
function booked_times(array $doctorIds, string $date): array
{
    if (!$doctorIds) {
        return [];
    }
    $marks = implode(',', array_fill(0, count($doctorIds), '?'));
    $stmt = db()->prepare(
        "SELECT doctor_id, TIME_FORMAT(appt_time, '%H:%i') AS t
           FROM appointments
          WHERE status = 'booked' AND appt_date = ? AND doctor_id IN ($marks)"
    );
    $stmt->execute(array_merge([$date], $doctorIds));

    $booked = [];
    foreach ($stmt as $row) {
        $booked[$row['t']][] = (int) $row['doctor_id'];
    }
    return $booked;
}

function doctors_for_service(int $serviceId): array
{
    $stmt = db()->prepare('SELECT doctor_id FROM doctor_services WHERE service_id = ?');
    $stmt->execute([$serviceId]);
    return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
}


/* ---------- Appointments ---------- */

const APPOINTMENT_SELECT = "
    SELECT a.id, a.status,
           DATE_FORMAT(a.appt_date, '%Y-%m-%d') AS date,
           TIME_FORMAT(a.appt_time, '%H:%i')    AS time,
           a.doctor_id  AS doctorId,
           a.branch_id  AS branchId,
           a.service_id AS serviceId,
           s.name  AS service,
           d.name  AS doctor,
           d.photo AS doctorPhoto,
           b.name  AS branch,
           b.address AS address,
           b.phone AS branchPhone
      FROM appointments a
      JOIN services s ON s.id = a.service_id
      JOIN doctors  d ON d.id = a.doctor_id
      JOIN branches b ON b.id = a.branch_id
";

function find_appointment(int $id, int $patientId): ?array
{
    $stmt = db()->prepare(APPOINTMENT_SELECT . ' WHERE a.id = ? AND a.patient_id = ?');
    $stmt->execute([$id, $patientId]);
    $row = $stmt->fetch();
    return $row ? shape_appointment($row) : null;
}

function shape_appointment(array $row): array
{
    foreach (['id', 'doctorId', 'branchId', 'serviceId'] as $key) {
        $row[$key] = (int) $row[$key];
    }
    $row['upcoming'] = $row['status'] === 'booked'
        && strtotime("{$row['date']} {$row['time']}") > time();
    $row['reference'] = 'SDG-' . str_pad((string) $row['id'], 6, '0', STR_PAD_LEFT);
    return $row;
}

// Same patient cannot be in two chairs at once.
function patient_busy(int $patientId, string $date, string $time, int $exceptId = 0): bool
{
    $stmt = db()->prepare(
        "SELECT id FROM appointments
          WHERE patient_id = ? AND appt_date = ? AND appt_time = ? AND status = 'booked' AND id <> ?"
    );
    $stmt->execute([$patientId, $date, $time, $exceptId]);
    return (bool) $stmt->fetch();
}
