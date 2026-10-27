/* ==========================================================
   My account — profile form and the patient's appointments
   (cancel / reschedule). Talks to the Express API.
   ========================================================== */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, formatDate, formatTime, toIsoDate } from '../api'
import { useAuth } from '../auth'
import { img } from '../images'
import Validators from '../validators'

const PROFILE_RULES = { name: Validators.name, nric: Validators.nric, phone: Validators.phone, email: Validators.email }
const PROFILE_FIELDS = [
  // field, label, input type, autocomplete, max length
  ['name', 'Name', 'text', 'name', 100],
  ['nric', 'NRIC/FIN No.', 'text', 'off', 9],
  ['phone', 'Contact No.', 'tel', 'tel', 15],
  ['email', 'Email', 'email', 'email', 255],
]

/* ---------- Profile form ---------- */
function ProfileForm({ patient, onSaved }) {
  const [values, setValues] = useState({ name: patient.name, nric: patient.nric, phone: patient.phone, email: patient.email })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')     // '', 'saving' or 'saved'
  const [serverError, setServerError] = useState('')

  function update(field, value) {
    setValues({ ...values, [field]: value })
    setErrors({ ...errors, [field]: '' })
    setStatus('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = Validators.check(values, PROFILE_RULES)
    setErrors(found)
    if (Object.keys(found).length) return

    setStatus('saving')
    setServerError('')
    try {
      const data = await api('profile', { body: values })
      onSaved(data.patient)
      setStatus('saved')
    } catch (error) {
      setServerError(error.message)
      setErrors(error.fields)
      setStatus('')
    }
  }

  return (
    <form className="panel profile-form" noValidate onSubmit={handleSubmit}>
      <div className="panel-head">
        <span className="step-number"><i className="fa-regular fa-id-card"></i></span>
        <div>
          <h2>Edit profile details</h2>
          <p>We use these to confirm your identity and contact you about appointments.</p>
        </div>
      </div>
      {PROFILE_FIELDS.map(([field, label, type, autoComplete, maxLength]) => (
        <div className={'form-field' + (errors[field] ? ' has-error' : '')} key={field}>
          <label htmlFor={field}>{label}</label>
          <input type={type} id={field} autoComplete={autoComplete} maxLength={maxLength}
                 value={values[field]} onChange={(e) => update(field, e.target.value)} />
          {errors[field] && <span className="field-error" role="alert">{errors[field]}</span>}
        </div>
      ))}
      {serverError && <div className="alert alert-error" role="alert"><i className="fa-solid fa-circle-exclamation"></i> <span>{serverError}</span></div>}
      <div className="profile-actions">
        <span className="save-status" role="status">
          {status === 'saved' && <><i className="fa-solid fa-circle-check"></i> Saved</>}
        </span>
        <button type="submit" className="btn btn-primary" disabled={status === 'saving'}>
          {status === 'saving'
            ? <><i className="fa-solid fa-spinner fa-spin"></i> Saving…</>
            : <><i className="fa-regular fa-floppy-disk"></i> Save</>}
        </button>
      </div>
    </form>
  )
}

/* ---------- Reschedule box under one appointment ---------- */
function RescheduleBox({ appt, onDone, onClose }) {
  // The first and last day that can be picked (worked out once)
  const [range] = useState(() => {
    const max = new Date()
    max.setDate(max.getDate() + 60)
    return { min: toIsoDate(new Date()), max: toIsoDate(max) }
  })

  const [date, setDate] = useState(appt.date)
  const [slots, setSlots] = useState(null)
  const [time, setTime] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Load the same doctor's free times for the chosen day
  useEffect(() => {
    if (!date) return
    let current = true
    api(`slots?doctor=${appt.doctorId}&branch=${appt.branchId}&date=${date}`)
      .then((data) => current && setSlots(data.slots))
      .catch((e) => current && setError(e.message))
    return () => { current = false }
  }, [date, appt.doctorId, appt.branchId])

  function pickDate(value) {
    setDate(value)
    setSlots(null)
    setTime('')
    setError('')
  }

  async function confirm() {
    setSaving(true)
    setError('')
    try {
      const data = await api('reschedule', { body: { id: appt.id, date, time } })
      onDone(data.appointment)
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="reschedule-box">
      <div className="form-field">
        <label htmlFor={'newDate-' + appt.id}>New date with {appt.doctor}</label>
        <input type="date" id={'newDate-' + appt.id} min={range.min} max={range.max}
               value={date} onChange={(e) => pickDate(e.target.value)} />
      </div>
      <p className="slot-sub">
        {!date ? 'Choose a date.' : !slots ? 'Loading times…' : slots.length === 0 ? 'No times on this day.' : 'Pick a new time.'}
      </p>
      <div className="slot-grid">
        {(slots || []).map((s) => {
          const isCurrent = date === appt.date && s.time === appt.time
          return (
            <button type="button" key={s.time} disabled={s.freeDoctors.length === 0 || isCurrent}
                    className={'slot' + (s.time === time ? ' is-selected' : '')} onClick={() => setTime(s.time)}>
              {formatTime(s.time)}
            </button>
          )
        })}
      </div>
      {error && <div className="alert alert-error" role="alert"><i className="fa-solid fa-circle-exclamation"></i> <span>{error}</span></div>}
      <div className="appt-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Keep current time</button>
        <button type="button" className="btn btn-primary btn-sm" disabled={!time || saving} onClick={confirm}>Confirm new time</button>
      </div>
    </div>
  )
}

/* ---------- One appointment ---------- */
function AppointmentCard({ appt, onChanged }) {
  const [rescheduling, setRescheduling] = useState(false)

  async function cancel() {
    if (!window.confirm('Cancel your appointment on ' + formatDate(appt.date) + ' at ' + formatTime(appt.time) + '?')) return
    try {
      const data = await api('cancel', { body: { id: appt.id } })
      onChanged(data.appointment, 'Your appointment has been cancelled.')
    } catch (e) {
      window.alert(e.message)
    }
  }

  return (
    <article className={'appt-card' + (appt.upcoming ? '' : ' is-past')}>
      <div className="appt-card-top">
        <img src={img(appt.doctorPhoto)} alt="" />
        <div className="appt-card-main">
          <p className="appt-when">
            {formatDate(appt.date)} – {formatTime(appt.time)}
            {appt.status === 'cancelled'
              ? <span className="status-tag cancelled">Cancelled</span>
              : !appt.upcoming && <span className="status-tag">Completed</span>}
          </p>
          <p className="appt-detail"><strong>{appt.service}</strong> with {appt.doctor}</p>
          <p className="appt-detail"><i className="fa-solid fa-location-dot"></i> {appt.branch} · {appt.address}</p>
          <p className="appt-ref">Ref {appt.reference}</p>
        </div>
      </div>
      {appt.upcoming && (
        <>
          <div className="appt-actions">
            <button type="button" className="btn btn-danger-outline btn-sm" onClick={cancel}>Cancel</button>
            <button type="button" className="btn btn-outline btn-sm" aria-expanded={rescheduling}
                    onClick={() => setRescheduling(!rescheduling)}>
              <i className="fa-regular fa-calendar"></i> Reschedule
            </button>
          </div>
          {rescheduling && (
            <RescheduleBox appt={appt} onClose={() => setRescheduling(false)}
                           onDone={(updated) => { setRescheduling(false); onChanged(updated, 'Your appointment has been moved.') }} />
          )}
        </>
      )}
    </article>
  )
}

export default function Dashboard() {
  const { patient, setPatient } = useAuth()
  const [appointments, setAppointments] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')

  // Load the appointments once we know who is logged in
  const patientId = patient && patient.id
  useEffect(() => {
    if (!patientId) return
    api('appointments')
      .then((data) => setAppointments(data.appointments))
      .catch((e) => setLoadError(e.message))
  }, [patientId])

  // Swap one changed appointment into the list
  function replaceAppointment(updated, message) {
    setAppointments(appointments.map((a) => (a.id === updated.id ? updated : a)))
    setNotice(message)
  }

  const upcoming = (appointments || []).filter((a) => a.upcoming)
  const past = (appointments || []).filter((a) => !a.upcoming).reverse()   // newest first

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="breadcrumb"><Link to="/">Home</Link> <i className="fa-solid fa-chevron-right"></i> <span>My Account</span></p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {/* the heading is for screen readers; the breadcrumb above shows "My Account" */}
          <h1 className="sr-only">My account</h1>

          <div className="page-column">
            {patient === undefined && (
              <p className="loading-note"><i className="fa-solid fa-spinner fa-spin"></i> Loading your account…</p>
            )}

            {/* ---------- Not logged in ---------- */}
            {patient === null && (
              <div className="panel confirmation">
                <div className="confirmation-icon info"><i className="fa-regular fa-user"></i></div>
                <h2>Log in to your account</h2>
                <p>See your upcoming appointments, reschedule them and keep your details up to date.</p>
                <div className="confirmation-actions">
                  <Link to="/login" className="btn btn-primary btn-lg"><i className="fa-solid fa-arrow-right-to-bracket"></i> Log in</Link>
                  <Link to="/appointment" className="btn btn-outline btn-lg">New patient? Book now</Link>
                </div>
              </div>
            )}

            {/* ---------- Logged in ---------- */}
            {patient && (
              <>
                <ProfileForm key={patient.id} patient={patient} onSaved={setPatient} />

                <div className="panel">
                  <div className="panel-head">
                    <span className="step-number"><i className="fa-regular fa-calendar"></i></span>
                    <div>
                      <h2>Upcoming appointments</h2>
                      <p>Need to change a time? Reschedule up until the appointment starts.</p>
                    </div>
                  </div>

                  {notice && <div className="alert alert-success" role="status"><i className="fa-solid fa-circle-check"></i> <span>{notice}</span></div>}
                  {loadError && <div className="alert alert-error"><i className="fa-solid fa-circle-exclamation"></i> <span>{loadError}</span></div>}

                  <div className="appt-list">
                    {!appointments && !loadError && <p className="loading-note"><i className="fa-solid fa-spinner fa-spin"></i> Loading appointments…</p>}
                    {appointments && upcoming.length === 0 && (
                      <p className="empty-note"><i className="fa-regular fa-calendar"></i> You have no upcoming appointments.</p>
                    )}
                    {upcoming.map((a) => <AppointmentCard key={a.id} appt={a} onChanged={replaceAppointment} />)}
                  </div>

                  {past.length > 0 && (
                    <details className="past-toggle">
                      <summary>Past and cancelled appointments ({past.length})</summary>
                      <div className="appt-list">
                        {past.map((a) => <AppointmentCard key={a.id} appt={a} onChanged={replaceAppointment} />)}
                      </div>
                    </details>
                  )}

                  <div className="panel-foot">
                    <Link to="/appointment" className="btn btn-outline"><i className="fa-solid fa-plus"></i> Book another appointment</Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
