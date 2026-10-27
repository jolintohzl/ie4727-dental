/* Patient log-in page (React version of login.php). */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import Validators from '../validators'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { setPatient } = useAuth()
  const navigate = useNavigate()

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
      const data = await api('login', { body: { email: email.trim(), password } })
      setPatient(data.patient)
      navigate('/dashboard')
    } catch (error) {
      setMessage(error.message)
      setErrors(error.fields)
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section">
      <div className="container narrow">
        <div className="form-card result-card login-card">

          <div className="modal-icon"><i className="fa-regular fa-user"></i></div>
          <h1>Patient Log in</h1>
          <p>Log in to manage your profile and appointments.</p>

          {message && (
            <div className="alert alert-error" role="alert">
              <i className="fa-solid fa-circle-exclamation"></i> <span>{message}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className={'form-field' + (errors.email ? ' has-error' : '')}>
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" placeholder="you@example.com" maxLength="255"
                     autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
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
            New patient? Your account is created when you <Link to="/appointment">book your first appointment</Link>.
          </p>
          <p className="modal-foot">
            Forgotten your password? For your privacy we reset passwords over the
            phone — call <a href="tel:+6561234567">+65 6123 4567</a>.
          </p>
          <p className="modal-foot">
            One of our dentists? <Link to="/doctor/login">Doctor log in</Link>
          </p>

        </div>
      </div>
    </section>
  )
}
