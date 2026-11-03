/* A small phpMyAdmin-style admin for the MongoDB database, used by the
   React page at /db-admin (client/src/pages/DbAdmin.jsx).

   GET  /api/dbadmin/collections            every collection, with counts and sizes
   GET  /api/dbadmin/:coll/docs             one page of documents (?filter= &sort= &skip= &limit=)
   GET  /api/dbadmin/:coll/structure        the fields found in the documents, plus the indexes
   POST /api/dbadmin/:coll/insert   { doc }       add a document
   POST /api/dbadmin/:coll/update   { id, doc }   replace a document
   POST /api/dbadmin/:coll/delete   { id }        delete a document

   Documents travel as Extended JSON (EJSON), so ObjectIds and Dates survive
   the trip: { "$oid": "…" } and { "$date": "…" }.

   It can read and change everything, password hashes included, so it only
   answers requests from this computer — never put it on a public server. */
import { Router } from 'express'
import mongoose from 'mongoose'
import { fail, handle } from '../lib/helpers.js'

const { EJSON } = mongoose.mongo.BSON
const router = Router()

const LOCAL = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

router.use('/dbadmin', (req, res, next) => {
  if (!LOCAL.has(req.socket.remoteAddress)) return fail(res, 403, 'The database admin only works from this computer.')
  next()
})

const db = () => mongoose.connection.db

// Documents → plain JSON the browser can show, keeping their types as $oid / $date
const toJson = (value) => EJSON.serialize(value, { relaxed: true })

// Text typed in the browser → a value, or a 422 reply if it is not valid JSON
function parseJson(res, text, what) {
  try {
    return EJSON.parse(String(text || '{}'), { relaxed: true })
  } catch (err) {
    fail(res, 422, `${what} is not valid JSON: ${err.message}`)
    return undefined
  }
}

// The collection named in the URL, but only one that already exists
async function findCollection(req, res) {
  const name = req.params.coll
  const found = await db().listCollections({ name }, { nameOnly: true }).toArray()
  if (!found.length || name.startsWith('system.')) {
    fail(res, 404, `There is no collection called "${name}".`)
    return null
  }
  return db().collection(name)
}

// { _id } from the id the browser sent back (it arrives as EJSON too)
const idFilter = (id) => ({ _id: EJSON.deserialize({ id }, { relaxed: true }).id })

// What type a value is, in the words phpMyAdmin's Structure tab would use
function typeOf(v) {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  if (v instanceof Date) return 'date'
  if (v?._bsontype) return v._bsontype === 'ObjectId' ? 'objectId' : v._bsontype.toLowerCase()
  return typeof v === 'object' ? 'object' : typeof v
}

// GET /api/dbadmin/collections → { database, collections: [{ name, count, size, indexes }] }
router.get('/dbadmin/collections', handle(async (req, res) => {
  const list = await db().listCollections({}, { nameOnly: true }).toArray()
  const names = list.map((c) => c.name).filter((n) => !n.startsWith('system.')).sort()

  const collections = await Promise.all(names.map(async (name) => {
    const [stats] = await db().collection(name).aggregate([{ $collStats: { storageStats: {} } }]).toArray()
    return {
      name,
      count: stats?.storageStats?.count ?? 0,
      size: stats?.storageStats?.size ?? 0,
      indexes: stats?.storageStats?.nindexes ?? 0,
    }
  }))
  res.json({ ok: true, database: db().databaseName, host: mongoose.connection.host, collections })
}))

// GET /api/dbadmin/:coll/docs?filter={"status":"booked"}&sort={"_id":-1}&skip=0&limit=25
router.get('/dbadmin/:coll/docs', handle(async (req, res) => {
  const coll = await findCollection(req, res)
  if (!coll) return
  const filter = parseJson(res, req.query.filter, 'The filter')
  if (filter === undefined) return
  const sort = parseJson(res, req.query.sort || '{"_id":1}', 'The sort')
  if (sort === undefined) return

  const skip = Math.max(0, parseInt(req.query.skip, 10) || 0)
  const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 25))

  try {
    const [docs, total] = await Promise.all([
      coll.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
      coll.countDocuments(filter),
    ])
    res.json({ ok: true, docs: toJson(docs), total, skip, limit })
  } catch (err) {
    // a bad operator such as { "$foo": 1 } — show MongoDB's own message
    fail(res, 422, err.message)
  }
}))

// GET /api/dbadmin/:coll/structure → { fields: [{ path, types, seen }], sampled, indexes }
router.get('/dbadmin/:coll/structure', handle(async (req, res) => {
  const coll = await findCollection(req, res)
  if (!coll) return

  // MongoDB has no fixed columns, so look at up to 200 documents and record
  // every field found, one level of nesting deep (e.g. hours.1.open → hours.1).
  const sample = await coll.find({}).limit(200).toArray()
  const fields = new Map()
  const note = (path, value) => {
    const f = fields.get(path) || { path, types: new Set(), seen: 0 }
    f.types.add(typeOf(value))
    f.seen++
    fields.set(path, f)
  }
  for (const doc of sample) {
    for (const [key, value] of Object.entries(doc)) {
      note(key, value)
      if (typeOf(value) === 'object') {
        for (const [sub, subValue] of Object.entries(value)) note(`${key}.${sub}`, subValue)
      }
    }
  }

  const indexes = await coll.indexes()
  res.json({
    ok: true,
    sampled: sample.length,
    fields: [...fields.values()].map((f) => ({ path: f.path, types: [...f.types], seen: f.seen })),
    // _id is always unique, though its index does not carry the flag
    indexes: indexes.map((i) => ({ name: i.name, key: i.key, unique: !!i.unique || i.name === '_id_', sparse: !!i.sparse })),
  })
}))

// POST /api/dbadmin/:coll/insert  { doc: '{ "name": "…" }' }
router.post('/dbadmin/:coll/insert', handle(async (req, res) => {
  const coll = await findCollection(req, res)
  if (!coll) return
  const doc = parseJson(res, req.body.doc, 'The document')
  if (doc === undefined) return
  if (typeOf(doc) !== 'object') return fail(res, 422, 'The document must be a JSON object { … }.')

  try {
    const result = await coll.insertOne(doc)
    res.json({ ok: true, id: toJson(result.insertedId) })
  } catch (err) {
    fail(res, 422, err.message)   // e.g. a duplicate key on a unique index
  }
}))

// POST /api/dbadmin/:coll/update  { id: { "$oid": "…" }, doc: '{ … }' }
router.post('/dbadmin/:coll/update', handle(async (req, res) => {
  const coll = await findCollection(req, res)
  if (!coll) return
  const doc = parseJson(res, req.body.doc, 'The document')
  if (doc === undefined) return
  if (typeOf(doc) !== 'object') return fail(res, 422, 'The document must be a JSON object { … }.')

  const filter = idFilter(req.body.id)
  delete doc._id   // _id can never change; the original one is kept
  try {
    const result = await coll.replaceOne(filter, doc)
    if (!result.matchedCount) return fail(res, 404, 'That document no longer exists.')
    res.json({ ok: true })
  } catch (err) {
    fail(res, 422, err.message)
  }
}))

// POST /api/dbadmin/:coll/delete  { id: { "$oid": "…" } }
router.post('/dbadmin/:coll/delete', handle(async (req, res) => {
  const coll = await findCollection(req, res)
  if (!coll) return
  const result = await coll.deleteOne(idFilter(req.body.id))
  if (!result.deletedCount) return fail(res, 404, 'That document no longer exists.')
  res.json({ ok: true })
}))

export default router
