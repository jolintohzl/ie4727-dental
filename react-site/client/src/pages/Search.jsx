/* Site search (React version of search.php).
   Searches data/searchIndex.js in the browser instead of on the server. */
import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import SEARCH_INDEX from '../data/searchIndex'

const MAX_RESULTS = 10
const SUGGESTIONS = ['Root canal', 'Braces', 'Implants', 'Opening hours', 'Tampines', 'Children', 'Fees']

// Score every section: a word in the heading counts more than one in the text.
function search(query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  return SEARCH_INDEX
    .map((entry) => {
      const title = entry.title.toLowerCase()
      const text = entry.text.toLowerCase()
      let score = 0
      terms.forEach((term) => {
        if (title.includes(term)) score += 5
        if (text.includes(term)) score += 1
      })
      // every word has to appear somewhere
      const allFound = terms.every((term) => title.includes(term) || text.includes(term))
      return { entry, score: allFound ? score : 0 }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map((r) => r.entry)
}

// About 160 characters of text around the first matching word
function snippet(text, query) {
  const first = query.toLowerCase().split(/\s+/)[0] || ''
  const at = Math.max(0, text.toLowerCase().indexOf(first) - 60)
  return (at > 0 ? '…' : '') + text.slice(at, at + 160) + '…'
}

export default function Search() {
  const [params] = useSearchParams()
  const query = (params.get('q') || '').trim()
  const [typed, setTyped] = useState(query)
  const navigate = useNavigate()
  const results = query ? search(query) : []

  function handleSubmit(event) {
    event.preventDefault()
    if (typed.trim()) navigate('/search?q=' + encodeURIComponent(typed.trim()))
  }

  return (
    <section className="section">
      <div className="container">

        <div className="section-head">
          <h1>{query ? 'Search results' : 'Search'}</h1>
          <p className="section-sub">Find a treatment, a dentist, a clinic or an answer across the whole site.</p>
        </div>

        <div className="page-column">

          <form className="search-form search-page-form" role="search" onSubmit={handleSubmit}>
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <input type="search" placeholder="Search services, doctors, clinics…" aria-label="Search the website"
                   autoComplete="off" maxLength="80" value={typed} onChange={(e) => setTyped(e.target.value)} />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>

          {query && (
            <>
              <p className="result-count" role="status">
                {results.length}{results.length === 1 ? ' result' : ' results'} for “{query}”
              </p>
              <div className="result-list">
                {results.map((r) => (
                  <Link className="result-card" to={r.url} key={r.url + r.title}>
                    <span className="result-page">{r.page}</span>
                    <h3>{r.title}</h3>
                    <p>{snippet(r.text, query)}</p>
                  </Link>
                ))}
              </div>
            </>
          )}

          {(!query || results.length === 0) && (
            <div>
              <p className="empty-note">
                <i className="fa-solid fa-lightbulb"></i>
                <span>{query ? 'Nothing matched “' + query + '”. Try one of these:' : 'Type something above, or try one of these:'}</span>
              </p>
              <div className="search-suggestions">
                {SUGGESTIONS.map((s) => (
                  <Link key={s} to={'/search?q=' + encodeURIComponent(s.toLowerCase())}
                        onClick={() => setTyped(s.toLowerCase())}>{s}</Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  )
}
