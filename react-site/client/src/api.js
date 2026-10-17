/* Talking to the Express server (react-site/server).

   api('options')                               → GET  /api/options
   api('login', { body: { email, password } })  → POST /api/login (JSON)
   api('apply', { body: formData })             → POST /api/apply (file upload)

   Returns the reply, or throws an ApiError with .message and .fields
   ({ email: 'Already taken' }) so forms can show them under the inputs. */

export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message)
    this.status = status
    this.fields = fields || {}
  }
}

export async function api(path, { body } = {}) {
  const init = { method: 'GET', credentials: 'same-origin', headers: { Accept: 'application/json' } }
  if (body !== undefined) {
    init.method = 'POST'
    if (body instanceof FormData) {
      init.body = body                       // the browser sets the multipart header itself
    } else {
      init.headers['Content-Type'] = 'application/json'
      init.body = JSON.stringify(body)
    }
  }

  let response
  try {
    response = await fetch('/api/' + path, init)
  } catch {
    throw new ApiError('Could not reach the server. Please check your connection and try again.', 0)
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new ApiError('The server is not responding. Is it running? (cd react-site/server && npm run dev)', response.status)
  }
  if (!response.ok || !data.ok) {
    throw new ApiError(data.error || 'Something went wrong. Please try again.', response.status, data.fields)
  }
  return data
}

/* ---------- Formatters (same as the base site's js/site.js) ---------- */
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December']

// "2026-09-16" → Date at local midnight
export function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Date → "2026-09-16"
export function toIsoDate(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')
}

// "2026-09-16" → "Wed, 16 September 2026"
export function formatDate(iso) {
  const d = parseDate(iso)
  return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear()
}

// "13:30" → "1.30pm"
export function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return (h % 12 || 12) + '.' + String(m).padStart(2, '0') + (h >= 12 ? 'pm' : 'am')
}
