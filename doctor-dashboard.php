<?php
/* ==========================================================
   doctor-dashboard.php — a doctor's own schedule
     • upcoming appointments, grouped by day
     • cancel an appointment
     • reschedule one (?reschedule=ID&date=...) — same branch,
       same doctor, a new free slot
     • past and cancelled appointments, folded away

   Every form posts back to this page, which does the work and
   redirects back (Post/Redirect/Get), so a refresh never submits
   twice. Messages survive the redirect through flash().
   ========================================================== */
require __DIR__ . '/includes/doctor.php';

$doctor = current_doctor_id() !== null ? find_doctor(current_doctor_id()) : null;
if (!$doctor) {
    header('Location: doctor-login.php'); //redirect to login page if try to go doctor dashboard
    exit;
}
$doctorId = (int) $doctor['id'];

/* ---------- Form posts ---------- */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = str_field($_POST, 'action');

    if ($action === 'logout') {
        log_out_doctor();
        go_to('doctor-login.php');
    }

    $appt = find_doctor_appointment(int_field($_POST, 'id'), $doctorId);
    if (!$appt || !$appt['upcoming']) {
        flash('error', 'This appointment can no longer be changed.');
        go_to('doctor-dashboard.php');
    }
    $back = 'doctor-dashboard.php#appt-' . $appt['id'];
    $when = format_date($appt['date']) . ', ' . format_time($appt['time']);

    if ($action === 'cancel') {
        $stmt = db()->prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ? AND doctor_id = ?");
        $stmt->execute([$appt['id'], $doctorId]);
        flash('notice', "Cancelled {$appt['patient']}'s {$appt['service']} appointment on $when.");
        go_to('doctor-dashboard.php');
    }

    if ($action === 'reschedule') {
        $date = str_field($_POST, 'date');
        $time = str_field($_POST, 'time');
        $retry = 'doctor-dashboard.php?reschedule=' . $appt['id'] . '&date=' . urlencode($date) . '#appt-' . $appt['id'];

        // Same checks as dashboard.php's reschedule, but the busy patient is the appointment's patient
        $error = date_error($date);
        if (!$error && !in_array($time, branch_slots($appt['branchId'], $date), true)) {
            $error = 'Please choose one of the available times.';
        }
        if (!$error && $date === $appt['date'] && $time === $appt['time']) {
            $error = 'That is already the appointment time.';
        }
        if (!$error && patient_busy($appt['patientId'], $date, $time, $appt['id'])) {
            $error = $appt['patient'] . ' already has another appointment at this time.';
        }
        if ($error) {
            flash('rescheduleError', $error);
            go_to($retry);
        }

        try {                                                            //every update checks the owner. cannot change someone else appt by changing id
            $stmt = db()->prepare('UPDATE appointments SET appt_date = ?, appt_time = ? WHERE id = ? AND doctor_id = ?');
            $stmt->execute([$date, $time, $appt['id'], $doctorId]);
        } catch (PDOException $e) {
            if (!is_duplicate($e)) {
                throw $e;
            }
            // the unique index caught a double-booking
            flash('rescheduleError', 'You already have an appointment at that time. Please choose another.');
            go_to($retry);
        }
        flash('notice', "Moved {$appt['patient']}'s appointment to " . format_date($date) . ', ' . format_time($time) . '.');
        go_to($back);
    }

    go_to('doctor-dashboard.php');
}


/* ---------- What the page shows ---------- */
$notice          = flash('notice');
$error           = flash('error');
$rescheduleError = flash('rescheduleError');
$rescheduleId    = int_field($_GET, 'reschedule');
$rescheduleDate  = str_field($_GET, 'date');

$appointments = doctor_appointments($doctorId);
$upcomingByDay = [];
$past = [];
foreach ($appointments as $a) {
    if ($a['upcoming']) {
        $upcomingByDay[$a['date']][] = $a;
    } else {
        $past[] = $a;
    }
}
$past = array_reverse($past);   // newest first

$today   = date('Y-m-d');
$lastDay = date('Y-m-d', strtotime('+' . BOOKING_WINDOW_DAYS . ' days'));

function doctor_appointment_card(array $a, int $rescheduleId, string $rescheduleDate, ?string $rescheduleError, string $today, string $lastDay)
{
    $status = '';
    if ($a['status'] === 'cancelled') {
        $status = '<span class="status-tag cancelled">Cancelled</span>';
    } elseif (!$a['upcoming']) {
        $status = '<span class="status-tag">Completed</span>';
    }
    $open = $a['upcoming'] && $a['id'] === $rescheduleId;
    $when = format_date($a['date']) . ', ' . format_time($a['time']);
    ?>
    <article class="appt-card<?= $a['upcoming'] ? '' : ' is-past' ?>" id="appt-<?= $a['id'] ?>">
        <div class="appt-card-top">
            <span class="step-number"><i class="fa-regular fa-user"></i></span>
            <div class="appt-card-main">
                <p class="appt-when"><?= $a['upcoming'] ? format_time($a['time']) : e($when) ?><?= $status ?></p>
                <p class="appt-detail"><strong><?= e($a['patient']) ?></strong> · <?= e($a['service']) ?></p>
                <p class="appt-detail"><i class="fa-solid fa-location-dot"></i> <?= e($a['branch']) ?></p>
                <p class="appt-ref">Ref <?= e($a['reference']) ?></p>
            </div>
        </div>

        <?php if ($a['upcoming']): ?>
            <div class="appt-actions">
                <form method="post" action="doctor-dashboard.php"
                      data-confirm="<?= e("Cancel {$a['patient']}'s appointment on $when?") ?>"
                      onsubmit="return confirm(this.dataset.confirm)">
                    <input type="hidden" name="action" value="cancel">
                    <input type="hidden" name="id" value="<?= $a['id'] ?>">
                    <button type="submit" class="btn btn-danger-outline btn-sm">Cancel</button>
                </form>
                <?php if (!$open): ?>
                    <a href="doctor-dashboard.php?reschedule=<?= $a['id'] ?>&amp;date=<?= e($a['date']) ?>#appt-<?= $a['id'] ?>"
                       class="btn btn-outline btn-sm"><i class="fa-regular fa-calendar"></i> Reschedule</a>
                <?php endif; ?>
            </div>

            <?php if ($open):
                $date  = date_error($rescheduleDate) ? '' : $rescheduleDate;
                $slots = $date ? doctor_free_slots($a, $date) : [];
                $inputId = 'newDate-' . $a['id'];
            ?>
                <div class="reschedule-box">
                    <!-- choosing a day reloads the page with that day's free times -->
                    <form method="get" action="doctor-dashboard.php#appt-<?= $a['id'] ?>" class="reschedule-date">
                        <input type="hidden" name="reschedule" value="<?= $a['id'] ?>">
                        <div class="form-field">
                            <label for="<?= $inputId ?>">New date at <?= e($a['branch']) ?></label>
                            <input type="date" id="<?= $inputId ?>" name="date" min="<?= $today ?>" max="<?= $lastDay ?>"
                                   value="<?= e($rescheduleDate) ?>" required>
                        </div>
                        <button type="submit" class="btn btn-outline btn-sm">Show times</button>
                    </form>

                    <form method="post" action="doctor-dashboard.php">
                        <input type="hidden" name="action" value="reschedule">
                        <input type="hidden" name="id" value="<?= $a['id'] ?>">
                        <input type="hidden" name="date" value="<?= e($date) ?>">

                        <p class="slot-sub">
                            <?php if (!$date): ?>
                                Choose a date to see your free times.
                            <?php elseif (!$slots): ?>
                                The <?= e($a['branch']) ?> clinic has no times left on this day. Please pick another date.
                            <?php elseif (!array_filter($slots)): ?>
                                You are fully booked on this day. Please pick another date.
                            <?php else: ?>
                                Pick a new time:
                            <?php endif; ?>
                        </p>
                        <div class="slot-grid">
                            <?php foreach ($slots as $time => $free):
                                $current = $date === $a['date'] && $time === $a['time']; ?>
                                <button type="submit" name="time" value="<?= e($time) ?>" class="slot<?= $current ? ' is-selected' : '' ?>"
                                    data-confirm="<?= e("Move {$a['patient']} to " . format_date($date) . ', ' . format_time($time) . '?') ?>"
                                    onclick="return confirm(this.dataset.confirm)"
                                    <?= $current ? 'title="Current time"' : '' ?> <?= $free ? '' : 'disabled' ?>><?= format_time($time) ?></button>
                            <?php endforeach; ?>
                        </div>
                    </form>

                    <?php if ($rescheduleError): ?>
                        <div class="alert alert-error" role="alert">
                            <i class="fa-solid fa-circle-exclamation"></i> <span><?= e($rescheduleError) ?></span>
                        </div>
                    <?php endif; ?>

                    <div class="appt-actions">
                        <a href="doctor-dashboard.php#appt-<?= $a['id'] ?>" class="btn btn-outline btn-sm">Keep current time</a>
                    </div>
                </div>
            <?php endif; ?>
        <?php endif; ?>
    </article>
    <?php
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Schedule | Smile Dental Group</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>

<header class="site-header">
    <div class="nav-top">
        <div class="container nav-top-inner">
            <a href="index.html" class="logo">
                <img src="images/dental group.png" alt="Smile Dental Group logo" class="logo-img">
                <span class="logo-text">
                    <span class="logo-name">Smile Dental Group</span>
                    <span class="logo-tagline">Doctor's area</span>
                </span>
            </a>

            <form method="post" action="doctor-dashboard.php" class="nav-actions"
                  data-confirm="Are you sure you want to log out?"
                  onsubmit="return confirm(this.dataset.confirm)">
                <input type="hidden" name="action" value="logout">
                <button type="submit" class="btn btn-outline btn-logout" aria-label="Log out">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    <span>Log out</span>
                </button>
            </form>
        </div>
    </div>
</header>

<section class="section">
    <div class="container">

        <!-- greeting — names are stored with their "Dr." title already -->
        <div class="section-head">
            <h1>Hello, <?= e($doctor['name']) ?></h1>
            <p class="section-sub">Here's your schedule.</p>
        </div>

        <div class="page-column">
            <div class="panel">
                <div class="panel-head">
                    <span class="step-number"><i class="fa-regular fa-calendar"></i></span>
                    <div>
                        <h2>Upcoming appointments</h2>
                        <p>Cancel or move an appointment up until it starts.</p>
                    </div>
                </div>

                <?php if ($notice): ?>
                    <div class="alert alert-success" role="status">
                        <i class="fa-solid fa-circle-check"></i> <span><?= e($notice) ?></span>
                    </div>
                <?php endif; ?>
                <?php if ($error): ?>
                    <div class="alert alert-error" role="alert">
                        <i class="fa-solid fa-circle-exclamation"></i> <span><?= e($error) ?></span>
                    </div>
                <?php endif; ?>

                <?php if (!$upcomingByDay): ?>
                    <p class="empty-note"><i class="fa-regular fa-calendar"></i> You have no upcoming appointments.</p>
                <?php endif; ?>

                <?php foreach ($upcomingByDay as $day => $list): ?>
                    <h3 class="schedule-day">
                        <?= $day === $today ? 'Today · ' : '' ?><?= e(format_date($day)) ?>
                        <span><?= count($list) ?> appointment<?= count($list) === 1 ? '' : 's' ?></span>
                    </h3>
                    <div class="appt-list">
                        <?php foreach ($list as $a) {
                            doctor_appointment_card($a, $rescheduleId, $rescheduleDate, $rescheduleError, $today, $lastDay);
                        } ?>
                    </div>
                <?php endforeach; ?>

                <?php if ($past): ?>
                    <details class="past-toggle">
                        <summary>Past and cancelled appointments (<?= count($past) ?>)</summary>
                        <div class="appt-list">
                            <?php foreach ($past as $a) {
                                doctor_appointment_card($a, 0, '', null, $today, $lastDay);
                            } ?>
                        </div>
                    </details>
                <?php endif; ?>
            </div>
        </div>

    </div>
</section>

</body>
</html>
