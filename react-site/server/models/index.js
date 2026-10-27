/* ==========================================================
   All MongoDB collections. Branches, services and doctors keep the
   number ids from the base site (1, 2, 3 …) so the React pages can
   use the same values; patients and appointments use MongoDB's own ids.
   ========================================================== */
import mongoose from 'mongoose'

const { Schema, model } = mongoose

export const Branch = model('Branch', new Schema({
  _id: Number,
  slug: String,
  name: String,
  address: String,
  phone: String,
  mapImg: String,
  hours: Object,          // { "1": { open: "09:00", close: "19:00" }, … } — 0 = Sunday
}))

export const Service = model('Service', new Schema({
  _id: Number,
  slug: String,
  name: String,
  summary: String,
  priceFrom: Number,
}))

export const Doctor = model('Doctor', new Schema({
  _id: Number,
  name: String,
  specialty: String,
  role: String,
  bio: String,
  photo: String,
  serviceIds: [Number],   // which services this doctor treats
  // Doctor log-in (/doctor/login). The hash is left out of every query
  // unless asked for with .select('+passwordHash'), so /api/options never sends it.
  email: { type: String, unique: true, sparse: true },
  passwordHash: { type: String, select: false },
}))

export const Patient = model('Patient', new Schema({
  name: { type: String, required: true },
  nric: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true }))

const appointmentSchema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: Number, ref: 'Doctor', required: true },
  service: { type: Number, ref: 'Service', required: true },
  branch: { type: Number, ref: 'Branch', required: true },
  date: { type: String, required: true },   // "2026-10-20"
  time: { type: String, required: true },   // "09:30"
  status: { type: String, enum: ['booked', 'cancelled'], default: 'booked' },
}, { timestamps: true })

// One doctor can't have two *booked* appointments in the same slot.
// (Cancelled ones don't count, so the slot opens up again.)
appointmentSchema.index(
  { doctor: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { status: 'booked' } },
)

export const Appointment = model('Appointment', appointmentSchema)

export const JobApplication = model('JobApplication', new Schema({
  fullName: String,
  email: String,
  phone: String,
  position: String,
  message: String,
  resumeName: String,     // the file name the applicant uploaded
  resumeFile: String,     // the random name it is stored under in uploads/
  resumeSize: Number,
}, { timestamps: true }))
