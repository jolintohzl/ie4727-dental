### Test

## Running the site locally (XAMPP)

1. Put this folder in `htdocs` (it is already at `htdocs/ie4727-dental`).
2. Open the XAMPP control panel and start **Apache** and **MySQL**.
3. Create the database: phpMyAdmin → **Import** → choose `database/schema.sql` → **Go**.
   (Running it again wipes all accounts and bookings.)
4. Visit <http://localhost/ie4727-dental/index.html>.

The pages must be opened through `http://localhost/...`, not by double-clicking the
HTML file — the log-in, booking and dashboard pages need PHP to talk to the database.
If your MySQL user or password is not XAMPP's default (`root`, no password), change it in
`api/config.php`.

## How the pieces fit together

| Feature | Page | Front end | Server |
| --- | --- | --- | --- |
| Search icon | `search.html` | `js/search.js` — reads the site's own pages and ranks matches | none (no database) |
| Profile icon → log-in modal | every page | `js/login-modal.jsx` (React, via CDN + Babel) | `api/login.php`, `api/session.php` |
| Account dashboard | `dashboard.html` | `js/dashboard.js` | `api/profile.php`, `api/appointments.php`, `api/reschedule.php`, `api/cancel.php`, `api/logout.php` |
| Book Appointment | `appointment.html` | `js/appointment.js` | `api/options.php`, `api/slots.php`, `api/book.php` |

- `js/site.js` is loaded on every page: navbar search bar, profile icon, and the
  `Smile.api()` helper that every script uses to call PHP.
- `js/validators.js` holds the form rules (email, NRIC/FIN, phone, password). PHP checks the
  same rules again in `api/bootstrap.php`.
- Every timeslot is 30 minutes. A doctor cannot be double-booked — the database enforces it
  with a unique index, so two people clicking at the same moment can't both get the slot.
