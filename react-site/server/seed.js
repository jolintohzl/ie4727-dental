/* Loads the clinics, services and doctors into MongoDB.
   Run with:  npm run seed      (safe to run again — it replaces them) */
import mongoose from 'mongoose'
import { connectDb } from './db.js'
import { Branch, Service, Doctor } from './models/index.js'
import { branches, services, doctors } from './seed-data.js'

await connectDb()
await Branch.deleteMany({})
await Service.deleteMany({})
await Doctor.deleteMany({})
await Branch.insertMany(branches)
await Service.insertMany(services)
await Doctor.insertMany(doctors)
console.log(`Seeded ${branches.length} branches, ${services.length} services, ${doctors.length} doctors.`)
await mongoose.disconnect()
