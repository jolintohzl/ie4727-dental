/* Thank-you page after the job application form (React version of apply.php). */
import { Link, useLocation } from 'react-router-dom'

export default function ApplyResult() {
  const { state } = useLocation()
  const name = state && state.name
  const reference = state && state.reference

  return (
    <section className="section">
      <div className="container narrow">
        <div className="form-card result-card">
          <div className="modal-icon"><i className="fa-regular fa-paper-plane"></i></div>
          <h1>{name ? 'Thank you, ' + name + '!' : 'Thank you!'}</h1>
          <p>
            We have received your application and reply to every applicant within
            5 working days.
          </p>
          {reference && <p className="form-note">Your reference: <strong>{reference}</strong></p>}
          <Link to="/" className="btn btn-primary">Back to home</Link>
        </div>
      </div>
    </section>
  )
}
