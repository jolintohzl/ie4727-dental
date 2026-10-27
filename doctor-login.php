<?php
/* ==========================================================
   Doctor log in — the staff side of login.php.

   A plain HTML form that posts to itself: PHP checks the details
   against the doctors table and either starts the doctor's session
   and redirects to doctor-dashboard.php, or draws the page again
   with the mistake shown. No JavaScript is involved and nothing
   here is JSON.
   ========================================================== */
require __DIR__ . '/includes/doctor.php';

// Already logged in? Straight to the schedule.
if (current_doctor_id() !== null) {
    header('Location: doctor-dashboard.php');
    exit;
}

$email  = '';
$error  = (string) flash('loginError');
$fields = [];

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
        $stmt = db()->prepare('SELECT id, password_hash FROM doctors WHERE email = ? AND password_hash IS NOT NULL');
        $stmt->execute([$email]);
        $row = $stmt->fetch();

        // One message for both cases, so the form never reveals which
        // email addresses belong to doctors.
        if (!$row || !password_verify($password, $row['password_hash'])) {
            $error = 'Incorrect email or password.';
        } else {
            log_in_doctor((int) $row['id']);
            header('Location: doctor-dashboard.php');   // Post/Redirect/Get: refresh will not re-submit
            exit;
        }
    } else {
        $error = 'Please fix the highlighted fields.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Doctor Log in | Smile Dental Group</title>
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

            <div class="modal-icon"><i class="fa-solid fa-user-doctor"></i></div>
            <h1>Doctor Log in</h1>
            <p>Log in to see your schedule and manage your appointments.</p>

            <?php if ($error !== ''): ?>
                <div class="alert alert-error" role="alert">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <span><?= e($error) ?></span>
                </div>
            <?php endif; ?>

            <form action="doctor-login.php" method="post" class="login-form">
                <div class="form-field<?= isset($fields['email']) ? ' has-error' : '' ?>">
                    <label for="email">Work email</label>
                    <input type="email" id="email" name="email" placeholder="name@smiledental.local"
                           value="<?= e($email) ?>" maxlength="255" autocomplete="username" autofocus>
                    <?php if (isset($fields['email'])): ?>
                        <span class="field-error"><?= e($fields['email']) ?></span>
                    <?php endif; ?>
                </div>

                <div class="form-field<?= isset($fields['password']) ? ' has-error' : '' ?>">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password"
                           placeholder="Your password" autocomplete="current-password">
                    <?php if (isset($fields['password'])): ?>
                        <span class="field-error"><?= e($fields['password']) ?></span>
                    <?php endif; ?>
                </div>

                <button type="submit" class="btn btn-primary btn-lg btn-block">Log in</button>
            </form>

            <p class="modal-foot">
                Not a doctor? <a href="login.php">Patient log in</a>
            </p>

        </div>
    </div>
</section>

</body>
</html>
