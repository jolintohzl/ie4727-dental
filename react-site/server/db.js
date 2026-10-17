import mongoose from 'mongoose'

// Local MongoDB (Homebrew: brew services start mongodb-community)
export const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/smile_dental'

export async function connectDb() {
  await mongoose.connect(MONGO_URL)
  console.log('Connected to MongoDB:', MONGO_URL)
}
