<?php
/* ==========================================================
   Database settings — change these if your MySQL login differs.
   XAMPP's default is user "root" with no password.
   ========================================================== */

define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'smile_dental');
define('DB_USER', 'root');
define('DB_PASS', '');

// Timeslots are always 30 minutes long.
define('SLOT_MINUTES', 30);

// How far ahead patients can book.
define('BOOKING_WINDOW_DAYS', 60);

date_default_timezone_set('Asia/Singapore');
