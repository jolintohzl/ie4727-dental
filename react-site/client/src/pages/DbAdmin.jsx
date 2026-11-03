/* ==========================================================
   A small phpMyAdmin-style view of the MongoDB database:
   collections down the side, and for each one Browse (a page of
   documents, with filter, sort, edit and delete), Structure (the
   fields found and the indexes) and Insert. Talks to
   server/routes/dbadmin.js, which only answers this computer.

   Where we are lives in the address (?coll=patients&tab=browse),
   so a refresh keeps the same page.
   ========================================================== */
import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import './DbAdmin.css'

const PAGE_SIZES = [10, 25, 50, 100]

/* ---------- Showing values ---------- */

// "12.3 KB"
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

const cut = (text, max = 60) => (text.length > max ? text.slice(0, max) + '…' : text)

// One value in a table cell. The server sends ObjectIds and Dates as
// { "$oid": … } and { "$date": … } (Extended JSON).
function Cell({ value }) {
  if (value === undefined) return <span className="dba-missing">—</span>
  if (value === null) return <span className="dba-null">NULL</span>
  if (typeof value === 'object' && '$oid' in value) {
    return <span className="dba-oid" title={value.$oid}>ObjectId(&quot;{value.$oid}&quot;)</span>
  }
  if (typeof value === 'object' && '$date' in value) {
    const d = new Date(value.$date)
    return <span className="dba-date">{isNaN(d) ? String(value.$date) : d.toLocaleString()}</span>
  }
  if (typeof value === 'object') {
    const json = JSON.stringify(value)
    return <code className="dba-json" title={json}>{cut(json)}</code>
  }
  if (typeof value === 'boolean') return <span className="dba-bool">{String(value)}</span>
  if (typeof value === 'number') return <span className="dba-num">{value}</span>
  return <span title={value.length > 60 ? value : undefined}>{cut(value)}</span>
}

// Every field that appears in this page of documents, _id first
function columnsOf(docs) {
  const seen = new Set(['_id'])
  for (const doc of docs) for (const key of Object.keys(doc)) seen.add(key)
  return [...seen]
}

const idText = (id) => (id && typeof id === 'object' && '$oid' in id ? id.$oid : JSON.stringify(id))

/* ---------- Messages along the top (green = done, red = error) ---------- */
function Notice({ notice, onClose }) {
  if (!notice) return null
  return (
    <div className={`dba-notice dba-notice-${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
      <i className={`fa-solid ${notice.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
      <span>{notice.text}</span>
      <button type="button" aria-label="Dismiss" onClick={onClose}>&times;</button>
    </div>
  )
}

/* ---------- Editing one document as JSON ---------- */
function EditBox({ coll, doc, onSaved, onClose }) {
  const { _id, ...rest } = doc
  const [text, setText] = useState(JSON.stringify(rest, null, 2))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    setError('')
    try {
      await api(`dbadmin/${coll}/update`, { body: { id: _id, doc: text } })
      onSaved()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="dba-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dba-dialog" role="dialog" aria-modal="true" aria-labelledby="dba-edit-title">
        <div className="dba-dialog-head">
          <h2 id="dba-edit-title">Edit document</h2>
          <button type="button" aria-label="Close" onClick={onClose}>&times;</button>
        </div>
        <p className="dba-dialog-sub">
          <strong>{coll}</strong> · _id <code>{idText(_id)}</code> (cannot be changed)
        </p>
        <textarea className="dba-code" value={text} onChange={(e) => setText(e.target.value)} spellCheck="false" rows={18} />
        <p className="dba-hint">
          Extended JSON: write an ObjectId as <code>{'{"$oid": "…"}'}</code> and a date as <code>{'{"$date": "2026-11-03T09:00:00Z"}'}</code>.
        </p>
        {error && <p className="dba-error">{error}</p>}
        <div className="dba-dialog-actions">
          <button type="button" className="dba-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="dba-btn dba-btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Browse tab ---------- */
function Browse({ coll, onChange, setNotice }) {
  const [filter, setFilter] = useState('{}')
  const [sort, setSort] = useState('{"_id": 1}')
  const [query, setQuery] = useState({ filter: '{}', sort: '{"_id": 1}' })   // what was last run
  const [limit, setLimit] = useState(25)
  const [skip, setSkip] = useState(0)
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ filter: query.filter, sort: query.sort, skip, limit })
      setPage(await api(`dbadmin/${coll}/docs?${params}`))
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
      setPage({ docs: [], total: 0 })
    }
    setLoading(false)
  }, [coll, query, skip, limit, setNotice])

  useEffect(() => { load() }, [load])

  function run(e) {
    e.preventDefault()
    setNotice(null)
    setSkip(0)
    setQuery({ filter: filter.trim() || '{}', sort: sort.trim() || '{"_id": 1}' })
  }

  async function remove(doc) {
    if (!window.confirm(`Delete the document with _id ${idText(doc._id)}?\nThis cannot be undone.`)) return
    try {
      await api(`dbadmin/${coll}/delete`, { body: { id: doc._id } })
      setNotice({ type: 'success', text: '1 document deleted.' })
      onChange()
      load()
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    }
  }

  const docs = page?.docs || []
  const total = page?.total || 0
  const columns = columnsOf(docs)
  const lastSkip = Math.max(0, Math.floor((total - 1) / limit) * limit)

  return (
    <>
      <form className="dba-query" onSubmit={run}>
        <label>
          <span>Filter</span>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} spellCheck="false" placeholder='{"status": "booked"}' />
        </label>
        <label>
          <span>Sort</span>
          <input value={sort} onChange={(e) => setSort(e.target.value)} spellCheck="false" placeholder='{"_id": -1}' />
        </label>
        <label className="dba-query-small">
          <span>Rows</span>
          <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setSkip(0) }}>
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <button type="submit" className="dba-btn dba-btn-primary">Go</button>
      </form>

      <div className="dba-pager">
        <button type="button" className="dba-btn" disabled={skip === 0} onClick={() => setSkip(0)} aria-label="First page">«</button>
        <button type="button" className="dba-btn" disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - limit))} aria-label="Previous page">‹</button>
        <span className="dba-pager-text">
          {loading ? 'Loading…' : total === 0
            ? 'No documents match.'
            : <>Showing rows {skip + 1} – {skip + docs.length} ({total} total)</>}
        </span>
        <button type="button" className="dba-btn" disabled={skip + limit >= total} onClick={() => setSkip(skip + limit)} aria-label="Next page">›</button>
        <button type="button" className="dba-btn" disabled={skip + limit >= total} onClick={() => setSkip(lastSkip)} aria-label="Last page">»</button>
        <code className="dba-pager-query">db.{coll}.find({query.filter}).sort({query.sort})</code>
      </div>

      {docs.length > 0 && (
        <div className="dba-table-wrap">
          <table className="dba-table">
            <thead>
              <tr>
                <th className="dba-actions-col">Actions</th>
                {columns.map((c) => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={idText(doc._id)}>
                  <td className="dba-actions-col">
                    <button type="button" className="dba-link" onClick={() => setEditing(doc)}>
                      <i className="fa-solid fa-pen"></i> Edit
                    </button>
                    <button type="button" className="dba-link dba-link-danger" onClick={() => remove(doc)}>
                      <i className="fa-solid fa-trash-can"></i> Delete
                    </button>
                  </td>
                  {columns.map((c) => <td key={c}><Cell value={doc[c]} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EditBox
          coll={coll}
          doc={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            setNotice({ type: 'success', text: '1 document updated.' })
            load()
          }}
        />
      )}
    </>
  )
}

/* ---------- Structure tab ---------- */
function Structure({ coll, setNotice }) {
  const [info, setInfo] = useState(null)

  useEffect(() => {
    let current = true
    api(`dbadmin/${coll}/structure`)
      .then((data) => current && setInfo(data))
      .catch((err) => current && setNotice({ type: 'error', text: err.message }))
    return () => { current = false }
  }, [coll, setNotice])

  if (!info) return <p className="dba-muted">Loading…</p>

  return (
    <>
      <h3 className="dba-h3">Fields</h3>
      <p className="dba-muted">
        MongoDB has no fixed columns, so these are the fields found in the first {info.sampled} document{info.sampled === 1 ? '' : 's'}.
      </p>
      <div className="dba-table-wrap">
        <table className="dba-table">
          <thead>
            <tr><th>#</th><th>Field</th><th>Type</th><th>Found in</th></tr>
          </thead>
          <tbody>
            {info.fields.map((f, i) => (
              <tr key={f.path} className={f.path.includes('.') ? 'dba-subfield' : ''}>
                <td className="dba-num">{i + 1}</td>
                <td><strong>{f.path}</strong></td>
                <td>{f.types.map((t) => <span key={t} className="dba-type">{t}</span>)}</td>
                <td className="dba-num">{f.seen} / {info.sampled}</td>
              </tr>
            ))}
            {info.fields.length === 0 && <tr><td colSpan={4} className="dba-muted">This collection is empty.</td></tr>}
          </tbody>
        </table>
      </div>

      <h3 className="dba-h3">Indexes</h3>
      <div className="dba-table-wrap">
        <table className="dba-table">
          <thead>
            <tr><th>Name</th><th>Keys</th><th>Unique</th><th>Sparse</th></tr>
          </thead>
          <tbody>
            {info.indexes.map((ix) => (
              <tr key={ix.name}>
                <td><strong>{ix.name}</strong></td>
                <td><code className="dba-json">{JSON.stringify(ix.key)}</code></td>
                <td>{ix.unique ? 'Yes' : 'No'}</td>
                <td>{ix.sparse ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ---------- Insert tab ---------- */
function Insert({ coll, onInserted, setNotice }) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  // Start from the fields the other documents have, all set to null.
  // Collections that use number ids (branches, services, doctors) need
  // _id filled in by hand; the rest get an ObjectId made for them.
  useEffect(() => {
    let current = true
    api(`dbadmin/${coll}/structure`).then((info) => {
      if (!current) return
      const template = {}
      for (const f of info.fields) {
        if (f.path.includes('.')) continue
        if (f.path === '_id' && !f.types.includes('number')) continue
        template[f.path] = null
      }
      setText(JSON.stringify(template, null, 2))
    }).catch(() => current && setText('{\n  \n}'))
    return () => { current = false }
  }, [coll])

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const reply = await api(`dbadmin/${coll}/insert`, { body: { doc: text } })
      setNotice({ type: 'success', text: `1 document inserted (_id ${idText(reply.id)}).` })
      onInserted()
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    }
    setSaving(false)
  }

  return (
    <form onSubmit={save}>
      <p className="dba-muted">
        Type the new document as JSON. Leave out <code>_id</code> and MongoDB makes one.
        Write an ObjectId as <code>{'{"$oid": "…"}'}</code> and a date as <code>{'{"$date": "2026-11-03T09:00:00Z"}'}</code>.
      </p>
      <textarea className="dba-code" value={text} onChange={(e) => setText(e.target.value)} spellCheck="false" rows={18} />
      <div className="dba-dialog-actions">
        <button type="submit" className="dba-btn dba-btn-primary" disabled={saving}>{saving ? 'Inserting…' : 'Insert'}</button>
      </div>
    </form>
  )
}

/* ---------- The whole page ---------- */
const TABS = [
  { key: 'browse', label: 'Browse', icon: 'fa-table' },
  { key: 'structure', label: 'Structure', icon: 'fa-sitemap' },
  { key: 'insert', label: 'Insert', icon: 'fa-plus' },
]

export default function DbAdmin() {
  const [params, setParams] = useSearchParams()
  const coll = params.get('coll') || ''
  const tab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'browse'

  const [server, setServer] = useState(null)
  const [notice, setNotice] = useState(null)

  const loadCollections = useCallback(() => {
    api('dbadmin/collections')
      .then(setServer)
      .catch((err) => setNotice({ type: 'error', text: err.message }))
  }, [])

  useEffect(() => { loadCollections() }, [loadCollections])
  useEffect(() => { document.title = (coll ? coll + ' · ' : '') + 'Database admin' }, [coll])

  function go(nextColl, nextTab = 'browse') {
    setNotice(null)
    setParams(nextColl ? { coll: nextColl, tab: nextTab } : {})
  }

  const current = server?.collections.find((c) => c.name === coll)

  return (
    <div className="dba">
      <header className="dba-top">
        <span className="dba-logo"><i className="fa-solid fa-leaf"></i> Mongo<strong>Admin</strong></span>
        <nav className="dba-crumbs" aria-label="Where you are">
          <span><i className="fa-solid fa-server"></i> {server?.host || '…'}</span>
          <i className="fa-solid fa-angle-right"></i>
          <button type="button" className="dba-crumb" onClick={() => go('')}>
            <i className="fa-solid fa-database"></i> {server?.database || '…'}
          </button>
          {coll && <>
            <i className="fa-solid fa-angle-right"></i>
            <span><i className="fa-solid fa-table"></i> {coll}</span>
          </>}
        </nav>
        <Link to="/" className="dba-back"><i className="fa-solid fa-arrow-left"></i> Back to site</Link>
      </header>

      <div className="dba-body">
        <aside className="dba-side">
          <button type="button" className={`dba-side-db ${!coll ? 'is-active' : ''}`} onClick={() => go('')}>
            <i className="fa-solid fa-database"></i> {server?.database || '…'}
          </button>
          <ul>
            {server?.collections.map((c) => (
              <li key={c.name}>
                <button type="button" className={c.name === coll ? 'is-active' : ''} onClick={() => go(c.name)}>
                  <i className="fa-solid fa-table"></i>
                  <span className="dba-side-name">{c.name}</span>
                  <span className="dba-side-count">{c.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="dba-main">
          <Notice notice={notice} onClose={() => setNotice(null)} />

          {!coll && server && (
            <>
              <h1 className="dba-h1"><i className="fa-solid fa-database"></i> {server.database}</h1>
              <div className="dba-table-wrap">
                <table className="dba-table">
                  <thead>
                    <tr><th>Collection</th><th>Action</th><th>Documents</th><th>Size</th><th>Indexes</th></tr>
                  </thead>
                  <tbody>
                    {server.collections.map((c) => (
                      <tr key={c.name}>
                        <td><button type="button" className="dba-link" onClick={() => go(c.name)}><strong>{c.name}</strong></button></td>
                        <td className="dba-actions-col">
                          {TABS.map((t) => (
                            <button key={t.key} type="button" className="dba-link" onClick={() => go(c.name, t.key)}>
                              <i className={`fa-solid ${t.icon}`}></i> {t.label}
                            </button>
                          ))}
                        </td>
                        <td className="dba-num">{c.count}</td>
                        <td className="dba-num">{formatSize(c.size)}</td>
                        <td className="dba-num">{c.indexes}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th>{server.collections.length} collections</th>
                      <th></th>
                      <th className="dba-num">{server.collections.reduce((n, c) => n + c.count, 0)}</th>
                      <th className="dba-num">{formatSize(server.collections.reduce((n, c) => n + c.size, 0))}</th>
                      <th></th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}

          {coll && server && !current && <p className="dba-error">There is no collection called &quot;{coll}&quot;.</p>}

          {current && (
            <>
              <nav className="dba-tabs" aria-label="Collection views">
                {TABS.map((t) => (
                  <button key={t.key} type="button" className={t.key === tab ? 'is-active' : ''}
                          aria-current={t.key === tab ? 'page' : undefined}
                          onClick={() => go(coll, t.key)}>
                    <i className={`fa-solid ${t.icon}`}></i> {t.label}
                  </button>
                ))}
              </nav>
              <div className="dba-panel">
                {tab === 'browse' && <Browse key={coll} coll={coll} onChange={loadCollections} setNotice={setNotice} />}
                {tab === 'structure' && <Structure key={coll} coll={coll} setNotice={setNotice} />}
                {tab === 'insert' && (
                  <Insert key={coll} coll={coll} setNotice={setNotice}
                          onInserted={() => { loadCollections(); setParams({ coll, tab: 'browse' }) }} />
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
