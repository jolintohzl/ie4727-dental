/* Small helpers shared by the routes. */
import { Branch, Appointment } from '../models/index.js'

export const SLOT_MINUTES = 30
export const BOOKING_WINDOW_DAYS = 60

// Every reply looks like the base site's PHP API:
//   { ok: true, ... }   or   { ok: false, error: '...', fields: { email: '...' } }
export function fail(res, status, error, fields = {}) {
  return res.status(status).json({ ok: false, error, fields })
}

// An id from the request as a number, or 0 if it isn't one (like the PHP site's int_field).
// Mongoose throws on NaN, so 'abc' must become 0 and fail the lookup instead.
export function toId(value) {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : 0
}

// Wraps an async route so a thrown error reaches the error handler in server.js
export const handle = (fn) => (req, res, next) => fn(req, res, next).catch(next)

export function requireLogin(req, res, next) {
  if (!req.session.patientId) return fail(res, 401, 'Please log in first.')
  next()
}

// Doctors log in separately (routes/doctor.js) and are kept in req.session.doctorId
export function requireDoctor(req, res, next) {
  if (!req.session.doctorId) return fail(res, 401, 'Please log in as a doctor first.')
  next()
}

// Date → "2026-10-20" in local time
export function isoDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

// '' when the date is fine, otherwise the message to show
export function dateError(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return 'Please choose a date.'
  const today = isoDate(new Date())
  const last = new Date()
  last.setDate(last.getDate() + BOOKING_WINDOW_DAYS)
  if (date < today) return 'That date has already passed.'
  if (date > isoDate(last)) return `Appointments can be booked up to ${BOOKING_WINDOW_DAYS} days ahead.`
  return ''
}

// All the start times a branch offers on a date, leaving out times already past
export async function branchSlots(branchId, date) {
  const branch = await Branch.findById(branchId)
  const [y, m, d] = date.split('-').map(Number)
  const hours = branch && branch.hours[new Date(y, m - 1, d).getDay()]
  if (!hours) return []

  const toMinutes = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))
  const now = new Date()
  const slots = []
  for (let t = toMinutes(hours.open); t + SLOT_MINUTES <= toMinutes(hours.close); t += SLOT_MINUTES) {
    const start = new Date(y, m - 1, d, Math.floor(t / 60), t % 60)
    if (start > now) slots.push(String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'))
  }
  return slots
}

// Each start time on a date with the doctors still free then:
// [ { time: "09:00", freeDoctors: [5, 7] }, … ]
export async function slotTable(doctorIds, branchId, date) {
  const booked = await Appointment.find({ status: 'booked', date, doctor: { $in: doctorIds } })
  return (await branchSlots(branchId, date)).map((time) => ({
    time,
    freeDoctors: doctorIds.filter((id) => !booked.some((b) => b.doctor === id && b.time === time)),
  }))
}

// Does this patient already have something booked at that time?
export async function patientBusy(patientId, date, time, exceptId = null) {
  const query = { patient: patientId, date, time, status: 'booked' }
  if (exceptId) query._id = { $ne: exceptId }
  return !!(await Appointment.exists(query))
}

// The shape the React pages expect for one appointment
export function shapeAppointment(a) {
  const id = String(a._id)
  return {
    id,
    reference: 'SDG-' + id.slice(-6).toUpperCase(),
    status: a.status,
    date: a.date,
    time: a.time,
    upcoming: a.status === 'booked' && new Date(a.date + 'T' + a.time) > new Date(),
    serviceId: a.service._id, service: a.service.name,
    doctorId: a.doctor._id, doctor: a.doctor.name, doctorPhoto: a.doctor.photo,
    branchId: a.branch._id, branch: a.branch.name, address: a.branch.address, branchPhone: a.branch.phone,
  }
}

// Loads one appointment (with its doctor, service and branch) belonging to this patient
export async function findAppointment(id, patientId) {
  if (!/^[0-9a-f]{24}$/.test(String(id))) return null
  const a = await Appointment.findOne({ _id: id, patient: patientId }).populate('doctor service branch')
  return a ? shapeAppointment(a) : null
}

// MongoDB's "duplicate key" error — e.g. the slot was just taken by someone else
export const isDuplicate = (err) => err && err.code === 11000
