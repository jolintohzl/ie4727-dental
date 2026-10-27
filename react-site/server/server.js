/* ==========================================================
   Smile Dental Group — Express API for the React site.
   Run:  npm run dev        (http://localhost:3001)
   The React dev server forwards every /api request here
   (see react-site/client/vite.config.js).
   ========================================================== */
import express from 'express'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import { connectDb, MONGO_URL } from './db.js'
import authRoutes from './routes/auth.js'
import bookingRoutes from './routes/booking.js'
import applyRoutes from './routes/apply.js'
import doctorRoutes from './routes/doctor.js'

const PORT = process.env.PORT || 3001
const app = express()

app.use(express.json())

// Who is logged in is kept in a session cookie; the sessions live in MongoDB.
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URL }),
  cookie: { httpOnly: true, sameSite: 'lax' },
}))

app.use('/api', authRoutes)
app.use('/api', bookingRoutes)
app.use('/api', applyRoutes)
app.use('/api', doctorRoutes)

app.use('/api', (req, res) => res.status(404).json({ ok: false, error: 'Not found.' }))

// Anything that throws ends up here
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ ok: false, error: 'Something went wrong on our side. Please try again.' })
})

await connectDb()
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))
