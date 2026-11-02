/* ==========================================================
   SAVED PROGRESS  (BookingDraft collection)

   Logged in → the draft belongs to the account (patient).
   Guest     → it belongs to this browser's session. The key is
               kept in req.session.draftKey, so it survives logging
               in and the draft can be handed over to the account.

   A guest's password is never saved in the draft: only its hash
   is kept, in req.session.bookingPasswordHash, until /book
   creates the account.
   ========================================================== */
import { BookingDraft, Service, Branch, Doctor, Patient } from '../models/index.js'
import { toId, dateError, slotTable } from './helpers.js'
import { validatePatient } from './patients.js'

const DETAIL_FIELDS = ['name', 'nric', 'phone', 'email']
const TOTAL_STEPS = 4

// Which draft belongs to this browser. A guest gets a key the first time
// something is saved; reading never creates one (so no empty sessions).
function draftOwner(req, create) {
  if (req.session.patientId) return { patient: req.session.patientId }
  if (!req.session.draftKey && create) req.session.draftKey = req.sessionID
  return req.session.draftKey ? { sessionKey: req.session.draftKey } : null
}

// Just logged in with a booking already started as a guest?
// That booking is what they were doing, so it replaces any older one on
// the account. The guest's typed details are dropped: the profile wins.
export async function takeOverGuestDraft(req) {
  const patient = req.session.patientId
  if (!patient || !req.session.draftKey) return
  const guestDraft = await BookingDraft.findOne({ sessionKey: req.session.draftKey })
  if (guestDraft) {
    await BookingDraft.deleteOne({ patient })
    await BookingDraft.updateOne({ _id: guestDraft._id }, {
      $set: { patient },
      $unset: { sessionKey: 1, name: 1, nric: 1, phone: 1, email: 1 },
    })
  }
  delete req.session.draftKey
  delete req.session.bookingPasswordHash
}

// Drops anything in the draft that can no longer be booked: a date that has
// passed, a time someone else took, a doctor who is now busy.
// Returns [draft, somethingWasDropped].
async function settleDraft(d) {
  let dropped = false
  if (d.serviceId && !(await Service.exists({ _id: d.serviceId }))) d.serviceId = null
  if (d.branchId && !(await Branch.exists({ _id: d.branchId }))) d.branchId = null

  let slots = []
  if (d.date) {
    if (d.serviceId && d.branchId && !dateError(d.date)) {
      const doctorIds = (await Doctor.find({ serviceIds: d.serviceId })).map((doc) => doc._id)
      slots = await slotTable(doctorIds, d.branchId, d.date)
    }
    if (!slots.length) {
      d.date = null
      dropped = true
    }
  }
  if (d.time) {
    const slot = slots.find((s) => s.time === d.time)
    if (!slot || !slot.freeDoctors.length) {
      d.time = null
      d.doctorId = null
      dropped = true
    } else if (d.doctorId && !slot.freeDoctors.includes(d.doctorId)) {
      d.doctorId = null
      dropped = true
    }
  } else {
    d.doctorId = null
  }
  return [d, dropped]
}

// The first step that still needs something, so the form never opens past it
function firstUnfinishedStep(d, needsPassword) {
  const [, errors] = validatePatient(d, false)
  if (Object.keys(errors).length || needsPassword) return 1
  if (!d.serviceId || !d.branchId) return 2
  if (!d.date || !d.time) return 3
  return 4
}

// GET /api/draft → this browser's booking, ready to put back on the form.
// A logged-in patient's details come from their profile unless the draft
// has newer ones.
export async function loadDraft(req) {
  await takeOverGuestDraft(req)
  const owner = draftOwner(req, false)
  const saved = owner && await BookingDraft.findOne(owner).lean()

  const d = { step: 1 }
  for (const field of [...DETAIL_FIELDS, 'serviceId', 'branchId', 'date', 'time', 'doctorId']) {
    d[field] = saved ? saved[field] ?? null : null
  }
  const restored = !!saved && ['name', 'nric', 'phone', 'email', 'serviceId', 'branchId', 'date'].some((f) => d[f])

  if (req.session.patientId) {
    const patient = await Patient.findById(req.session.patientId)
    for (const field of DETAIL_FIELDS) d[field] ??= patient ? patient[field] : null
  }

  const [settled, dropped] = await settleDraft(d)
  const passwordSaved = !req.session.patientId && !!req.session.bookingPasswordHash
  const needsPassword = !req.session.patientId && !passwordSaved
  settled.step = Math.min(saved ? saved.step : 1, firstUnfinishedStep(settled, needsPassword))
  return { ...settled, exists: !!saved, passwordSaved, restored, dropped }
}

// POST /api/draft — one draft per owner: created the first time, updated after that.
// Details are tidied like a booking, but kept even when not finished yet.
export async function saveDraft(req, body) {
  await takeOverGuestDraft(req)
  const [clean] = validatePatient(body, false)
  const draft = {
    step: Math.min(Math.max(toId(body.step) || 1, 1), TOTAL_STEPS),
    serviceId: toId(body.serviceId) || null,
    branchId: toId(body.branchId) || null,
    date: /^\d{4}-\d{2}-\d{2}$/.test(body.date || '') ? body.date : null,
    time: /^\d{2}:\d{2}$/.test(body.time || '') ? body.time : null,
    doctorId: toId(body.doctorId) || null,
  }
  for (const field of DETAIL_FIELDS) draft[field] = clean[field] ? clean[field].slice(0, 255) : null
  await BookingDraft.updateOne(draftOwner(req, true), draft, { upsert: true })
}

// After booking, or "Start over"
export async function clearDraft(req) {
  const owners = []
  if (req.session.patientId) owners.push({ patient: req.session.patientId })
  if (req.session.draftKey) owners.push({ sessionKey: req.session.draftKey })
  if (owners.length) await BookingDraft.deleteMany({ $or: owners })
  delete req.session.draftKey
  delete req.session.bookingPasswordHash
}
