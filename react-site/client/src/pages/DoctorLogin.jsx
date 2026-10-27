/* Doctor log-in page (React version of doctor-login.php). */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import DoctorHeader from '../components/DoctorHeader'
import Validators from '../validators'

export default function DoctorLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  // Already logged in? Straight to the schedule.
  useEffect(() => {
    api('doctor/session')
      .then((data) => data.loggedIn && navigate('/doctor', { replace: true }))
      .catch(() => {})
  }, [navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    const found = Validators.check({ email, password }, {
      email: Validators.email,
      password: Validators.loginPassword,
    })
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    setMessage('')
    try {
      await api('doctor/login', { body: { email: email.trim(), password } })
      navigate('/doctor')
    } catch (error) {
      setMessage(error.message)
      setErrors(error.fields)
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
    <DoctorHeader />
    <section className="section">
      <div className="container narrow">
        <div className="form-card result-card login-card">

          <div className="modal-icon"><i className="fa-solid fa-user-doctor"></i></div>
          <h1>Doctor Log in</h1>
          <p>Log in to see your schedule and manage your appointments.</p>

          {message && (
            <div className="alert alert-error" role="alert">
              <i className="fa-solid fa-circle-exclamation"></i> <span>{message}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className={'form-field' + (errors.email ? ' has-error' : '')}>
              <label htmlFor="email">Work email</label>
              <input type="email" id="email" name="email" placeholder="name@smiledental.local" maxLength="255"
                     autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className={'form-field' + (errors.password ? ' has-error' : '')}>
              <label htmlFor="password">Password</label>
              <input type="password" id="password" name="password" placeholder="Your password"
                     autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
              {submitting ? <><i className="fa-solid fa-spinner fa-spin"></i> Logging in…</> : 'Log in'}
            </button>
          </form>

          <p className="modal-foot">
            Not a doctor? <Link to="/login">Patient log in</Link>
          </p>

        </div>
      </div>
    </section>
    </>
  )
}
