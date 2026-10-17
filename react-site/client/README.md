# Smile Dental Group — React version (Vite)

The "modern approach" version of the site. The base site (HTML/CSS/JS + PHP) lives
two folders up and is unchanged by this one.

## Run it

```bash
npm install     # first time only
npm run dev     # http://localhost:5173
```

## How it fits together

| | |
|---|---|
| `src/App.jsx` | every page and its address (React Router) |
| `src/components/` | `Header`, `Footer`, `Layout`, `FeesCalculator`, `ApplyForm` |
| `src/pages/` | one file per page — most were converted from the HTML files |
| `src/data/fees.js` | price list + subsidy maths for the calculator |
| `src/data/searchIndex.js` | text the Search page looks through |

Shared with the base site, not copied: `../../images/`, `../../style.css` and
`../../js/validators.js` (see `vite.config.js`, `src/images.js`, `src/validators.js`).

Bootstrap 5 comes from npm and loads before `style.css`.

## Not connected yet

Booking, dashboard, log in and the job application form show their UI and validate,
but do not send anything. They are marked `TODO (step 2)` and will talk to the
Express + MongoDB server in `react-site/server`.
