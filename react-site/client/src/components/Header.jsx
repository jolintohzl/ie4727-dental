/* ==========================================================
   The header shared by every page (same markup as index.html).
   Replaces the small menu script at the bottom of each HTML page.
   ========================================================== */
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { img } from '../images'

/* The search box. Appears twice: in the top row, and in the menu on phones. */
function SearchBox({ className }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function handleSubmit(event) {
    event.preventDefault()
    const q = query.trim()
    if (!q) {
      event.currentTarget.querySelector('input').focus()   // opens the collapsed box
      return
    }
    navigate('/search?q=' + encodeURIComponent(q))
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setQuery('')
      event.currentTarget.blur()
    }
  }

  // the top-row box collapses to an icon, but stays open while it has text
  const open = query.trim() !== ''

  return (
    <form className={className + (open ? ' is-open' : '')} role="search" onSubmit={handleSubmit}>
      <input type="search" name="q" placeholder="Search the site…" aria-label="Search the website"
             autoComplete="off" maxLength="80" value={query}
             onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} />
      <button type="submit" aria-label="Search">
        <i className="fa-solid fa-magnifying-glass"></i>
      </button>
    </form>
  )
}

export default function Header() {
  const { pathname } = useLocation()

  // Each remembers the page it was opened on, so going to
  // another page closes the mobile menu and the dropdown by itself.
  const [menuOpenOn, setMenuOpenOn] = useState(null)
  const [dropdownOpenOn, setDropdownOpenOn] = useState(null)
  const menuOpen = menuOpenOn === pathname
  const dropdownOpen = dropdownOpenOn === pathname
  const setMenuOpen = (open) => setMenuOpenOn(open ? pathname : null)
  const setDropdownOpen = (open) => setDropdownOpenOn(open ? pathname : null)

  // Clicking elsewhere, or pressing Escape, closes the dropdown
  useEffect(() => {
    function onClick(event) {
      if (!event.target.closest('.has-dropdown')) setDropdownOpenOn(null)
    }
    function onKey(event) {
      if (event.key === 'Escape') setDropdownOpenOn(null)
    }
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  function toggleDropdown(event) {
    event.preventDefault()
    // With a mouse, CSS already opens the panel on hover
    if (window.matchMedia('(hover: hover) and (min-width: 769px)').matches) return
    setDropdownOpen(!dropdownOpen)
  }

  return (
    <header className="site-header">

      {/* ---------- TOP ROW: logo + icons + book button ---------- */}
      <div className="nav-top">
        <div className="container nav-top-inner">

          <Link to="/" className="logo">
            <img src={img('dental group.png')} alt="Smile Dental Group logo" className="logo-img" />
            <span className="logo-text">
              <span className="logo-name">Smile Dental Group</span>
              <span className="logo-tagline">Gentle care, lasting smiles</span>
            </span>
          </Link>

          <div className="nav-actions">
            <SearchBox className="nav-search" />

            {/* TODO (step 2): show the patient's initials once logged in via Express */}
            <Link to="/login" className="icon-btn" id="accountBtn" aria-label="Log in" title="Log in">
              <i className="fa-regular fa-user"></i>
            </Link>

            <Link to="/appointment" className="btn btn-primary btn-book">
              <i className="fa-regular fa-calendar-check"></i>
              <span>Book Appointment</span>
            </Link>

            {/* Hamburger — only visible on mobile */}
            <button className="icon-btn menu-toggle" aria-label="Open menu" aria-expanded={menuOpen}
                    onClick={() => setMenuOpen(!menuOpen)}>
              <i className={menuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'}></i>
            </button>
          </div>

        </div>
      </div>

      {/* ---------- BOTTOM ROW: centered menu ---------- */}
      <nav className={'nav-bottom' + (menuOpen ? ' open' : '')} id="mainNav">
        <div className="container">
          {/* phones only: the top row has no room for the search box */}
          <SearchBox className="nav-search nav-search-mobile" />

          <ul className="nav-menu">
            <li><Link to="/about-us">About</Link></li>
            <li><Link to="/doctors">Our Doctors</Link></li>

            <li className={'has-dropdown' + (dropdownOpen ? ' open' : '')}>
              <a href="#" className="dropdown-toggle" onClick={toggleDropdown}>
                Services <i className="fa-solid fa-chevron-down"></i>
              </a>
              <ul className="dropdown">
                <li><Link to="/services">Dental Services</Link></li>
                <li><Link to="/fees-calculator">Fees Calculator</Link></li>
              </ul>
            </li>

            <li><Link to="/locate-us">Locate Us</Link></li>
          </ul>
        </div>
      </nav>

    </header>
  )
}
