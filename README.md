### Test

## Running the site locally (XAMPP)

1. Put this folder in `htdocs` (it is already at `htdocs/ie4727-dental`).
2. Open the XAMPP control panel and start **Apache** and **MySQL**.
3. Create the database: phpMyAdmin → **Import** → choose `database/schema.sql` → **Go**.
   (Running it again wipes all accounts and bookings.)
4. Visit <http://localhost/ie4727-dental/index.html>.
   If that doesn't load, your Apache may use a different port: look for the `Listen` line in
   XAMPP's `etc/httpd.conf` (e.g. `Listen 8000` → <http://localhost:8000/ie4727-dental/index.html>).
   phpMyAdmin is on the same port: <http://localhost/phpmyadmin> or <http://localhost:8000/phpmyadmin>.

The pages must be opened through `http://localhost/...`, not by double-clicking the
HTML file — the log-in, booking and dashboard pages need PHP to talk to the database.
If your MySQL user or password is not XAMPP's default (`root`, no password), change it in
`api/config.php`.

### Extra steps on a Mac

Git does not carry folder permissions or XAMPP's settings, so each Mac needs these once.

**Resume uploads (careers form).** XAMPP's Apache runs as the `daemon` user, which cannot
write to a folder you own. Without this, `apply.php` answers "We could not store your resume".
Run in this folder:

```bash
chmod 777 storage/resumes
```

**Emails (booking and application confirmations).** `api/mail.php` sends through PHP's
`mail()`. Mailpit catches those emails locally so nothing is really sent.

1. Install and start it: `brew install mailpit`, then `brew services start mailpit`.
2. In `/Applications/XAMPP/xamppfiles/etc/php.ini`, find `;sendmail_path =` and replace it with
   `sendmail_path = "/opt/homebrew/bin/mailpit sendmail -t"`
   (on an Intel Mac the path is `/usr/local/bin/mailpit`).
3. Restart Apache in the XAMPP control panel.
4. Caught emails appear at <http://localhost:8025>.

Without Mailpit the forms still work; the emails just go nowhere.

To read the emails in Thunderbird instead, Mailpit's POP3 server has to be switched on, and it
needs a password file: create one with
`mkdir -p ~/.mailpit && htpasswd -cB ~/.mailpit/pop3.htpasswd mailpit`, run
Mailpit with `--pop3-auth-file ~/.mailpit/pop3.htpasswd`, then add a POP3 account in
Thunderbird on `localhost` port `1110` (no encryption, username `mailpit`).

## How the pieces fit together

| Feature | Page | Front end | Server |
| --- | --- | --- | --- |
| Search icon | `search.html` | `js/search.js` — reads the site's own pages and ranks matches | none (no database) |
| Profile icon → log-in modal | every page | `js/login-modal.js` | `api/login.php`, `api/session.php` |
| Account dashboard | `dashboard.html` | `js/dashboard.js` | `api/profile.php`, `api/appointments.php`, `api/reschedule.php`, `api/cancel.php`, `api/logout.php` |
| Book Appointment | `appointment.html` | `js/appointment.js` | `api/options.php`, `api/slots.php`, `api/book.php`, `api/draft.php` (saves progress) |

- `js/site.js` is loaded on every page: navbar search bar, profile icon, and the
  `Smile.api()` helper that every script uses to call PHP.
- `js/validators.js` holds the form rules (email, NRIC/FIN, phone, password). PHP checks the
  same rules again in `api/bootstrap.php`.
- The booking form saves progress after every step into the `booking_drafts` table, so a
  refresh puts it back. Guests' drafts are tied to PHP's session cookie; logged-in patients'
  to their account. The password is never saved in a draft. If your database was created
  before this table existed, import `database/add_booking_drafts.sql` (it doesn't wipe data).
- Every timeslot is 30 minutes. A doctor cannot be double-booked — the database enforces it
  with a unique index, so two people clicking at the same moment can't both get the slot.
