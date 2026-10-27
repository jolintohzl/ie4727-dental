/* ==========================================================
   A doctor's own schedule (React version of doctor-dashboard.php):
   upcoming appointments grouped by day, cancel and reschedule,
   and past / cancelled ones folded away. Talks to routes/doctor.js.
   ========================================================== */
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api, formatDate, formatTime, toIsoDate } from '../api'
import DoctorHeader from '../components/DoctorHeader'

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

  // This doctor's free times at the same branch on the chosen day
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
      const data = await api('doctor/reschedule', { body: { id: appt.id, date, time } })
      onDone(data.appointment)
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="reschedule-box">
      <div className="form-field">
        <label htmlFor={'newDate-' + appt.id}>New date at {appt.branch}</label>
        <input type="date" id={'newDate-' + appt.id} min={range.min} max={range.max}
               value={date} onChange={(e) => pickDate(e.target.value)} />
      </div>
      <p className="slot-sub">
        {!date ? 'Choose a date.'
          : !slots ? 'Loading times…'
          : slots.length === 0 ? `The ${appt.branch} clinic has no times left on this day.`
          : slots.every((s) => s.freeDoctors.length === 0) ? 'You are fully booked on this day.'
          : 'Pick a new time.'}
      </p>
      <div className="slot-grid">
        {(slots || []).map((s) => (
          <button type="button" key={s.time} disabled={s.freeDoctors.length === 0}
                  className={'slot' + (s.time === time ? ' is-selected' : '')} onClick={() => setTime(s.time)}>
            {formatTime(s.time)}
          </button>
        ))}
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
  const when = formatDate(appt.date) + ', ' + formatTime(appt.time)

  async function cancel() {
    if (!window.confirm(`Cancel ${appt.patient}'s appointment on ${when}?`)) return
    try {
      const data = await api('doctor/cancel', { body: { id: appt.id } })
      onChanged(data.appointment, `Cancelled ${appt.patient}'s ${appt.service} appointment on ${when}.`)
    } catch (e) {
      window.alert(e.message)
    }
  }

  return (
    <article className={'appt-card' + (appt.upcoming ? '' : ' is-past')}>
      <div className="appt-card-top">
        <span className="step-number"><i className="fa-regular fa-user"></i></span>
        <div className="appt-card-main">
          <p className="appt-when">
            {appt.upcoming ? formatTime(appt.time) : when}
            {appt.status === 'cancelled'
              ? <span className="status-tag cancelled">Cancelled</span>
              : !appt.upcoming && <span className="status-tag">Completed</span>}
          </p>
          <p className="appt-detail"><strong>{appt.patient}</strong> · {appt.service}</p>
          <p className="appt-detail"><i className="fa-solid fa-location-dot"></i> {appt.branch}</p>
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
                           onDone={(updated) => {
                             setRescheduling(false)
                             onChanged(updated, `Moved ${appt.patient}'s appointment to ${formatDate(updated.date)}, ${formatTime(updated.time)}.`)
                           }} />
          )}
        </>
      )}
    </article>
  )
}

export default function DoctorDashboard() {
  const [doctor, setDoctor] = useState(undefined)   // undefined while checking, null when logged out
  const [appointments, setAppointments] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')
  const [today] = useState(() => toIsoDate(new Date()))   // for the "Today ·" label
  const navigate = useNavigate()

  useEffect(() => {
    api('doctor/session')
      .then((data) => setDoctor(data.doctor))
      .catch(() => setDoctor(null))
  }, [])

  const doctorId = doctor && doctor.id
  useEffect(() => {
    if (!doctorId) return
    api('doctor/appointments')
      .then((data) => setAppointments(data.appointments))
      .catch((e) => setLoadError(e.message))
  }, [doctorId])

  async function logout() {
    await api('doctor/logout', { body: {} })
    navigate('/doctor/login')
  }

  // Swap one changed appointment into the list
  function replaceAppointment(updated, message) {
    setAppointments(appointments.map((a) => (a.id === updated.id ? updated : a)))
    setNotice(message)
  }

  if (doctor === null) return <Navigate to="/doctor/login" replace />

  // Upcoming ones grouped by day: [ ["2026-10-28", [appt, appt]], … ] — already in date order
  const byDay = {}
  for (const a of (appointments || []).filter((x) => x.upcoming)) (byDay[a.date] ||= []).push(a)
  const days = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b))
  const past = (appointments || []).filter((a) => !a.upcoming).reverse()   // newest first

  return (
    <>
    <DoctorHeader onLogout={doctor ? logout : null} />
    <section className="section">
      <div className="container">
        <h1 className="sr-only">My schedule</h1>

        <div className="page-column">
          {doctor === undefined && (
            <p className="loading-note"><i className="fa-solid fa-spinner fa-spin"></i> Loading your schedule…</p>
          )}

          {doctor && (
            <div className="panel">
              <div className="panel-head">
                <span className="step-number"><i className="fa-regular fa-calendar"></i></span>
                <div>
                  <h2>Upcoming appointments</h2>
                  <p>Cancel or move an appointment up until it starts.</p>
                </div>
              </div>

              {notice && <div className="alert alert-success" role="status"><i className="fa-solid fa-circle-check"></i> <span>{notice}</span></div>}
              {loadError && <div className="alert alert-error"><i className="fa-solid fa-circle-exclamation"></i> <span>{loadError}</span></div>}

              {!appointments && !loadError && <p className="loading-note"><i className="fa-solid fa-spinner fa-spin"></i> Loading appointments…</p>}
              {appointments && days.length === 0 && (
                <p className="empty-note"><i className="fa-regular fa-calendar"></i> You have no upcoming appointments.</p>
              )}

              {days.map(([day, list]) => (
                <div key={day}>
                  <h3 className="schedule-day">
                    {(day === today ? 'Today · ' : '') + formatDate(day)}
                    <span>{list.length} appointment{list.length === 1 ? '' : 's'}</span>
                  </h3>
                  <div className="appt-list">
                    {list.map((a) => <AppointmentCard key={a.id} appt={a} onChanged={replaceAppointment} />)}
                  </div>
                </div>
              ))}

              {past.length > 0 && (
                <details className="past-toggle">
                  <summary>Past and cancelled appointments ({past.length})</summary>
                  <div className="appt-list">
                    {past.map((a) => <AppointmentCard key={a.id} appt={a} onChanged={replaceAppointment} />)}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
    </>
  )
}
