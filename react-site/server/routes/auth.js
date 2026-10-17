/* Log in, log out, "who is logged in?" and the profile form. */
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { Patient } from '../models/index.js'
import { fail, handle, requireLogin } from '../lib/helpers.js'
import { validatePatient, uniquenessErrors, publicPatient } from '../lib/patients.js'
import Validators from '../lib/validators.js'

const router = Router()

// GET /api/session → { loggedIn, patient }
router.get('/session', handle(async (req, res) => {
  const patient = req.session.patientId ? await Patient.findById(req.session.patientId) : null
  res.json({ ok: true, loggedIn: !!patient, patient: publicPatient(patient) })
}))

// POST /api/login  { email, password }
router.post('/login', handle(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const password = String(req.body.password || '')
  const errors = Validators.check({ email, password }, { email: Validators.email, password: Validators.loginPassword })
  if (Object.keys(errors).length) return fail(res, 422, 'Please fix the highlighted fields.', errors)

  const patient = await Patient.findOne({ email })
  if (!patient || !(await bcrypt.compare(password, patient.passwordHash))) {
    return fail(res, 401, 'Incorrect email or password.')
  }
  req.session.patientId = String(patient._id)
  res.json({ ok: true, patient: publicPatient(patient) })
}))

// POST /api/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }))
})

// POST /api/profile  { name, nric, phone, email }
router.post('/profile', requireLogin, handle(async (req, res) => {
  const [clean, errors] = validatePatient(req.body, false)
  Object.assign(errors, Object.keys(errors).length ? {} : await uniquenessErrors(clean, req.session.patientId))
  if (Object.keys(errors).length) return fail(res, 422, 'Please fix the highlighted fields.', errors)

  const patient = await Patient.findByIdAndUpdate(req.session.patientId, clean, { new: true })
  res.json({ ok: true, patient: publicPatient(patient) })
}))

export default router
