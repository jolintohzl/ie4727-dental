# Smile Dental Group — Express + MongoDB API

The server for the React site in `../client`. Same endpoints and replies as the
base site's PHP `api/` folder (`{ ok: true, … }` / `{ ok: false, error, fields }`).

## First-time setup

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
npm install
npm run seed        # loads the clinics, services and doctors (with their log-ins)
```

Seeded before doctor log-ins were added? Run `npm run seed` again — it replaces only the
clinics, services and doctors, never patients or appointments. Each doctor logs in at
http://localhost:5173/doctor/login as e.g. `tan.wei.ling@smiledental.local`, with the
**test** password in `seed-data.js`.

## Run it

```bash
npm run dev         # http://localhost:3001 (restarts on save)
```

Then in another terminal: `cd ../client && npm run dev` and open http://localhost:5173.
The React dev server forwards `/api/...` to this server.

## Files

| | |
|---|---|
| `server.js` | starts Express, sessions (stored in MongoDB), mounts the routes |
| `db.js` | the MongoDB connection (`MONGO_URL`) |
| `models/index.js` | every collection: Branch, Service, Doctor, Patient, Appointment, BookingDraft, JobApplication |
| `routes/auth.js` | `session`, `login`, `logout`, `profile` |
| `routes/booking.js` | `options`, `slots`, `draft`, `draft/clear`, `check-details`, `book`, `appointments`, `cancel`, `reschedule` |
| `lib/drafts.js` | saved booking progress (the base site's `booking_drafts`): load, save, clear, and hand a guest's draft over on login |
| `routes/apply.js` | `apply` (job application + resume upload → `uploads/`) |
| `routes/dbadmin.js` | the phpMyAdmin-style database admin at http://localhost:5173/db-admin (browse, filter, edit, insert, delete; answers this computer only) |
| `routes/doctor.js` | `doctor/session`, `doctor/login`, `doctor/logout`, `doctor/appointments`, `doctor/cancel`, `doctor/reschedule` |
| `lib/validators.js` | re-uses the base site's `js/validators.js`, so both sides check the same rules |
| `seed-data.js` | clinics, services and doctors (same as `database/schema.sql`) |

Not ported from PHP: the confirmation emails (`api/mail.php`).
