/* Everything the booking page and the dashboard's appointment list need. */
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { Branch, Service, Doctor, Patient, Appointment } from '../models/index.js'
import {
  fail, handle, requireLogin, toId, isoDate, dateError, branchSlots, patientBusy,
  findAppointment, shapeAppointment, isDuplicate, BOOKING_WINDOW_DAYS,
} from '../lib/helpers.js'
import { bookingDetails, publicPatient } from '../lib/patients.js'

const router = Router()

// GET /api/options → services, branches (with hours) and doctors
router.get('/options', handle(async (req, res) => {
  const rename = (doc) => { const o = doc.toObject(); o.id = o._id; delete o._id; delete o.__v; return o }
  res.json({
    ok: true,
    today: isoDate(new Date()),
    bookingWindowDays: BOOKING_WINDOW_DAYS,
    services: (await Service.find().sort('_id')).map(rename),
    branches: (await Branch.find().sort('_id')).map(rename),
    doctors: (await Doctor.find().sort('_id')).map(rename),
  })
}))

// GET /api/slots?service=1&branch=2&date=2026-10-20   (booking)
// GET /api/slots?doctor=6&branch=1&date=2026-10-20    (rescheduling)
// → { slots: [ { time: "09:00", freeDoctors: [5, 7] }, … ] }
router.get('/slots', handle(async (req, res) => {
  const { date } = req.query
  const branchId = toId(req.query.branch)
  const error = dateError(date)
  if (error) return fail(res, 422, error)
  if (!branchId || (!req.query.service && !req.query.doctor)) return fail(res, 422, 'Choose a branch and a service first.')

  const doctorIds = req.query.doctor
    ? [toId(req.query.doctor)]
    : (await Doctor.find({ serviceIds: toId(req.query.service) })).map((d) => d._id)
  const booked = await Appointment.find({ status: 'booked', date, doctor: { $in: doctorIds } })

  const slots = (await branchSlots(branchId, date)).map((time) => ({
    time,
    freeDoctors: doctorIds.filter((id) => !booked.some((b) => b.doctor === id && b.time === time)),
  }))
  res.json({ ok: true, date, slots })
}))

// POST /api/check-details  { name, nric, phone, email }
// Step 1 of booking asks this before moving on, so an email or NRIC that already
// has an account is caught straight away. /book checks it all again at the end.
router.post('/check-details', handle(async (req, res) => {
  const [, errors] = await bookingDetails(req.body, req.session.patientId || null, false)
  if (Object.keys(errors).length) return fail(res, 422, 'Please fix the highlighted fields.', errors)
  res.json({ ok: true })
}))

// POST /api/book  { serviceId, branchId, doctorId, date, time, name, nric, phone, email }
//   + { password } when nobody is logged in —
//   then the account is created and logged in as part of the booking.
//   A logged-in patient's details are saved to their profile instead.
router.post('/book', handle(async (req, res) => {
  const body = req.body
  let patientId = req.session.patientId || null

  // logged in: the form is filled in from their profile, and any edits update it
  const [clean, errors] = await bookingDetails(body, patientId, !patientId)

  const serviceId = toId(body.serviceId)
  const branchId = toId(body.branchId)
  const doctorId = toId(body.doctorId)
  const { date, time } = body

  if (!(await Service.exists({ _id: serviceId }))) errors.serviceId = 'Please choose a service.'
  if (!(await Branch.exists({ _id: branchId }))) errors.branchId = 'Please choose a branch.'
  const badDate = dateError(date)
  if (badDate) errors.date = badDate
  else if (!errors.branchId && !(await branchSlots(branchId, date)).includes(time)) errors.time = 'Please choose one of the available times.'
  if (!errors.serviceId && !(await Doctor.exists({ _id: doctorId, serviceIds: serviceId }))) errors.doctorId = 'Please choose a doctor for this service.'

  if (Object.keys(errors).length) return fail(res, 422, 'Please fix the highlighted fields.', errors)
  if (patientId && await patientBusy(patientId, date, time)) {
    return fail(res, 409, 'You already have an appointment at this time.', { time: 'You already have an appointment at this time.' })
  }

  // Create the account first (if needed), then the appointment
  const isNewAccount = !patientId
  let newPatient = null
  if (isNewAccount) {
    newPatient = await Patient.create({ ...clean, passwordHash: await bcrypt.hash(clean.password, 10) })
    patientId = String(newPatient._id)
  }
  let appt
  try {
    appt = await Appointment.create({ patient: patientId, doctor: doctorId, service: serviceId, branch: branchId, date, time })
  } catch (err) {
    if (newPatient) await newPatient.deleteOne()   // undo the half-finished booking
    if (isDuplicate(err)) return fail(res, 409, 'Sorry, that timeslot was just taken. Please choose another time.', { time: 'This time was just taken.' })
    throw err
  }

  // the slot is safely ours, so now save any edits to their details
  const patient = isNewAccount ? newPatient : await Patient.findByIdAndUpdate(patientId, clean, { new: true })

  if (isNewAccount) req.session.patientId = patientId
  res.status(201).json({
    ok: true,
    newAccount: isNewAccount,
    patient: publicPatient(patient),
    appointment: await findAppointment(appt._id, patientId),
  })
}))

// GET /api/appointments → this patient's appointments, soonest first
router.get('/appointments', requireLogin, handle(async (req, res) => {
  const list = await Appointment.find({ patient: req.session.patientId })
    .sort({ date: 1, time: 1 }).populate('doctor service branch')
  res.json({ ok: true, appointments: list.map(shapeAppointment) })
}))

// POST /api/cancel  { id }
router.post('/cancel', requireLogin, handle(async (req, res) => {
  const appt = await findAppointment(req.body.id, req.session.patientId)
  if (!appt || !appt.upcoming) return fail(res, 404, 'This appointment can no longer be cancelled.')
  await Appointment.updateOne({ _id: appt.id }, { status: 'cancelled' })
  res.json({ ok: true, appointment: await findAppointment(appt.id, req.session.patientId) })
}))

// POST /api/reschedule  { id, date, time } — same doctor and branch, new slot
router.post('/reschedule', requireLogin, handle(async (req, res) => {
  const patientId = req.session.patientId
  const { date, time } = req.body
  const appt = await findAppointment(req.body.id, patientId)
  if (!appt || !appt.upcoming) return fail(res, 404, 'This appointment can no longer be changed.')
  const badDate = dateError(date)
  if (badDate) return fail(res, 422, badDate, { date: badDate })
  if (!(await branchSlots(appt.branchId, date)).includes(time)) return fail(res, 422, 'Please choose one of the available times.', { time: 'Please choose one of the available times.' })
  if (date === appt.date && time === appt.time) return fail(res, 422, 'That is already your appointment time.', { time: 'That is already your appointment time.' })
  if (await patientBusy(patientId, date, time, appt.id)) return fail(res, 409, 'You already have another appointment at this time.', { time: 'You already have another appointment at this time.' })

  try {
    await Appointment.updateOne({ _id: appt.id }, { date, time })
  } catch (err) {
    if (isDuplicate(err)) return fail(res, 409, 'Sorry, that timeslot was just taken. Please choose another time.', { time: 'This time was just taken.' })
    throw err
  }
  res.json({ ok: true, appointment: await findAppointment(appt.id, patientId) })
}))

export default router
