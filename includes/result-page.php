<?php
/* ==========================================================
   A small page shell for PHP scripts that render a result
   instead of answering with data — the careers form and the
   log-in form both end up here.

   It reuses style.css, so these pages look like the rest of
   the site without copying the whole navbar into PHP.

   Usage:
       render_result_page('Application received', 'success', $html);
       render_result_page('Please check the form', 'error', $html, 422);
   ========================================================== */

function render_result_page(string $title, string $kind, string $bodyHtml, int $status = 200)
{
    header_remove('Content-Type');
    header('Content-Type: text/html; charset=utf-8');
    http_response_code($status);

    $icon = $kind === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
    $safeTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');

    echo <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$safeTitle} | Smile Dental Group</title>
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
        <div class="form-card result-card">
            <div class="result-icon {$kind}">
                <i class="fa-solid {$icon}"></i>
            </div>
            <h1>{$safeTitle}</h1>
            {$bodyHtml}
        </div>
    </div>
</section>

</body>
</html>
HTML;
    exit;
}
