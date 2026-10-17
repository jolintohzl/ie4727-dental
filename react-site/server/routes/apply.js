/* POST /api/apply — the job application form (multipart, because of the resume). */
import { Router } from 'express'
import multer from 'multer'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { JobApplication } from '../models/index.js'
import { fail, handle } from '../lib/helpers.js'
import Validators from '../lib/validators.js'

const UPLOAD_DIR = path.join(import.meta.dirname, '..', 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const POSITIONS = ['receptionist', 'implants', 'assistant', 'hygienist', 'general']

// Resumes are kept in memory until every field has passed, then written to disk
// under a random name — never the name the applicant gave it.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

const router = Router()

router.post('/apply', (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err && err.code === 'LIMIT_FILE_SIZE') return fail(res, 422, 'Please fix the highlighted fields.', { resume: 'Resume must be 5 MB or smaller.' })
    next(err)
  })
}, handle(async (req, res) => {
  const values = {
    fullName: String(req.body.fullName || '').trim().replace(/\s+/g, ' '),
    email: String(req.body.email || '').trim().toLowerCase(),
    contact: Validators.cleanPhone(req.body.contact),
    position: String(req.body.position || ''),
    message: String(req.body.message || '').trim(),
    resume: req.file && { name: req.file.originalname, size: req.file.size },
  }
  const errors = Validators.check(values, {
    fullName: Validators.name, email: Validators.email, contact: Validators.phone,
    position: Validators.position, resume: Validators.resume, message: Validators.coverNote,
  })
  if (!errors.position && !POSITIONS.includes(values.position)) errors.position = 'Please choose the position you are applying for.'
  if (Object.keys(errors).length) return fail(res, 422, 'Please fix the highlighted fields.', errors)

  const extension = path.extname(req.file.originalname).toLowerCase()
  const storedName = Date.now() + '-' + crypto.randomBytes(8).toString('hex') + extension
  fs.writeFileSync(path.join(UPLOAD_DIR, storedName), req.file.buffer)

  const saved = await JobApplication.create({
    fullName: values.fullName, email: values.email, phone: values.contact,
    position: values.position, message: values.message,
    resumeName: req.file.originalname, resumeFile: storedName, resumeSize: req.file.size,
  })
  res.status(201).json({ ok: true, reference: 'APP-' + String(saved._id).slice(-6).toUpperCase() })
}))

export default router
