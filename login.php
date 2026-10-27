<?php
/* ==========================================================
   Patient log in — a plain HTML form that posts to itself.

   This is the ordinary log-in route: the form's action is this
   script, PHP checks the details and either starts the session
   and redirects, or draws the page again with the mistake shown.
   No JavaScript is involved and nothing here is JSON.

   The pop-up modal in js/login-modal.js still exists, but only
   for the booking and dashboard screens, where logging in has to
   happen without leaving the page.
   ========================================================== */
require __DIR__ . '/api/bootstrap.php';

$email  = '';
$error  = '';
$fields = [];

// Where to go once logged in. Only a local page is allowed — an absolute
// URL here would let someone use this form as a redirect to their own site.
$next = isset($_GET['next']) ? (string) $_GET['next'] : (string) ($_POST['next'] ?? '');
if ($next === '' || !preg_match('/^[A-Za-z0-9_-]+\.(?:html|php)(?:#[A-Za-z0-9_-]+)?$/', $next)) {
    $next = 'dashboard.html';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = strtolower(trim((string) ($_POST['email'] ?? '')));
    $password = (string) ($_POST['password'] ?? '');

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $fields['email'] = 'Please enter a valid email address.';
    }
    if ($password === '') {
        $fields['password'] = 'Please enter your password.';
    }

    if (!$fields) {
        $stmt = db()->prepare('SELECT id, password_hash FROM patients WHERE email = ?');
        $stmt->execute([$email]);
        $row = $stmt->fetch();

        // One message for both cases, so the form never reveals which
        // email addresses have accounts.
        if (!$row || !password_verify($password, $row['password_hash'])) {
            $error = 'Incorrect email or password.';
        } else {
            log_in((int) $row['id']);
            header('Location: ' . $next);   // Post/Redirect/Get: refresh will not re-submit
            exit;
        }
    } else {
        $error = 'Please fix the highlighted fields.';
    }
}

// This page is HTML; bootstrap.php set a JSON header for the /api endpoints.
header_remove('Content-Type');
header('Content-Type: text/html; charset=utf-8');

$e = fn($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Patient Log in | Smile Dental Group</title>
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
                    <span class="logo-tagline">Gentle care, lasting smiles</span>
                </span>
            </a>
        </div>
    </div>
</header>

<section class="section">
    <div class="container narrow">
        <div class="form-card result-card login-card">

            <div class="modal-icon"><i class="fa-regular fa-user"></i></div>
            <h1>Patient Log in</h1>
            <p>Log in to manage your profile and appointments.</p>

            <?php if ($error !== ''): ?>
                <div class="alert alert-error" role="alert">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <span><?= $e($error) ?></span>
                </div>
            <?php endif; ?>

            <form action="login.php" method="post" class="login-form">
                <input type="hidden" name="next" value="<?= $e($next) ?>">

                <div class="form-field<?= isset($fields['email']) ? ' has-error' : '' ?>">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" placeholder="you@example.com"
                           value="<?= $e($email) ?>" maxlength="255" autocomplete="email" autofocus>
                    <?php if (isset($fields['email'])): ?>
                        <span class="field-error"><?= $e($fields['email']) ?></span>
                    <?php endif; ?>
                </div>

                <div class="form-field<?= isset($fields['password']) ? ' has-error' : '' ?>">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password"
                           placeholder="Your password" autocomplete="current-password">
                    <?php if (isset($fields['password'])): ?>
                        <span class="field-error"><?= $e($fields['password']) ?></span>
                    <?php endif; ?>
                </div>

                <button type="submit" class="btn btn-primary btn-lg btn-block">Log in</button>
            </form>

            <p class="modal-foot">
                New patient? Your account is created when you
                <a href="appointment.html">book your first appointment</a>.
            </p>
            <p class="modal-foot">
                Forgotten your password? For your privacy we reset passwords over the
                phone — call <a href="tel:+6561234567">+65 6123 4567</a>.
            </p>
            <p class="modal-foot">
                One of our dentists? <a href="doctor-login.php">Doctor log in</a>
            </p>

        </div>
    </div>
</section>

</body>
</html>
