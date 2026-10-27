/* The small header on the doctor pages (same as doctor-login.php and
   doctor-dashboard.php): just the logo, plus Log out once logged in. */
import { Link } from 'react-router-dom'
import { img } from '../images'

export default function DoctorHeader({ onLogout }) {
  return (
    <header className="site-header">
      <div className="nav-top">
        <div className="container nav-top-inner">
          <Link to="/" className="logo">
            <img src={img('dental group.png')} alt="Smile Dental Group logo" className="logo-img" />
            <span className="logo-text">
              <span className="logo-name">Smile Dental Group</span>
              <span className="logo-tagline">Doctor&apos;s area</span>
            </span>
          </Link>

          {onLogout && (
            <div className="nav-actions">
              <button type="button" className="btn btn-outline btn-logout" aria-label="Log out" onClick={onLogout}>
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
