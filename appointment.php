<?php
/* ==========================================================
   appointment.php — the booking form.

   A 4-step wizard, one step ("page") at a time:
     1. patient details  (or log in to fill them in)
     2. service + branch
     3. date on the calendar → timeslot
     4. doctor who is free at that time + summary
     → confirm → confirmation page
   Each step is ?step=N. Every button submits the form back to
   this page: PHP checks the step, saves it, and redirects to the
   next one (Post/Redirect/Get), so a refresh never submits twice.
   

   Progress is saved to the booking_drafts table after every step,
   so leaving and coming back puts the form back the way it was.
   A guest's password is never saved there: only its hash is kept,
   in the PHP session, until the account is created.

   js/appointment.js checks each step in the browser first, so
   mistakes show straight away. Everything is checked again here.
   ========================================================== */
require __DIR__ . '/includes/app.php';
require __DIR__ . '/api/mail.php';

const TOTAL_STEPS = 4;
const STEP_NAMES  = [1 => 'Your details', 2 => 'Service & branch', 3 => 'Date & time', 4 => 'Doctor'];
// Tooltip on a locked step, named after the unfinished step that blocks it.
const LOCKED_TIPS = [
    1 => 'Please complete patient details first',
    2 => 'Please select a service & branch first',
    3 => 'Please select a date & time first',
];
const DETAIL_FIELDS = ['name', 'nric', 'phone', 'email'];

$pdo = db();
$patient = current_patient();
$patientId = $patient ? (int) $patient['id'] : null;


/* ==========================================================
   WHAT THE STEPS CHOOSE FROM
   ========================================================== */

$services = [];
foreach ($pdo->query('SELECT id, slug, name, summary, price_from AS priceFrom FROM services ORDER BY id') as $row) {
    $services[(int) $row['id']] = $row;
}

$branches = [];
foreach ($pdo->query('SELECT id, slug, name, address, phone, map_img AS mapImg FROM branches ORDER BY id') as $row) {
    $row['hours'] = [];   // hours[weekday] = [open, close]; a missing weekday means closed
    $branches[(int) $row['id']] = $row;
}
foreach ($pdo->query("SELECT branch_id, weekday, TIME_FORMAT(open_time, '%H:%i') AS open, TIME_FORMAT(close_time, '%H:%i') AS close FROM branch_hours") as $h) {
    $branches[(int) $h['branch_id']]['hours'][(int) $h['weekday']] = [$h['open'], $h['close']];
}

$doctors = [];
foreach ($pdo->query('SELECT id, name, specialty, role, bio, photo FROM doctors ORDER BY id') as $row) {
    $doctors[(int) $row['id']] = $row;
}

function branch_open_on(array $branch, string $date): bool
{
    return isset($branch['hours'][(int) date('w', strtotime($date))]);
}

// Every timeslot that day → the doctors for this service still free in it.
// [ "09:00" => [5, 7], "09:30" => [], ... ]  (an empty list = fully booked)
function slot_table(int $serviceId, int $branchId, string $date): array
{
    $doctorIds = doctors_for_service($serviceId);
    $booked = booked_times($doctorIds, $date);
    $slots = [];
    foreach (branch_slots($branchId, $date) as $time) {
        $slots[$time] = array_values(array_diff($doctorIds, $booked[$time] ?? []));
    }
    return $slots;
}


/* ==========================================================
   SAVED PROGRESS  (booking_drafts table)

   Logged in → the draft belongs to the account (patient_id).
   Guest     → it belongs to this browser's session. The key is
               kept in $_SESSION, so it survives logging in
               (which changes the session id) and the draft can
               be handed over to the account.
   ========================================================== */

function guest_draft_key(): string
{
    if (empty($_SESSION['draft_key'])) {
        $_SESSION['draft_key'] = session_id();
    }
    return $_SESSION['draft_key'];
}

function draft_owner(?int $patientId): array
{
    return $patientId !== null ? ['patient_id', $patientId] : ['session_id', guest_draft_key()];
}

function empty_draft(): array
{
    return [
        'exists' => false, 'step' => 1,
        'name' => null, 'nric' => null, 'phone' => null, 'email' => null,
        'serviceId' => null, 'branchId' => null, 'date' => null, 'time' => null, 'doctorId' => null,
    ];
}

function load_draft(?int $patientId): array
{
    [$column, $value] = draft_owner($patientId);
    $stmt = db()->prepare(
        "SELECT step, name, nric, phone, email,
                service_id AS serviceId, branch_id AS branchId, doctor_id AS doctorId,
                DATE_FORMAT(appt_date, '%Y-%m-%d') AS date,
                TIME_FORMAT(appt_time, '%H:%i')    AS time
           FROM booking_drafts
          WHERE $column = ?"
    );
    $stmt->execute([$value]);
    $row = $stmt->fetch();
    if (!$row) {
        return empty_draft();
    }
    foreach (['step', 'serviceId', 'branchId', 'doctorId'] as $key) {
        $row[$key] = $row[$key] === null ? null : (int) $row[$key];
    }
    return ['exists' => true] + $row;
}

// One draft per owner: insert the first time, update after that.
function save_draft(?int $patientId, array $d)
{
    [$column, $value] = draft_owner($patientId);
    $stmt = db()->prepare(
        "INSERT INTO booking_drafts
                ($column, step, name, nric, phone, email, service_id, branch_id, appt_date, appt_time, doctor_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
                step = VALUES(step), name = VALUES(name), nric = VALUES(nric),
                phone = VALUES(phone), email = VALUES(email),
                service_id = VALUES(service_id), branch_id = VALUES(branch_id),
                appt_date = VALUES(appt_date), appt_time = VALUES(appt_time),
                doctor_id = VALUES(doctor_id)"
    );
    $stmt->execute([
        $value, min(max((int) $d['step'], 1), TOTAL_STEPS),
        $d['name'], $d['nric'], $d['phone'], $d['email'],
        $d['serviceId'], $d['branchId'], $d['date'], $d['time'], $d['doctorId'],
    ]);

    // housekeeping: forget drafts nobody has touched for a week
    db()->exec('DELETE FROM booking_drafts WHERE updated_at < NOW() - INTERVAL 7 DAY');
}

function clear_draft(?int $patientId)
{
    $stmt = db()->prepare('DELETE FROM booking_drafts WHERE patient_id = ? OR session_id = ?');
    $stmt->execute([$patientId ?? 0, $_SESSION['draft_key'] ?? '']);
    unset($_SESSION['draft_key'], $_SESSION['booking_password_hash']);
}

// Just logged in with a booking already started as a guest?
// That booking is what they were doing, so it replaces any older one on
// the account. The guest's typed details are dropped: the profile wins.
if ($patientId !== null && !empty($_SESSION['draft_key'])) {
    $stmt = $pdo->prepare('SELECT id FROM booking_drafts WHERE session_id = ?');
    $stmt->execute([$_SESSION['draft_key']]);
    if ($guestDraft = $stmt->fetch()) {
        $pdo->prepare('DELETE FROM booking_drafts WHERE patient_id = ?')->execute([$patientId]);
        $pdo->prepare('UPDATE booking_drafts SET patient_id = ?, session_id = NULL, name = NULL, nric = NULL, phone = NULL, email = NULL WHERE id = ?')
            ->execute([$patientId, $guestDraft['id']]);
    }
    unset($_SESSION['draft_key'], $_SESSION['booking_password_hash']);
}

$draft = load_draft($patientId);

// Drops anything in the draft that can no longer be booked: a date that has
// passed, a time someone else took, a doctor who is now busy.
// Returns [draft, somethingWasDropped].
function settle_draft(array $d, array $services, array $branches): array
{
    $dropped = false;
    if ($d['serviceId'] !== null && !isset($services[$d['serviceId']])) {
        $d['serviceId'] = null;
    }
    if ($d['branchId'] !== null && !isset($branches[$d['branchId']])) {
        $d['branchId'] = null;
    }
    if ($d['date'] !== null && (!$d['serviceId'] || !$d['branchId'] || date_error($d['date'])
            || !branch_open_on($branches[$d['branchId']], $d['date']))) {
        $d['date'] = null;
        $dropped = true;
    }
    if ($d['time'] !== null) {
        $slots = $d['date'] ? slot_table($d['serviceId'], $d['branchId'], $d['date']) : [];
        if (empty($slots[$d['time']])) {
            $d['time'] = null;
            $dropped = true;
        } elseif ($d['doctorId'] !== null && !in_array($d['doctorId'], $slots[$d['time']], true)) {
            $d['doctorId'] = null;
            $dropped = true;
        }
    } else {
        $d['doctorId'] = null;
    }
    return [$d, $dropped];
}

[$draft, $draftDropped] = settle_draft($draft, $services, $branches);

// The details step 1 shows: what was saved in the draft, or the profile.
function draft_details(array $d, ?array $patient): array
{
    $values = [];
    foreach (DETAIL_FIELDS as $field) {
        $values[$field] = $d[$field] ?? ($patient[$field] ?? '');
    }
    return $values;
}

// Returns { field: message } for everything missing or wrong on one step.
function step_errors(int $step, array $d, ?array $patient): array
{
    if ($step === 1) {
        $patientId = $patient ? (int) $patient['id'] : null;
        [, $errors] = booking_details(draft_details($d, $patient), $patientId, false);
        if ($patientId === null && empty($_SESSION['booking_password_hash'])) {
            $errors['password'] = 'Please create a password.';
        }
        return $errors;
    }
    if ($step === 2) {
        $errors = [];
        if (!$d['serviceId']) {
            $errors['serviceId'] = 'Please choose a service.';
        }
        if (!$d['branchId']) {
            $errors['branchId'] = 'Please choose a branch.';
        }
        return $errors;
    }
    if ($step === 3) {
        if (!$d['date']) {
            return ['date' => 'Please choose a date.'];
        }
        return $d['time'] ? [] : ['time' => 'Please choose a time.'];
    }
    return $d['doctorId'] ? [] : ['doctorId' => 'Please choose a doctor.'];
}

// The first unfinished step before $step, or null if they're all done.
function blocking_step(int $step, array $d, ?array $patient): ?int
{
    for ($s = 1; $s < $step; $s++) {
        if (step_errors($s, $d, $patient)) {
            return $s;
        }
    }
    return null;
}

// Back to a step with the messages (and what was typed) to show on it.
function back_to_step(int $step, array $errors, array $values = [])
{
    flash('stepErrors', $errors);
    flash('stepValues', $values);
    go_to('appointment.php?step=' . $step);
}


/* ==========================================================
   FORM POSTS
   Each step's form says which step it is (action=...) and which
   button was pressed: Back / Next, a calendar day, a time, ...
   ========================================================== */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = str_field($_POST, 'action');
    $nav    = str_field($_POST, 'nav');      // "next" or "back"

    if ($action === 'logout') {
        log_out();
        go_to('appointment.php');
    }

    if ($action === 'startover') {
        clear_draft($patientId);
        go_to('appointment.php?step=1');
    }

    /* ---------- Step 1: patient details ---------- */
    if ($action === 'details') {
        // A guest who already set a password this visit can leave the boxes blank.
        $keepPassword = !empty($_SESSION['booking_password_hash'])
            && str_field($_POST, 'password') === '' && str_field($_POST, 'confirmPassword') === '';
        $withPassword = $patientId === null && !$keepPassword;

        [$clean, $errors] = booking_details($_POST, $patientId, $withPassword);
        if ($errors) {
            unset($clean['password']);
            back_to_step(1, $errors, $clean);
        }
        if ($withPassword) {
            $_SESSION['booking_password_hash'] = password_hash($clean['password'], PASSWORD_DEFAULT);
        }
        foreach (DETAIL_FIELDS as $field) {
            $draft[$field] = $clean[$field];
        }
        $draft['step'] = 2;
        save_draft($patientId, $draft);
        go_to('appointment.php?step=2');
    }

    /* ---------- Step 2: service + branch ---------- */
    if ($action === 'service') {
        $serviceId = int_field($_POST, 'serviceId');
        $branchId  = int_field($_POST, 'branchId');
        $errors = [];
        if (!isset($services[$serviceId])) {
            $errors['serviceId'] = 'Please choose a service.';
            $serviceId = null;
        }
        if (!isset($branches[$branchId])) {
            $errors['branchId'] = 'Please choose a branch.';
            $branchId = null;
        }

        // a new service or branch means new timeslots and doctors
        if ($serviceId !== $draft['serviceId'] || $branchId !== $draft['branchId']) {
            $draft['time'] = null;
            $draft['doctorId'] = null;
        }
        $draft['serviceId'] = $serviceId;
        $draft['branchId']  = $branchId;

        if ($nav === 'back') {
            $draft['step'] = 1;
            save_draft($patientId, $draft);
            go_to('appointment.php?step=1');
        }
        if ($errors) {
            save_draft($patientId, $draft);
            back_to_step(2, $errors);
        }
        // a date the new branch is closed on can't stay selected
        [$draft] = settle_draft($draft, $services, $branches);
        $draft['step'] = 3;
        save_draft($patientId, $draft);
        go_to('appointment.php?step=3');
    }

    /* ---------- Step 3: calendar + timeslots ---------- */
    if ($action === 'time') {
        if (blocking_step(3, $draft, $patient)) {
            go_to('appointment.php');
        }

        // ‹ › on the calendar
        if (isset($_POST['month'])) {
            go_to('appointment.php?step=3&month=' . urlencode(str_field($_POST, 'month')));
        }

        // a day on the calendar
        if (isset($_POST['pickDate'])) {
            $date = str_field($_POST, 'pickDate');
            $error = date_error($date);
            if (!$error && !branch_open_on($branches[$draft['branchId']], $date)) {
                $error = 'The clinic is closed on that day. Please choose another date.';
            }
            if ($error) {
                back_to_step(3, ['date' => $error]);
            }
            $draft['date'] = $date;
            $draft['time'] = null;
            $draft['step'] = 3;
            save_draft($patientId, $draft);
            go_to('appointment.php?step=3#slots');
        }

        // a time on the right
        if (isset($_POST['pickTime'])) {
            $time  = str_field($_POST, 'pickTime');
            $slots = $draft['date'] ? slot_table($draft['serviceId'], $draft['branchId'], $draft['date']) : [];
            if (empty($slots[$time])) {
                back_to_step(3, ['time' => 'That time is no longer available. Please choose another.']);
            }
            $draft['time'] = $time;
            // keep the chosen doctor only if they are free at the new time
            if ($draft['doctorId'] !== null && !in_array($draft['doctorId'], $slots[$time], true)) {
                $draft['doctorId'] = null;
            }
            $draft['step'] = 3;
            save_draft($patientId, $draft);
            go_to('appointment.php?step=3#slots');
        }

        if ($nav === 'back') {
            $draft['step'] = 2;
            save_draft($patientId, $draft);
            go_to('appointment.php?step=2');
        }
        if ($errors = step_errors(3, $draft, $patient)) {
            back_to_step(3, $errors);
        }
        $draft['step'] = 4;
        save_draft($patientId, $draft);
        go_to('appointment.php?step=4');
    }

    /* ---------- Step 4: doctor → book ---------- */
    if ($action === 'book') {
        $doctorId = int_field($_POST, 'doctorId');
        $slots = $draft['time'] ? slot_table($draft['serviceId'], $draft['branchId'], $draft['date']) : [];
        $draft['doctorId'] = in_array($doctorId, $slots[$draft['time']] ?? [], true) ? $doctorId : null;

        if ($nav === 'back') {
            $draft['step'] = 3;
            save_draft($patientId, $draft);
            go_to('appointment.php?step=3');
        }
        save_draft($patientId, $draft);

        // every step again, in order — the first one with a problem is reopened
        for ($s = 1; $s <= TOTAL_STEPS; $s++) {
            if ($errors = step_errors($s, $draft, $patient)) {
                if ($s === 4 && $doctorId) {
                    $errors['doctorId'] = 'That dentist is no longer free at this time. Please choose another.';
                }
                back_to_step($s, $errors);
            }
        }

        $details = draft_details($draft, $patient);
        if ($patientId !== null && patient_busy($patientId, $draft['date'], $draft['time'])) {
            back_to_step(3, ['time' => 'You already have an appointment at this time.']);
        }

        // Save the account + appointment together, or neither.
        try {
            $pdo->beginTransaction();

            $isNewAccount = $patientId === null;
            if ($isNewAccount) {
                $stmt = $pdo->prepare('INSERT INTO patients (name, nric, phone, email, password_hash) VALUES (?, ?, ?, ?, ?)');
                $stmt->execute([
                    $details['name'], $details['nric'], $details['phone'], $details['email'],
                    $_SESSION['booking_password_hash'],
                ]);
                $patientId = (int) $pdo->lastInsertId();
            } else {
                // logged in: any edits on step 1 update their profile
                $stmt = $pdo->prepare('UPDATE patients SET name = ?, nric = ?, phone = ?, email = ? WHERE id = ?');
                $stmt->execute([$details['name'], $details['nric'], $details['phone'], $details['email'], $patientId]);
            }

            $stmt = $pdo->prepare(
                'INSERT INTO appointments (patient_id, doctor_id, service_id, branch_id, appt_date, appt_time)
                 VALUES (?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([$patientId, $draft['doctorId'], $draft['serviceId'], $draft['branchId'], $draft['date'], $draft['time']]);
            $appointmentId = (int) $pdo->lastInsertId();

            $pdo->commit();
        } catch (PDOException $e) {
            $pdo->rollBack();
            if (!is_duplicate($e)) {
                throw $e;
            }
            // someone else took the slot (or the email/NRIC) a moment ago
            $draft['time'] = null;
            $draft['doctorId'] = null;
            $draft['step'] = 3;
            save_draft($isNewAccount ? null : $patientId, $draft);
            back_to_step(3, ['time' => 'Sorry, that timeslot was just taken. Please choose another time.']);
        }

        // The booking is saved, so the half-filled form is no longer needed.
        // (Before log_in(), which changes the session id.)
        clear_draft($patientId);
        if ($isNewAccount) {
            log_in($patientId);
        }

        // After the commit, so a mail problem can never cost someone their slot.
        // send_booking_email() swallows its own errors and logs them.
        send_booking_email($patientId, find_appointment($appointmentId, $patientId));

        flash('newAccount', $isNewAccount);
        go_to('appointment.php?booked=' . $appointmentId);
    }

    go_to('appointment.php');
}


/* ==========================================================
   WHAT THE PAGE SHOWS
   ========================================================== */

// After booking: the confirmation instead of the form.
$booked = null;
if (isset($_GET['booked'])) {
    $booked = $patientId !== null ? find_appointment(int_field($_GET, 'booked'), $patientId) : null;
    if (!$booked) {
        go_to('appointment.php');
    }
    $newAccount = (bool) flash('newAccount');
}

// Links like appointment.php?service=root-canal&branch=orchard pre-select step 2.
if (!$booked && (isset($_GET['service']) || isset($_GET['branch']))) {
    foreach ($services as $s) {
        if ($s['slug'] === str_field($_GET, 'service') && (int) $s['id'] !== $draft['serviceId']) {
            $draft['serviceId'] = (int) $s['id'];
            $draft['time'] = $draft['doctorId'] = null;
        }
    }
    foreach ($branches as $b) {
        if ($b['slug'] === str_field($_GET, 'branch') && (int) $b['id'] !== $draft['branchId']) {
            $draft['branchId'] = (int) $b['id'];
            $draft['time'] = $draft['doctorId'] = null;
        }
    }
    [$draft] = settle_draft($draft, $services, $branches);
    save_draft($patientId, $draft);
    go_to('appointment.php');
}

// Which step to show: the one asked for, or the one they were on —
// but never past a step that still needs finishing.
$asked = int_field($_GET, 'step');
$step  = min(max($asked ?: (int) $draft['step'], 1), TOTAL_STEPS);
$step  = blocking_step($step, $draft, $patient) ?? $step;
if ($asked && $asked !== $step) {
    go_to('appointment.php?step=' . $step);   // asked for a locked step
}
if ($draft['exists'] && $draft['step'] !== $step) {
    $draft['step'] = $step;
    save_draft($patientId, $draft);
}

// "Welcome back" when they arrive (not just move between steps) with a booking already started
$hasContent = false;
foreach (['name', 'nric', 'phone', 'email', 'serviceId', 'branchId', 'date'] as $key) {
    $hasContent = $hasContent || !empty($draft[$key]);
}
$welcomeBack = !$booked && !$asked && $hasContent;

$errors = flash('stepErrors') ?? [];
$typed  = flash('stepValues') ?? [];

$today   = date('Y-m-d');
$lastDay = date('Y-m-d', strtotime('+' . BOOKING_WINDOW_DAYS . ' days'));

// Step 1
$details = $typed + draft_details($draft, $patient);
$passwordSaved = $patientId === null && !empty($_SESSION['booking_password_hash']);

// Step 3: the month the calendar shows, and the times on the chosen day
$month = str_field($_GET, 'month');
if (!preg_match('/^\d{4}-\d{2}$/', $month) || $month < substr($today, 0, 7) || $month > substr($lastDay, 0, 7)) {
    $month = substr($draft['date'] ?? $today, 0, 7);
}
$slots = $step >= 3 && $draft['date'] ? slot_table($draft['serviceId'], $draft['branchId'], $draft['date']) : [];

// Step 4: this service's doctors, the ones free at the chosen time first
$freeDoctors = $draft['time'] ? ($slots[$draft['time']] ?? []) : [];
$serviceDoctors = [];
if ($draft['serviceId']) {
    foreach (doctors_for_service($draft['serviceId']) as $id) {
        $serviceDoctors[] = $doctors[$id] + ['free' => in_array($id, $freeDoctors, true)];
    }
    usort($serviceDoctors, fn($a, $b) => $b['free'] <=> $a['free']);
}

function field_error(array $errors, string $name)
{
    $error = $errors[$name] ?? '';
    echo '<span class="field-error" id="' . $name . '-error"' . ($error ? '' : ' hidden') . '>' . e($error) . '</span>';
}

function booking_field(string $name, string $label, string $type, string $autocomplete, string $placeholder, int $maxlength, array $values, array $errors)
{
    $error = $errors[$name] ?? '';
    ?>
    <div class="form-field<?= $error ? ' has-error' : '' ?>">
        <label for="<?= $name ?>"><?= $label ?> <span class="req">*</span></label>
        <input type="<?= $type ?>" id="<?= $name ?>" name="<?= $name ?>" autocomplete="<?= $autocomplete ?>"
               placeholder="<?= e($placeholder) ?>" maxlength="<?= $maxlength ?>" value="<?= e($values[$name] ?? '') ?>"
               <?= $error ? 'aria-invalid="true" aria-describedby="' . $name . '-error"' : '' ?>>
        <?php field_error($errors, $name); ?>
    </div>
    <?php
}

function summary_list(array $rows)
{
    echo '<dl class="summary-list">';
    foreach ($rows as [$icon, $label, $html]) {
        echo '<div><dt><i class="' . $icon . '" aria-hidden="true"></i>' . $label . '</dt>'
            . '<dd' . ($html ? '' : ' class="is-missing"') . '>' . ($html ?: 'Not chosen yet') . '</dd></div>';
    }
    echo '</dl>';
}

function service_hint(array $s): string
{
    return $s['summary'] . ' From $' . number_format((int) $s['priceFrom']) . '.';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Book Appointment | Smile Dental Group</title>

    <!-- Font Awesome (icons) -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

    <!-- stylesheet shared with index.html -->
    <link rel="stylesheet" href="style.css">
</head>

<body>

<!-- ==========================================================
     NAVIGATION BAR  
     ========================================================== -->
<header class="site-header">

    <!-- ---------- TOP ROW: logo + icons + book button ---------- -->
    <div class="nav-top">
        <div class="container nav-top-inner">

            <a href="index.html" class="logo">
                <img src="images/dental group.png" alt="Smile Dental Group logo" class="logo-img">
                <span class="logo-text">
                    <span class="logo-name">Smile Dental Group</span>
                    <span class="logo-tagline">Gentle care, lasting smiles</span>
                </span>
            </a>

            <div class="nav-actions">
                <!-- Search box (sends ?q= to search.php) -->
                <form class="nav-search" action="search.php" method="get" role="search">
                    <input type="search" name="q" placeholder="Search the site…"
                           aria-label="Search the website" autocomplete="off" maxlength="80">
                    <button type="submit" aria-label="Search">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                </form>

                <a href="dashboard.php" class="icon-btn" id="accountBtn" aria-label="My account">
                    <i class="fa-regular fa-user"></i>
                </a>

                <a href="appointment.php" class="btn btn-primary btn-book">
                    <i class="fa-regular fa-calendar-check"></i>
                    <span>Book Appointment</span>
                </a>

                <!-- Hamburger — only visible on mobile -->
                <button class="icon-btn menu-toggle" id="menuToggle" aria-label="Open menu" aria-expanded="false">
                    <i class="fa-solid fa-bars"></i>
                </button>
            </div>

        </div>
    </div>

    <!-- ---------- BOTTOM ROW: centered menu ---------- -->
    <nav class="nav-bottom" id="mainNav">
        <div class="container">
            <!-- phones only: the top row has no room for the search box -->
            <form class="nav-search nav-search-mobile" action="search.php" method="get" role="search">
                <input type="search" name="q" placeholder="Search the site…"
                       aria-label="Search the website" autocomplete="off" maxlength="80">
                <button type="submit" aria-label="Search">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </button>
            </form>

            <ul class="nav-menu">
                <li><a href="about-us.html">About</a></li>

                <li><a href="doctors.html">Our Doctors</a></li>

                <!-- "Services" is the only menu item with a dropdown.
                     The panel stays hidden until the text or the arrow is clicked. -->
                <li class="has-dropdown">
                    <a href="#" class="dropdown-toggle">
                        Services <i class="fa-solid fa-chevron-down"></i>
                    </a>
                    <ul class="dropdown">
                        <li><a href="services.html">Dental Services</a></li>
                        <li><a href="fees-calculator.html">Fees Calculator</a></li>
                    </ul>
                </li>

                <li><a href="locate-us.html">Locate Us</a></li>
            </ul>
        </div>
    </nav>

</header>

<!-- ==========================================================
     1. PAGE BANNER
     ========================================================== -->
<section class="page-hero">
    <div class="container">
        <p class="breadcrumb">
            <a href="index.html">Home</a>
            <i class="fa-solid fa-chevron-right"></i>
            <span>Book Appointment</span>
        </p>
    </div>
</section>


<!-- ==========================================================
     2. BOOKING FORM  (steps 1 – 4, one "page" at a time)
     Drawn by the PHP at the top of this file.
     ========================================================== -->
<section class="section">
    <div class="container">

    <!-- page heading — same style as "About Smile Dental Group" -->
    <div class="section-head">
        <h1>Book an appointment</h1>
        <p class="section-sub">
            Four short steps: your details, the treatment and clinic, a time that
            suits you, and the dentist you'd like to see.
        </p>
    </div>

    <!-- one centred column for the steps -->
    <div class="page-column booking-body">

<?php if ($booked):
    $firstName = explode(' ', trim(find_patient($patientId)['name']))[0];
?>
        <!-- ---------- Booking confirmed ---------- -->
        <div class="panel confirmation">
            <div class="confirmation-icon"><i class="fa-solid fa-check"></i></div>
            <h2>Booking confirmed</h2>
            <p>Thank you, <?= e($firstName) ?>. Please arrive 10 minutes early and bring your NRIC/FIN.</p>
            <span class="reference">Ref: <?= e($booked['reference']) ?></span>
            <?php if ($newAccount): ?>
                <div class="alert alert-success"><i class="fa-solid fa-user-check"></i><span>Your account has been created.
                    Log in any time with <strong><?= e(find_patient($patientId)['email']) ?></strong> to see or change this booking.</span></div>
            <?php endif; ?>
            <?php summary_list([
                ['fa-solid fa-tooth', 'Service', e($booked['service'])],
                ['fa-solid fa-user-doctor', 'Doctor', e($booked['doctor'])],
                ['fa-regular fa-calendar', 'Date &amp; time', e(format_date($booked['date']) . ', ' . format_time($booked['time']))],
                ['fa-solid fa-location-dot', 'Branch', e($booked['branch']) . '<br><small>' . e($booked['address']) . '</small>'],
            ]); ?>
            <div class="confirmation-actions">
                <a href="dashboard.php" class="btn btn-primary btn-lg"><i class="fa-regular fa-calendar-check"></i> View my appointments</a>
                <a href="index.html" class="btn btn-outline btn-lg">Back to home</a>
            </div>
        </div>

<?php else: ?>

        <!-- forms that sit outside the booking form (forms can't be nested);
             the buttons that use them point here with form="..." -->
        <form method="post" action="appointment.php" id="startOverForm">
            <input type="hidden" name="action" value="startover">
        </form>
        <form method="post" action="appointment.php" id="bookingLogoutForm"
              data-confirm="Are you sure you want to log out?"
              onsubmit="return confirm(this.dataset.confirm)">
            <input type="hidden" name="action" value="logout">
        </form>

        <?php if ($welcomeBack): ?>
            <!-- a booking started earlier, put back from booking_drafts -->
            <div class="alert alert-info" id="draftNotice" role="status">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <span>
                    Welcome back — we've restored the booking you started.
                    <button type="submit" class="link-button" form="startOverForm">Start over</button>
                </span>
            </div>
        <?php endif; ?>
        <?php if ($draftDropped): ?>
            <div class="alert alert-info" role="status">
                <i class="fa-solid fa-circle-info"></i>
                <span>The date, time or doctor you picked is no longer available, so please choose again.</span>
            </div>
        <?php endif; ?>

        <!-- Progress timeline: 1 ── 2 ── 3 ── 4
             Finished steps get a tick (is-done), the current one a ring (is-active),
             and steps that can't be opened yet are greyed out (is-locked). -->
        <nav class="booking-steps" id="bookingSteps" aria-label="Booking progress">
            <ol>
                <?php foreach (STEP_NAMES as $n => $label):
                    $done    = !step_errors($n, $draft, $patient);
                    $blocker = blocking_step($n, $draft, $patient);
                    $classes = trim(($done ? 'is-done ' : '') . ($n === $step ? 'is-active ' : '') . ($blocker ? 'is-locked' : ''));
                ?>
                    <li<?= $classes ? ' class="' . $classes . '"' : '' ?>>
                        <a href="appointment.php?step=<?= $n ?>"
                           aria-label="Step <?= $n ?>: <?= e($label) ?><?= $done ? ', done' : '' ?><?= $blocker ? '. ' . LOCKED_TIPS[$blocker] : '' ?>"
                           <?= $blocker ? 'data-tip="' . LOCKED_TIPS[$blocker] . '" aria-disabled="true"' : '' ?>
                           <?= $n === $step ? 'aria-current="step"' : '' ?>>
                            <span class="step-dot"><?= $done ? '<i class="fa-solid fa-check"></i>' : $n ?></span>
                            <span class="step-label"><?= e($label) ?></span>
                        </a>
                    </li>
                <?php endforeach; ?>
            </ol>
        </nav>

        <form id="bookingForm" method="post" action="appointment.php" novalidate data-step="<?= $step ?>">

<?php if ($step === 1): ?>
            <input type="hidden" name="action" value="details">

            <!-- ---------- STEP 1: patient details ---------- -->
            <div class="panel" id="stepDetails">
                <div class="panel-head">
                    <span class="step-number">1</span>
                    <div>
                        <h2>Fill in patient details</h2>
                        <?php if ($patient): ?>
                            <div class="account-switch">
                                <span>Booking as <strong><?= e($patient['name']) ?></strong>.</span>
                                <button type="submit" class="link-button" form="bookingLogoutForm">Not you? Log out</button>
                            </div>
                            <p>Changes to personal details here will also update your profile.</p>
                        <?php else: ?>
                            <div class="account-switch">
                                <span>New patient? Register below, or
                                    <a href="login.php?next=appointment.php" class="link-button">Log in</a></span>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="form-grid">
                    <?php
                    booking_field('name', 'Name', 'text', 'name', 'e.g. Jaslyn Tan', 100, $details, $errors);
                    booking_field('nric', 'NRIC/FIN No.', 'text', 'off', 'e.g. S1234567A', 9, $details, $errors);
                    booking_field('phone', 'Contact No.', 'tel', 'tel', 'e.g. 9123 4567', 15, $details, $errors);
                    booking_field('email', 'Email', 'email', 'email', 'you@example.com', 255, $details, $errors);
                    ?>

                    <?php if (!$patient): ?>
                        <!-- password is only needed when creating a new account -->
                        <hr class="form-divider">

                        <div class="form-field<?= isset($errors['password']) ? ' has-error' : '' ?>">
                            <label for="password">Create a password <span class="req">*</span></label>
                            <div class="password-wrap">
                                <input type="password" id="password" name="password" autocomplete="new-password"
                                       placeholder="<?= $passwordSaved ? 'Leave blank to keep it' : 'At least 8 characters' ?>" maxlength="72"
                                       <?= $passwordSaved ? 'data-saved' : '' ?>>
                                <button type="button" class="password-toggle" data-toggles="password" aria-label="Show password">
                                    <i class="fa-regular fa-eye"></i>
                                </button>
                            </div>
                            <span class="form-hint" id="password-hint">
                                <?= $passwordSaved
                                    ? 'You have already set a password for this booking. Type a new one only to change it.'
                                    : 'At least 8 characters, with a letter and a number.' ?>
                            </span>
                            <?php field_error($errors, 'password'); ?>
                        </div>

                        <div class="form-field<?= isset($errors['confirmPassword']) ? ' has-error' : '' ?>">
                            <label for="confirmPassword">Confirm password <span class="req">*</span></label>
                            <div class="password-wrap">
                                <input type="password" id="confirmPassword" name="confirmPassword" autocomplete="new-password"
                                       placeholder="Type it again" maxlength="72">
                                <button type="button" class="password-toggle" data-toggles="confirmPassword" aria-label="Show password">
                                    <i class="fa-regular fa-eye"></i>
                                </button>
                            </div>
                            <?php field_error($errors, 'confirmPassword'); ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>

<?php elseif ($step === 2): ?>
            <input type="hidden" name="action" value="service">

            <!-- ---------- STEP 2: service + branch ---------- -->
            <div class="panel" id="stepService">
                <div class="panel-head">
                    <span class="step-number">2</span>
                    <div>
                        <h2>Choose a service and branch</h2>
                        <p>Not sure what you need? Pick General Dentistry and we'll take a look.</p>
                    </div>
                </div>

                <div class="form-field<?= isset($errors['serviceId']) ? ' has-error' : '' ?>">
                    <label for="serviceId">Service <span class="req">*</span></label>
                    <select id="serviceId" name="serviceId">
                        <option value="">Select a service</option>
                        <?php foreach ($services as $s): ?>
                            <option value="<?= $s['id'] ?>" data-hint="<?= e(service_hint($s)) ?>"
                                <?= (int) $s['id'] === $draft['serviceId'] ? 'selected' : '' ?>><?= e($s['name']) ?></option>
                        <?php endforeach; ?>
                    </select>
                    <span class="form-hint" id="serviceHint"><?= $draft['serviceId'] ? e(service_hint($services[$draft['serviceId']])) : '' ?></span>
                    <?php field_error($errors, 'serviceId'); ?>
                </div>

                <fieldset class="branch-fieldset">
                    <legend class="form-legend">Branch <span class="req">*</span></legend>
                    <div class="choice-grid" id="branchOptions">
                        <?php foreach ($branches as $b): ?>
                            <label class="choice-card">
                                <input type="radio" name="branchId" value="<?= $b['id'] ?>" <?= (int) $b['id'] === $draft['branchId'] ? 'checked' : '' ?>>
                                <span class="choice-body">
                                    <img src="<?= e($b['mapImg']) ?>" alt="">
                                    <span class="choice-text">
                                        <span class="choice-title"><?= e($b['name']) ?><span class="choice-check"><i class="fa-solid fa-check"></i></span></span>
                                        <span class="choice-line"><?= e($b['address']) ?></span>
                                        <!-- "Open Sundays" / "Closed Sundays" — the detail people most often need -->
                                        <span class="choice-line"><i class="fa-regular fa-clock"></i>
                                            <?= isset($b['hours'][0]) ? 'Open 7 days' : 'Mon – Sat · closed Sundays' ?></span>
                                    </span>
                                </span>
                            </label>
                        <?php endforeach; ?>
                    </div>
                    <?php field_error($errors, 'branchId'); ?>
                </fieldset>
            </div>

<?php elseif ($step === 3):
    $branch      = $branches[$draft['branchId']];
    $first       = $month . '-01';
    $daysInMonth = (int) date('t', strtotime($first));
    $prevMonth   = date('Y-m', strtotime("$first -1 month"));
    $nextMonth   = date('Y-m', strtotime("$first +1 month"));
    $openSlots   = count(array_filter($slots));
?>
            <input type="hidden" name="action" value="time">

            <!-- ---------- STEP 3: date + time ---------- -->
            <div class="panel" id="stepTime">
                <div class="panel-head">
                    <span class="step-number">3</span>
                    <div>
                        <h2>Choose a timeslot</h2>
                        <p>Each appointment is 30 minutes. Crossed-out times are fully booked.</p>
                    </div>
                </div>

                <div class="schedule-grid">
                    <div>
                        <!-- each day is a button that sends that date back to PHP -->
                        <div class="calendar" id="calendar">
                            <div class="calendar-head">
                                <button type="submit" name="month" value="<?= $prevMonth ?>" class="calendar-nav" aria-label="Previous month"
                                    <?= $prevMonth < substr($today, 0, 7) ? 'disabled' : '' ?>><i class="fa-solid fa-chevron-left"></i></button>
                                <h3><?= date('F Y', strtotime($first)) ?></h3>
                                <button type="submit" name="month" value="<?= $nextMonth ?>" class="calendar-nav" aria-label="Next month"
                                    <?= $nextMonth > substr($lastDay, 0, 7) ? 'disabled' : '' ?>><i class="fa-solid fa-chevron-right"></i></button>
                            </div>
                            <div class="calendar-grid">
                                <?php foreach (['S', 'M', 'T', 'W', 'T', 'F', 'S'] as $dow): ?>
                                    <span class="calendar-dow" aria-hidden="true"><?= $dow ?></span>
                                <?php endforeach; ?>
                                <?php for ($i = 0; $i < (int) date('w', strtotime($first)); $i++): ?>
                                    <span></span>
                                <?php endfor; ?>
                                <?php for ($day = 1; $day <= $daysInMonth; $day++):
                                    $iso      = sprintf('%s-%02d', $month, $day);
                                    $closed   = !branch_open_on($branch, $iso);
                                    $disabled = $iso < $today || $iso > $lastDay || $closed;
                                    $classes  = 'calendar-day' . ($iso === $today ? ' is-today' : '') . ($iso === $draft['date'] ? ' is-selected' : '');
                                ?>
                                    <button type="submit" name="pickDate" value="<?= $iso ?>" class="<?= $classes ?>"
                                        aria-label="<?= format_date($iso) ?><?= $closed ? ' (clinic closed)' : '' ?>"
                                        <?= $iso === $draft['date'] ? 'aria-pressed="true"' : '' ?> <?= $disabled ? 'disabled' : '' ?>><?= $day ?></button>
                                <?php endfor; ?>
                            </div>
                            <p class="calendar-legend">Greyed-out days are in the past, too far ahead, or the branch is closed.</p>
                        </div>
                        <?php field_error($errors, 'date'); ?>
                    </div>

                    <div id="slots">
                        <h3 class="slot-heading" id="slotHeading"><?= $draft['date'] ? format_date($draft['date']) : 'Pick a date' ?></h3>
                        <p class="slot-sub">
                            <?php if (!$draft['date']): ?>
                                Available times will appear here.
                            <?php elseif (!$slots): ?>
                                There are no more times left on this day. Please choose another date.
                            <?php elseif (!$openSlots): ?>
                                This day is fully booked. Please choose another date.
                            <?php else: ?>
                                <?= $openSlots ?> of <?= count($slots) ?> times available
                            <?php endif; ?>
                        </p>
                        <div class="slot-grid" role="group" aria-labelledby="slotHeading">
                            <?php foreach ($slots as $time => $free):
                                $selected = $time === $draft['time']; ?>
                                <button type="submit" name="pickTime" value="<?= $time ?>" class="slot<?= $selected ? ' is-selected' : '' ?>"
                                    <?= $free ? '' : 'disabled aria-label="' . format_time($time) . ' (fully booked)"' ?>
                                    <?= $selected ? 'aria-pressed="true"' : '' ?>><?= format_time($time) ?></button>
                            <?php endforeach; ?>
                        </div>
                        <?php field_error($errors, 'time'); ?>
                    </div>
                </div>
            </div>

<?php else: ?>
            <input type="hidden" name="action" value="book">

            <!-- ---------- STEP 4: doctor ---------- -->
            <div class="panel" id="stepDoctor">
                <div class="panel-head">
                    <span class="step-number">4</span>
                    <div>
                        <h2>Select a doctor</h2>
                        <p>Only dentists who treat your chosen service are listed.</p>
                    </div>
                </div>

                <p class="service-label"><i class="fa-solid fa-tooth"></i> Service:
                    <?= e($services[$draft['serviceId']]['name']) ?> · <?= format_date($draft['date']) ?>, <?= format_time($draft['time']) ?></p>
                <div class="doctor-options" id="doctorOptions" role="radiogroup" aria-label="Doctor">
                    <?php foreach ($serviceDoctors as $d): ?>
                        <label class="choice-card<?= $d['free'] ? '' : ' is-unavailable' ?>">
                            <input type="radio" name="doctorId" value="<?= $d['id'] ?>" data-name="<?= e($d['name']) ?>"
                                <?= (int) $d['id'] === $draft['doctorId'] ? 'checked' : '' ?> <?= $d['free'] ? '' : 'disabled' ?>>
                            <span class="choice-body">
                                <img src="<?= e($d['photo']) ?>" alt="">
                                <span class="choice-text">
                                    <span class="choice-title"><?= e($d['name']) ?><span class="choice-check"><i class="fa-solid fa-check"></i></span></span>
                                    <span class="choice-line doctor-role"><?= e($d['role']) ?></span>
                                    <span class="choice-line"><?= e($d['bio']) ?></span>
                                    <?php if (!$d['free']): ?><span class="unavailable-tag">Booked at this time</span><?php endif; ?>
                                </span>
                            </span>
                        </label>
                    <?php endforeach; ?>
                </div>
                <?php field_error($errors, 'doctorId'); ?>
            </div>

            <!-- ---------- SUMMARY (under the doctors) ---------- -->
            <div class="panel" id="stepConfirm">
                <div class="panel-head">
                    <span class="step-number"><i class="fa-solid fa-check"></i></span>
                    <div>
                        <h2>Review and confirm</h2>
                    </div>
                </div>

                <?php summary_list([
                    ['fa-solid fa-tooth', 'Service', e($services[$draft['serviceId']]['name'])],
                    ['fa-solid fa-user-doctor', 'Doctor', $draft['doctorId'] ? e($doctors[$draft['doctorId']]['name']) : ''],
                    ['fa-regular fa-calendar', 'Date &amp; time', e(format_date($draft['date']) . ', ' . format_time($draft['time']))],
                    ['fa-solid fa-location-dot', 'Branch', e($branches[$draft['branchId']]['name'])],
                ]); ?>

                <p class="form-note">
                    Need to change something later? You can reschedule or cancel from
                    <a href="dashboard.php">My Account</a>.
                </p>
            </div>
<?php endif; ?>

            <!-- ---------- NEXT / BACK ----------
                 Next comes first in the page so that pressing Enter submits it;
                 CSS puts Back on the left. -->
            <div class="wizard-nav">
                <?php if ($step < TOTAL_STEPS): ?>
                    <button type="submit" name="nav" value="next" class="btn btn-primary btn-lg" id="nextBtn">
                        <span>Next: <?= e(STEP_NAMES[$step + 1]) ?></span> <i class="fa-solid fa-arrow-right"></i>
                    </button>
                <?php else: ?>
                    <button type="submit" name="nav" value="next" class="btn btn-primary btn-lg" id="confirmBtn">
                        <i class="fa-regular fa-calendar-check"></i> Confirm booking
                    </button>
                <?php endif; ?>
                <?php if ($step > 1): ?>
                    <button type="submit" name="nav" value="back" class="btn btn-outline btn-lg" id="backBtn" formnovalidate>
                        <i class="fa-solid fa-arrow-left"></i> Back
                    </button>
                <?php endif; ?>
            </div>
            <p class="draft-status" role="status">
                <?php if ($draft['exists']): ?><i class="fa-solid fa-cloud-arrow-up"></i> Progress saved<?php endif; ?>
            </p>

        </form>
<?php endif; ?>

    </div>
    </div>
</section>


<!-- ==========================================================
     FOOTER  
     ========================================================== -->
<footer class="site-footer">
    <div class="container footer-inner">

        <!-- Left: logo, name and contact details -->
        <div class="footer-col footer-brand">
            <a href="index.html" class="logo logo-footer">
                <img src="images/dental group footer.png" alt="Smile Dental Group logo" class="logo-img">
                <span class="logo-name">Smile Dental Group</span>
            </a>
            <ul class="footer-contact">
                <li><i class="fa-solid fa-location-dot"></i> 123 Orchard Road, #05-12<br>Singapore 238888</li>
                <li><i class="fa-solid fa-phone"></i> <a href="tel:+6561234567">+65 6123 4567</a></li>
                <li><i class="fa-regular fa-envelope"></i> <a href="mailto:hello@smiledental.sg">hello@smiledental.sg</a></li>
            </ul>

            <!-- social media icons sit under the contact details -->
            <ul class="social-links">
                <li><a href="#" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a></li>
                <li><a href="#" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a></li>
                <li><a href="#" aria-label="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a></li>
            </ul>
        </div>

        <!-- Link column: About -->
        <div class="footer-col">
            <h4>About</h4>
            <ul class="footer-links">
                <li><a href="about-us.html">About Us</a></li>
                <li><a href="about-us.html#join">Join Us</a></li>
            </ul>
        </div>

        <!-- Link column: Our Doctors -->
        <div class="footer-col">
            <h4>Our Doctors</h4>
            <ul class="footer-links">
                <li><a href="doctors.html#general">General Dentists</a></li>
                <li><a href="doctors.html#endodontics">Endodontists/Root Canal Specialists</a></li>
                <li><a href="doctors.html#orthodontics">Aligner Team and Orthodontists</a></li>
                <li><a href="doctors.html#periodontics">Periodontists/Gum Specialists</a></li>
                <li><a href="doctors.html#prosthodontics">Prosthodontists/Restorative Dentistry</a></li>
            </ul>
        </div>

        <!-- Link column: Services -->
        <div class="footer-col">
            <h4>Services</h4>
            <ul class="footer-links">
                <li><a href="fees-calculator.html">Fees Calculator</a></li>
                <li><a href="services.html">Dental Services</a></li>
            </ul>
        </div>

        <!-- Link column: Locate Us -->
        <div class="footer-col">
            <h4>Locate Us</h4>
            <ul class="footer-links">
                <li><a href="locate-us.html">Locations</a></li>
            </ul>
        </div>

    </div>

    <div class="footer-bottom">
        <div class="container">
            <p>&copy; 2026 Smile Dental Group. All rights reserved.</p>
            <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
            </ul>
        </div>
    </div>
</footer>


<!-- ==========================================================
     Small script: opens / closes the menu on mobile
     ========================================================== -->
<script>
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');

    // Toggle the menu open/closed when the hamburger is clicked
    menuToggle.addEventListener('click', function () {
        const isOpen = mainNav.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', isOpen);
        menuToggle.innerHTML = isOpen
            ? '<i class="fa-solid fa-xmark"></i>'
            : '<i class="fa-solid fa-bars"></i>';
    });

    // Close the menu again after a real link is tapped.
    // The "Services" toggle is skipped — tapping it should open the dropdown,
    // not close the whole menu.
    document.querySelectorAll('.nav-menu a:not(.dropdown-toggle)').forEach(function (link) {
        link.addEventListener('click', function () {
            mainNav.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', false);
            menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
        });
    });


    /* ---------- Menu dropdown (Services) ---------- */
    const dropdownItems = document.querySelectorAll('.has-dropdown');

    // Helper: close every dropdown
    function closeAllDropdowns() {
        dropdownItems.forEach(function (item) {
            item.classList.remove('open');
        });
    }

    // On a screen with a mouse, CSS opens the panel on hover, so the click
    // toggle below would fight it — a click would leave .open set and the
    // panel stuck open after the pointer moved away. Touch screens and the
    // mobile menu cannot hover, so they still need the tap.
    const hoverOpens = window.matchMedia('(hover: hover) and (min-width: 769px)');

    // Open / close a dropdown when its menu item is tapped
    dropdownItems.forEach(function (item) {
        const toggle = item.querySelector('.dropdown-toggle');

        toggle.addEventListener('click', function (event) {
            event.preventDefault();      // stop the link from jumping anywhere

            if (hoverOpens.matches) { return; }   // hover already handles it

            const wasOpen = item.classList.contains('open');
            closeAllDropdowns();         // only one panel open at a time

            if (!wasOpen) {
                item.classList.add('open');
            }
        });
    });

    // Click anywhere else on the page to close them again
    document.addEventListener('click', function (event) {
        if (!event.target.closest('.has-dropdown')) {
            closeAllDropdowns();
        }
    });

    // The Escape key closes them too
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeAllDropdowns();
        }
    });
</script>

<!-- ==========================================================
     Log in, search and account scripts (shared by every page)
     ========================================================== -->
<script src="js/validators.js"></script>
<script src="js/site.js"></script>
<script src="js/appointment.js"></script>

</body>
</html>
