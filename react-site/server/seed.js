/* Loads the clinics, services and doctors into MongoDB.
   Run with:  npm run seed      (safe to run again — it replaces them) */
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { connectDb } from './db.js'
import { Branch, Service, Doctor } from './models/index.js'
import { branches, services, doctors, DOCTOR_TEST_PASSWORD } from './seed-data.js'

// Same log-ins as the base site: "Dr. Tan Wei Ling" → tan.wei.ling@smiledental.local
const passwordHash = await bcrypt.hash(DOCTOR_TEST_PASSWORD, 10)
const withLogins = doctors.map((d) => ({
  ...d,
  email: d.name.replace('Dr. ', '').toLowerCase().replaceAll(' ', '.') + '@smiledental.local',
  passwordHash,
}))

await connectDb()
await Branch.deleteMany({})
await Service.deleteMany({})
await Doctor.deleteMany({})
await Branch.insertMany(branches)
await Service.insertMany(services)
await Doctor.insertMany(withLogins)
console.log(`Seeded ${branches.length} branches, ${services.length} services, ${doctors.length} doctors.`)
await mongoose.disconnect()
