<?php
/* ==========================================================
   Email notifications.

   PHP's mail() hands the message to whatever php.ini's
   sendmail_path points at. On this machine that is Mailpit,
   a local mail catcher — nothing ever leaves the computer.
   Thunderbird reads the caught mail over POP3.

   Nothing in here is allowed to break a booking: if the mail
   fails, we log it and carry on. The appointment is already
   saved by the time these run.
   ========================================================== */

define('MAIL_FROM_NAME', 'Smile Dental Group');
define('MAIL_FROM', 'noreply@smiledental.local');


/* Send one plain-text email. Returns true if it was accepted.
   Never throws — callers are mid-request with a saved booking. */
function send_mail(string $toEmail, string $toName, string $subject, string $body): bool
{
    // A name containing a newline could inject extra headers, so strip them.
    $toName = trim(str_replace(["\r", "\n"], ' ', $toName));

    // Headers have to be ASCII. Anything else — an em dash in the subject, an
    // accented name — must be MIME encoded or the mail client shows mojibake.
    $to = $toName !== ''
        ? sprintf('%s <%s>', mb_encode_mimeheader($toName, 'UTF-8', 'B'), $toEmail)
        : $toEmail;
    $subject = mb_encode_mimeheader($subject, 'UTF-8', 'B');

    $headers = implode("\r\n", [
        'From: ' . MAIL_FROM_NAME . ' <' . MAIL_FROM . '>',
        'Reply-To: ' . MAIL_FROM,
        'Content-Type: text/plain; charset=UTF-8',
        'MIME-Version: 1.0',
    ]);

    try {
        $sent = @mail($to, $subject, $body, $headers);
    } catch (Throwable $e) {
        error_log('[mail] threw for ' . $toEmail . ': ' . $e->getMessage());
        return false;
    }

    if (!$sent) {
        error_log('[mail] could not send "' . $subject . '" to ' . $toEmail);
    }
    return $sent;
}


/* The confirmation a patient gets after booking.
   $appt is the array find_appointment() returns. */
function send_booking_email(int $patientId, ?array $appt): bool
{
    if ($appt === null) {
        return false;
    }

    $stmt = db()->prepare('SELECT name, email FROM patients WHERE id = ?');
    $stmt->execute([$patientId]);
    $patient = $stmt->fetch();
    if (!$patient || empty($patient['email'])) {
        error_log('[mail] no email on file for patient ' . $patientId);
        return false;
    }

    // "Tuesday, 14 October 2026 at 2.30pm" reads better than "2026-10-14 14:30"
    $when = date('l, j F Y \a\t g.ia', strtotime($appt['date'] . ' ' . $appt['time']));

    $subject = 'Your appointment is confirmed — ' . $appt['reference'];

    $body = "Hello {$patient['name']},\n\n"
          . "Your appointment at Smile Dental Group is confirmed.\n\n"
          . "  Reference   {$appt['reference']}\n"
          . "  Treatment   {$appt['service']}\n"
          . "  Dentist     {$appt['doctor']}\n"
          . "  When        {$when}\n"
          . "  Where       {$appt['branch']}\n"
          . "              {$appt['address']}\n"
          . "  Clinic      {$appt['branchPhone']}\n\n"
          . "Please arrive about ten minutes early. If you need to change or\n"
          . "cancel, sign in to your account or call the clinic on the number\n"
          . "above.\n\n"
          . "See you soon,\n"
          . MAIL_FROM_NAME . "\n";

    return send_mail($patient['email'], $patient['name'], $subject, $body);
}


/* The pair of emails a job application triggers:
   a receipt for the applicant, and a heads-up for the clinic.
   Returns true only if the applicant's copy went out. */
function send_application_emails(array $a, string $positionLabel, string $reference,
                                 string $resumeName, string $careersInbox): bool
{
    $applicant = "Hello {$a['fullName']},\n\n"
        . "Thanks for applying to Smile Dental Group. We have your application\n"
        . "and will be in touch within 5 working days.\n\n"
        . "  Reference   {$reference}\n"
        . "  Position    {$positionLabel}\n"
        . "  Resume      {$resumeName}\n\n"
        . "If any of that looks wrong, just reply to this email.\n\n"
        . "Best wishes,\n"
        . MAIL_FROM_NAME . "\n";

    $sent = send_mail($a['email'], $a['fullName'],
                      'We received your application — ' . $reference, $applicant);

    // The clinic's copy is a nice-to-have; its failure must not change the
    // answer the applicant sees.
    $note = $a['message'] !== '' ? $a['message'] : '(none)';
    $clinic = "New application via the website.\n\n"
        . "  Reference   {$reference}\n"
        . "  Position    {$positionLabel}\n"
        . "  Name        {$a['fullName']}\n"
        . "  Email       {$a['email']}\n"
        . "  Phone       +65 {$a['contact']}\n"
        . "  Resume      {$resumeName}  (in storage/resumes)\n\n"
        . "  Their note:\n  {$note}\n";

    send_mail($careersInbox, 'Careers', 'New application: ' . $positionLabel . ' — ' . $reference, $clinic);

    return $sent;
}
