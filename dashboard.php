<?php
/* ==========================================================
   dashboard.php — "My Account" for a logged-in patient
     • edit profile details
     • upcoming appointments: cancel, or reschedule
       (?reschedule=ID&date=...) — same doctor, same branch,
       a new free slot
     • past and cancelled appointments, folded away
     • log out

   Every form posts back to this page, which does the work and
   redirects back (Post/Redirect/Get), so a refresh never submits
   twice. Messages survive the redirect through flash().
   Not logged in? → login.php, which sends the patient back here.
   ========================================================== */
require __DIR__ . '/includes/app.php';

$patient = current_patient();
if (!$patient) {
    go_to('login.php?next=dashboard.php');
}
$patientId = (int) $patient['id'];


/* ---------- Form posts ---------- */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = str_field($_POST, 'action');

    if ($action === 'logout') {
        log_out();
        go_to('index.html');
    }

    if ($action === 'profile') {
        [$clean, $errors] = validate_patient($_POST, false);
        if (!$errors) {
            $errors = uniqueness_errors($clean, $patientId);
        }
        if (!$errors) {
            try {
                $stmt = db()->prepare('UPDATE patients SET name = ?, nric = ?, phone = ?, email = ? WHERE id = ?');
                $stmt->execute([$clean['name'], $clean['nric'], $clean['phone'], $clean['email'], $patientId]);
            } catch (PDOException $e) {
                if (!is_duplicate($e)) {
                    throw $e;
                }
                $errors = ['email' => 'That email or NRIC/FIN is already used by another account.'];
            }
        }
        if ($errors) {
            // put the form back the way they typed it, with the messages
            flash('profileErrors', $errors);
            flash('profileValues', $clean);
        } else {
            flash('profileSaved', true);
        }
        go_to('dashboard.php#profile');
    }

    $appt = find_appointment(int_field($_POST, 'id'), $patientId);
    if (!$appt || !$appt['upcoming']) {
        flash('error', 'This appointment can no longer be changed.');
        go_to('dashboard.php#appointments');
    }
    $when = format_date($appt['date']) . ' at ' . format_time($appt['time']);

    if ($action === 'cancel') {
        $stmt = db()->prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ? AND patient_id = ?");
        $stmt->execute([$appt['id'], $patientId]);
        flash('notice', "Your appointment on $when has been cancelled.");
        go_to('dashboard.php#appointments');
    }

    if ($action === 'reschedule') {
        $date = str_field($_POST, 'date');
        $time = str_field($_POST, 'time');
        $retry = 'dashboard.php?reschedule=' . $appt['id'] . '&date=' . urlencode($date) . '#appt-' . $appt['id'];

        $error = date_error($date);
        if (!$error && !in_array($time, branch_slots($appt['branchId'], $date), true)) {
            $error = 'Please choose one of the available times.';
        }
        if (!$error && $date === $appt['date'] && $time === $appt['time']) {
            $error = 'That is already your appointment time.';
        }
        if (!$error && patient_busy($patientId, $date, $time, $appt['id'])) {
            $error = 'You already have another appointment at this time.';
        }
        if ($error) {
            flash('rescheduleError', $error);
            go_to($retry);
        }

        try {
            $stmt = db()->prepare('UPDATE appointments SET appt_date = ?, appt_time = ? WHERE id = ? AND patient_id = ?');
            $stmt->execute([$date, $time, $appt['id'], $patientId]);
        } catch (PDOException $e) {
            if (!is_duplicate($e)) {
                throw $e;
            }
            // the unique index caught someone else taking the slot
            flash('rescheduleError', 'Sorry, that timeslot was just taken. Please choose another time.');
            go_to($retry);
        }
        flash('notice', 'Rescheduled to ' . format_date($date) . ', ' . format_time($time) . " with {$appt['doctor']}.");
        go_to('dashboard.php#appt-' . $appt['id']);
    }

    go_to('dashboard.php');
}


/* ---------- What the page shows ---------- */
$profileErrors   = flash('profileErrors') ?? [];
$profile         = flash('profileValues') ?? $patient;
$profileSaved    = flash('profileSaved');
$notice          = flash('notice');
$error           = flash('error');
$rescheduleError = flash('rescheduleError');
$rescheduleId    = int_field($_GET, 'reschedule');
$rescheduleDate  = str_field($_GET, 'date');

$upcoming = [];
$past = [];
foreach (patient_appointments($patientId) as $a) {
    if ($a['upcoming']) {
        $upcoming[] = $a;
    } else {
        $past[] = $a;
    }
}
$past = array_reverse($past);   // newest first

$today   = date('Y-m-d');
$lastDay = date('Y-m-d', strtotime('+' . BOOKING_WINDOW_DAYS . ' days'));

function profile_field(string $name, string $label, string $type, string $autocomplete, int $maxlength, array $values, array $errors)
{
    $error = $errors[$name] ?? '';
    ?>
    <div class="form-field<?= $error ? ' has-error' : '' ?>">
        <label for="<?= $name ?>"><?= $label ?></label>
        <input type="<?= $type ?>" id="<?= $name ?>" name="<?= $name ?>" autocomplete="<?= $autocomplete ?>"
               maxlength="<?= $maxlength ?>" value="<?= e($values[$name] ?? '') ?>"
               <?= $error ? 'aria-invalid="true" aria-describedby="' . $name . '-error"' : '' ?>>
        <span class="field-error" id="<?= $name ?>-error" <?= $error ? '' : 'hidden' ?>><?= e($error) ?></span>
    </div>
    <?php
}

function appointment_card(array $a, int $rescheduleId, string $rescheduleDate, ?string $rescheduleError, string $today, string $lastDay)
{
    $status = '';
    if ($a['status'] === 'cancelled') {
        $status = '<span class="status-tag cancelled">Cancelled</span>';
    } elseif (!$a['upcoming']) {
        $status = '<span class="status-tag">Completed</span>';
    }
    $open = $a['upcoming'] && $a['id'] === $rescheduleId;
    $when = format_date($a['date']) . ' at ' . format_time($a['time']);
    ?>
    <article class="appt-card<?= $a['upcoming'] ? '' : ' is-past' ?>" id="appt-<?= $a['id'] ?>">
        <div class="appt-card-top">
            <img src="<?= e($a['doctorPhoto']) ?>" alt="">
            <div class="appt-card-main">
                <p class="appt-when"><?= e(format_date($a['date'])) ?> – <?= format_time($a['time']) ?><?= $status ?></p>
                <p class="appt-detail"><strong><?= e($a['service']) ?></strong> with <?= e($a['doctor']) ?></p>
                <p class="appt-detail"><i class="fa-solid fa-location-dot"></i> <?= e($a['branch']) ?> · <?= e($a['address']) ?></p>
                <p class="appt-ref">Ref <?= e($a['reference']) ?></p>
            </div>
        </div>

        <?php if ($a['upcoming']): ?>
            <div class="appt-actions">
                <form method="post" action="dashboard.php"
                      data-confirm="<?= e("Cancel your {$a['service']} appointment on $when?") ?>"
                      onsubmit="return confirm(this.dataset.confirm)">
                    <input type="hidden" name="action" value="cancel">
                    <input type="hidden" name="id" value="<?= $a['id'] ?>">
                    <button type="submit" class="btn btn-danger-outline btn-sm">Cancel</button>
                </form>
                <?php if (!$open): ?>
                    <a href="dashboard.php?reschedule=<?= $a['id'] ?>&amp;date=<?= e($a['date']) ?>#appt-<?= $a['id'] ?>"
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
                    <form method="get" action="dashboard.php#appt-<?= $a['id'] ?>" class="reschedule-date">
                        <input type="hidden" name="reschedule" value="<?= $a['id'] ?>">
                        <div class="form-field">
                            <label for="<?= $inputId ?>">New date with <?= e($a['doctor']) ?></label>
                            <input type="date" id="<?= $inputId ?>" name="date" min="<?= $today ?>" max="<?= $lastDay ?>"
                                   value="<?= e($rescheduleDate) ?>" required>
                        </div>
                        <button type="submit" class="btn btn-outline btn-sm">Show times</button>
                    </form>

                    <form method="post" action="dashboard.php">
                        <input type="hidden" name="action" value="reschedule">
                        <input type="hidden" name="id" value="<?= $a['id'] ?>">
                        <input type="hidden" name="date" value="<?= e($date) ?>">

                        <p class="slot-sub">
                            <?php if (!$date): ?>
                                Choose a date to see available times.
                            <?php elseif (!$slots): ?>
                                The <?= e($a['branch']) ?> clinic has no times left on this day. Please pick another date.
                            <?php elseif (!array_filter($slots)): ?>
                                Fully booked on this day. Please pick another date.
                            <?php else: ?>
                                Choose a new time at <?= e($a['branch']) ?>:
                            <?php endif; ?>
                        </p>
                        <div class="slot-grid">
                            <?php foreach ($slots as $time => $free):
                                $current = $date === $a['date'] && $time === $a['time']; ?>
                                <button type="submit" name="time" value="<?= e($time) ?>" class="slot<?= $current ? ' is-selected' : '' ?>"
                                    data-confirm="<?= e('Move this appointment to ' . format_date($date) . ', ' . format_time($time) . '?') ?>"
                                    onclick="return confirm(this.dataset.confirm)"
                                    <?= $current ? 'title="Your current time"' : '' ?> <?= $free ? '' : 'disabled' ?>><?= format_time($time) ?><?= $current ? ' ✓' : '' ?></button>
                            <?php endforeach; ?>
                        </div>
                    </form>

                    <?php if ($rescheduleError): ?>
                        <div class="alert alert-error" role="alert">
                            <i class="fa-solid fa-circle-exclamation"></i> <span><?= e($rescheduleError) ?></span>
                        </div>
                    <?php endif; ?>

                    <div class="appt-actions">
                        <a href="dashboard.php#appt-<?= $a['id'] ?>" class="btn btn-outline btn-sm">Keep current time</a>
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
    <title>My Account | Smile Dental Group</title>

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
     NAVIGATION BAR  (same two-row structure as index.html)
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

                <!-- on this page the profile icon becomes Log out -->
                <form method="post" action="dashboard.php"
                      data-confirm="Are you sure you want to log out?"
                      onsubmit="return confirm(this.dataset.confirm)">
                    <input type="hidden" name="action" value="logout">
                    <button type="submit" class="icon-btn" aria-label="Log out" title="Log out">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    </button>
                </form>

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
            <span>My Account</span>
        </p>
    </div>
</section>


<!-- ==========================================================
     2. ACCOUNT DASHBOARD  (drawn by the PHP at the top of this file)
     ========================================================== -->
<section class="section">
    <div class="container">

        <!-- the heading is for screen readers; the breadcrumb above shows "My Account" -->
        <h1 class="sr-only">My account</h1>

    <div class="page-column">

            <!-- Profile -->
            <form class="panel profile-form" id="profile" method="post" action="dashboard.php" novalidate>
                <input type="hidden" name="action" value="profile">
                <div class="panel-head">
                    <span class="step-number"><i class="fa-regular fa-id-card"></i></span>
                    <div>
                        <h2>Edit profile details</h2>
                        <p>We use these to confirm your identity and contact you about appointments.</p>
                    </div>
                </div>

                <?php
                profile_field('name', 'Name', 'text', 'name', 100, $profile, $profileErrors);
                profile_field('nric', 'NRIC/FIN No.', 'text', 'off', 9, $profile, $profileErrors);
                profile_field('phone', 'Contact No.', 'tel', 'tel', 15, $profile, $profileErrors);
                profile_field('email', 'Email', 'email', 'email', 255, $profile, $profileErrors);
                ?>

                <?php if ($profileErrors): ?>
                    <div class="alert alert-error" role="alert">
                        <i class="fa-solid fa-circle-exclamation"></i> <span>Please fix the highlighted fields.</span>
                    </div>
                <?php endif; ?>

                <div class="profile-actions">
                    <span class="save-status" id="saveStatus" role="status"><?php if ($profileSaved): ?><i class="fa-solid fa-circle-check"></i> Saved<?php endif; ?></span>
                    <button type="submit" class="btn btn-primary">
                        <i class="fa-regular fa-floppy-disk"></i> Save
                    </button>
                </div>
            </form>

            <!-- Appointments -->
            <div class="panel" id="appointments">
                <div class="panel-head">
                    <span class="step-number"><i class="fa-regular fa-calendar"></i></span>
                    <div>
                        <h2>Upcoming appointments</h2>
                        <p>Need to change a time? Reschedule up until the appointment starts.</p>
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

                <div class="appt-list">
                    <?php if (!$upcoming): ?>
                        <p class="empty-note"><i class="fa-regular fa-calendar"></i> You have no upcoming appointments.</p>
                    <?php endif; ?>
                    <?php foreach ($upcoming as $a) {
                        appointment_card($a, $rescheduleId, $rescheduleDate, $rescheduleError, $today, $lastDay);
                    } ?>
                </div>

                <?php if ($past): ?>
                    <details class="past-toggle">
                        <summary>Past and cancelled appointments (<?= count($past) ?>)</summary>
                        <div class="appt-list">
                            <?php foreach ($past as $a) {
                                appointment_card($a, 0, '', null, $today, $lastDay);
                            } ?>
                        </div>
                    </details>
                <?php endif; ?>

                <div class="panel-foot">
                    <a href="appointment.php" class="btn btn-outline">
                        <i class="fa-solid fa-plus"></i> Book another appointment
                    </a>
                </div>
            </div>

    </div>
    </div>
</section>


<!-- ==========================================================
     FOOTER  (same structure as index.html)
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
<script src="js/dashboard.js"></script>

</body>
</html>
