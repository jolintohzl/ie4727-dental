/* The doctor's side: log in, log out, their schedule, cancel and reschedule.
   Same rules as the base site's doctor-dashboard.php. A doctor's login lives in
   req.session.doctorId, apart from a patient's req.session.patientId.
   Free times for rescheduling come from the existing GET /api/slots?doctor=… */
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { Doctor, Appointment } from '../models/index.js'
import { fail, handle, requireDoctor, dateError, branchSlots, patientBusy, shapeAppointment, isDuplicate } from '../lib/helpers.js'
import Validators from '../lib/validators.js'

const router = Router()

const publicDoctor = (d) => d && { id: d._id, name: d.name, role: d.role, email: d.email }

// One of this doctor's appointments, with the patient's name added
function shape(a) {
  return { ...shapeAppointment(a), patientId: String(a.patient._id), patient: a.patient.name }
}

async function findDoctorAppointment(id, doctorId) {
  if (!/^[0-9a-f]{24}$/.test(String(id))) return null
  const a = await Appointment.findOne({ _id: id, doctor: doctorId }).populate('patient doctor service branch')
  return a ? shape(a) : null
}

// GET /api/doctor/session → { loggedIn, doctor }
router.get('/doctor/session', handle(async (req, res) => {
  const doctor = req.session.doctorId ? await Doctor.findById(req.session.doctorId) : null
  res.json({ ok: true, loggedIn: !!doctor, doctor: publicDoctor(doctor) })
}))

// POST /api/doctor/login  { email, password }
router.post('/doctor/login', handle(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const password = String(req.body.password || '')
  const errors = Validators.check({ email, password }, { email: Validators.email, password: Validators.loginPassword })
  if (Object.keys(errors).length) return fail(res, 422, 'Please fix the highlighted fields.', errors)

  const doctor = await Doctor.findOne({ email }).select('+passwordHash')
  // One message for both cases, so the form never reveals which emails belong to doctors
  if (!doctor || !doctor.passwordHash || !(await bcrypt.compare(password, doctor.passwordHash))) {
    return fail(res, 401, 'Incorrect email or password.')
  }
  req.session.doctorId = doctor._id
  res.json({ ok: true, doctor: publicDoctor(doctor) })
}))

// POST /api/doctor/logout — leaves any patient login in the same browser alone
router.post('/doctor/logout', (req, res) => {
  delete req.session.doctorId
  res.json({ ok: true })
})

// GET /api/doctor/appointments → this doctor's appointments, soonest first
router.get('/doctor/appointments', requireDoctor, handle(async (req, res) => {
  const list = await Appointment.find({ doctor: req.session.doctorId })
    .sort({ date: 1, time: 1 }).populate('patient doctor service branch')
  res.json({ ok: true, appointments: list.map(shape) })
}))

// POST /api/doctor/cancel  { id }
router.post('/doctor/cancel', requireDoctor, handle(async (req, res) => {
  const appt = await findDoctorAppointment(req.body.id, req.session.doctorId)
  if (!appt || !appt.upcoming) return fail(res, 404, 'This appointment can no longer be changed.')
  await Appointment.updateOne({ _id: appt.id }, { status: 'cancelled' })
  res.json({ ok: true, appointment: await findDoctorAppointment(appt.id, req.session.doctorId) })
}))

// POST /api/doctor/reschedule  { id, date, time } — same branch, new slot
router.post('/doctor/reschedule', requireDoctor, handle(async (req, res) => {
  const doctorId = req.session.doctorId
  const { date, time } = req.body
  const appt = await findDoctorAppointment(req.body.id, doctorId)
  if (!appt || !appt.upcoming) return fail(res, 404, 'This appointment can no longer be changed.')
  const badDate = dateError(date)
  if (badDate) return fail(res, 422, badDate, { date: badDate })
  if (!(await branchSlots(appt.branchId, date)).includes(time)) return fail(res, 422, 'Please choose one of the available times.', { time: 'Please choose one of the available times.' })
  if (date === appt.date && time === appt.time) return fail(res, 422, 'That is already the appointment time.', { time: 'That is already the appointment time.' })
  if (await patientBusy(appt.patientId, date, time, appt.id)) {
    return fail(res, 409, `${appt.patient} already has another appointment at this time.`, { time: 'The patient is busy then.' })
  }

  try {
    await Appointment.updateOne({ _id: appt.id }, { date, time })
  } catch (err) {
    // the unique index caught a double-booking
    if (isDuplicate(err)) return fail(res, 409, 'You already have an appointment at that time. Please choose another.', { time: 'You are busy then.' })
    throw err
  }
  res.json({ ok: true, appointment: await findDoctorAppointment(appt.id, doctorId) })
}))

export default router
