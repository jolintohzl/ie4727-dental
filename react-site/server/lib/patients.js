/* Checking and loading patient details (used by log in, booking and profile). */
import Validators from './validators.js'
import { Patient } from '../models/index.js'

// Tidies what was typed and checks it. Returns [clean, errors].
export function validatePatient(body, withPassword) {
  const clean = {
    name: String(body.name || '').trim().replace(/\s+/g, ' '),
    nric: String(body.nric || '').trim().toUpperCase(),
    phone: Validators.cleanPhone(body.phone),
    email: String(body.email || '').trim().toLowerCase(),
  }
  const rules = { name: Validators.name, nric: Validators.nric, phone: Validators.phone, email: Validators.email }
  if (withPassword) {
    clean.password = String(body.password || '')
    rules.password = Validators.newPassword
  }
  return [clean, Validators.check(clean, rules)]
}

// Email and NRIC must not belong to another account
export async function uniquenessErrors(clean, exceptId = null) {
  const errors = {}
  const other = (field) => Patient.exists({ [field]: clean[field], ...(exceptId && { _id: { $ne: exceptId } }) })
  if (await other('email')) errors.email = 'An account with this email already exists.'
  if (await other('nric')) errors.nric = 'An account with this NRIC/FIN already exists.'
  return errors
}

// Step 1 of booking. Guests are creating an account; a logged-in patient may be
// editing their own details, so their own email and NRIC don't count as taken.
// Returns [clean, errors].
export async function bookingDetails(body, patientId, withPassword) {
  const [clean, errors] = validatePatient(body, withPassword)
  for (const [field, message] of Object.entries(await uniquenessErrors(clean, patientId))) {
    errors[field] ??= message
  }
  if (!patientId && errors.email && errors.email.includes('already exists')) errors.email += ' Log in to book with it.'
  return [clean, errors]
}

// What the browser is allowed to see — never the password hash
export function publicPatient(p) {
  return p && { id: String(p._id), name: p.name, nric: p.nric, phone: p.phone, email: p.email }
}
