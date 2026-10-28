/* ==========================================================
   Book an appointment — four steps, one at a time:
     1. patient details (filled in from the account if logged in)
     2. service + branch
     3. date + time
     4. doctor, then review and confirm
   Talks to the Express API: options, slots and book.
   ========================================================== */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, formatDate, formatTime, parseDate, toIsoDate, MONTHS } from '../api'
import { useAuth } from '../auth'
import { img } from '../images'
import Validators from '../validators'

const STEPS = ['Your details', 'Service & branch', 'Date & time', 'Doctor']
const DETAIL_FIELDS = ['name', 'nric', 'phone', 'email', 'password', 'confirmPassword']
const PROFILE_RULES = {
  name: Validators.name,
  nric: Validators.nric,
  phone: Validators.phone,
  email: Validators.email,
}
const DETAIL_RULES = {
  ...PROFILE_RULES,
  password: Validators.newPassword,
  confirmPassword: (value, all) => Validators.confirmPassword(value, all.password),
}

// The step-1 form, empty or filled in from the logged-in patient
function detailsFrom(patient) {
  return {
    name: patient ? patient.name : '',
    nric: patient ? patient.nric : '',
    phone: patient ? patient.phone : '',
    email: patient ? patient.email : '',
    password: '',
    confirmPassword: '',
  }
}

// Which step a field belongs to, so a server error can send the user back there
function stepOf(field) {
  if (DETAIL_FIELDS.includes(field)) return 1
  if (field === 'serviceId' || field === 'branchId') return 2
  if (field === 'date' || field === 'time') return 3
  return 4
}

/* One labelled input with its error message */
function Field({ id, label, error, hint, children }) {
  return (
    <div className={'form-field' + (error ? ' has-error' : '')}>
      <label htmlFor={id}>{label} <span className="req">*</span></label>
      {children}
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  )
}

/* Month calendar. Days outside the booking window, or when the branch is closed, are disabled. */
function Calendar({ options, branch, value, onPick }) {
  const today = parseDate(options.today)
  const last = new Date(today)
  last.setDate(last.getDate() + options.bookingWindowDays)

  const start = value ? parseDate(value) : today
  const [month, setMonth] = useState(new Date(start.getFullYear(), start.getMonth(), 1))
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const canGoBack = month > new Date(today.getFullYear(), today.getMonth(), 1)
  const canGoForward = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= last

  function move(step) {
    setMonth(new Date(month.getFullYear(), month.getMonth() + step, 1))
  }

  const cells = []
  for (let i = 0; i < month.getDay(); i++) cells.push(<span key={'blank' + i}></span>)
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    const iso = toIsoDate(date)
    const closed = !branch.hours[date.getDay()]
    let classes = 'calendar-day'
    if (iso === options.today) classes += ' is-today'
    if (iso === value) classes += ' is-selected'
    cells.push(
      <button type="button" key={iso} className={classes} onClick={() => onPick(iso)}
              disabled={date < today || date > last || closed}
              aria-label={formatDate(iso) + (closed ? ' (clinic closed)' : '')} aria-pressed={iso === value}>
        {day}
      </button>,
    )
  }

  return (
    <>
      <div className="calendar-head">
        <button type="button" className="calendar-nav" aria-label="Previous month" disabled={!canGoBack} onClick={() => move(-1)}>
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <strong>{MONTHS[month.getMonth()]} {month.getFullYear()}</strong>
        <button type="button" className="calendar-nav" aria-label="Next month" disabled={!canGoForward} onClick={() => move(1)}>
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>
      <div className="calendar-grid">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span className="calendar-dow" aria-hidden="true" key={i}>{d}</span>)}
        {cells}
      </div>
      <p className="calendar-legend">Greyed-out days are in the past, too far ahead, or the branch is closed.</p>
    </>
  )
}

export default function Appointment() {
  const { patient, setPatient, logout } = useAuth()

  const [options, setOptions] = useState(null)   // services, branches, doctors from the server
  const [loadError, setLoadError] = useState('')
  const [step, setStep] = useState(1)
  const [details, setDetails] = useState(() => detailsFrom(patient))
  const [detailsFor, setDetailsFor] = useState(patient ? patient.id : null)
  const [choice, setChoice] = useState({ serviceId: '', branchId: '', date: '', time: '', doctorId: '' })
  const [slots, setSlots] = useState(null)
  const [slotsVersion, setSlotsVersion] = useState(0)   // bump to load the times again
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(null)          // the reply after a successful booking

  useEffect(() => {
    api('options').then(setOptions).catch((e) => setLoadError(e.message))
  }, [])

  // Load the free times whenever the service, branch or date changes
  useEffect(() => {
    if (!choice.serviceId || !choice.branchId || !choice.date) return
    let current = true
    api(`slots?service=${choice.serviceId}&branch=${choice.branchId}&date=${choice.date}`)
      .then((data) => current && setSlots(data.slots))
      .catch((e) => current && setErrors({ date: e.message }))
    return () => { current = false }
  }, [choice.serviceId, choice.branchId, choice.date, slotsVersion])

  const loggedIn = !!patient

  // Someone logged in or out (e.g. from the navbar): start the form again from their account
  const patientId = patient ? patient.id : null
  if (detailsFor !== patientId) {
    setDetailsFor(patientId)
    setDetails(detailsFrom(patient))
    setErrors({})
  }

  const service = options && options.services.find((s) => s.id === Number(choice.serviceId))
  const branch = options && options.branches.find((b) => b.id === Number(choice.branchId))
  const doctor = options && options.doctors.find((d) => d.id === Number(choice.doctorId))
  const slot = slots && slots.find((s) => s.time === choice.time)

  function updateDetail(field, value) {
    setDetails({ ...details, [field]: value })
    setErrors({ ...errors, [field]: '' })
  }

  // Changing an earlier choice clears the later ones that depend on it
  function choose(field, value) {
    const next = { ...choice, [field]: value }
    if (field === 'serviceId' || field === 'branchId' || field === 'date') {
      if (field !== 'date') next.date = ''
      next.time = ''
      next.doctorId = ''
      setSlots(null)
    }
    if (field === 'time') next.doctorId = ''
    setChoice(next)
    setErrors({ ...errors, [field]: '' })
    setServerError('')
  }

  // Returns the problems with one step ({} when it is fine)
  function stepErrors(n) {
    if (n === 1) return Validators.check(details, loggedIn ? PROFILE_RULES : DETAIL_RULES)
    if (n === 2) {
      const e = {}
      if (!choice.serviceId) e.serviceId = 'Please choose a service.'
      if (!choice.branchId) e.branchId = 'Please choose a branch.'
      return e
    }
    if (n === 3) {
      if (!choice.date) return { date: 'Please choose a date.' }
      if (!choice.time) return { time: 'Please choose a time.' }
      return {}
    }
    return choice.doctorId ? {} : { doctorId: 'Please choose a doctor.' }
  }

  function next() {
    const found = stepErrors(step)
    setErrors(found)
    if (Object.keys(found).length === 0) setStep(step + 1)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = stepErrors(4)
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    setServerError('')
    try {
      const { name, nric, phone, email, password } = details
      const body = { ...choice, name, nric, phone, email, ...(loggedIn ? {} : { password }) }
      const data = await api('book', { body })
      setPatient(data.patient)   // the new account, or the edited details
      setDone(data)
      window.scrollTo(0, 0)
    } catch (error) {
      setServerError(error.message)
      setErrors(error.fields)
      const fields = Object.keys(error.fields)
      if (fields.length) setStep(Math.min(...fields.map(stepOf)))
      // the time was just taken: clear it and load the times again
      if (error.fields.time) {
        setChoice({ ...choice, time: '', doctorId: '' })
        setSlots(null)
        setSlotsVersion(slotsVersion + 1)
      }
    } finally {
      setSubmitting(false)
    }
  }

  function stepClass(n) {
    if (n === step) return 'is-active'
    return n < step ? 'is-done' : 'is-locked'
  }

  const summary = [
    ['fa-solid fa-tooth', 'Service', service && service.name],
    ['fa-solid fa-location-dot', 'Branch', branch && branch.name],
    ['fa-regular fa-calendar', 'Date', choice.date && formatDate(choice.date)],
    ['fa-regular fa-clock', 'Time', choice.time && formatTime(choice.time)],
    ['fa-solid fa-user-doctor', 'Doctor', doctor && doctor.name],
  ]

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="breadcrumb">
            <Link to="/">Home</Link> <i className="fa-solid fa-chevron-right"></i> <span>Book Appointment</span>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h1>Book an appointment</h1>
            <p className="section-sub">
              Four short steps: your details, the treatment and clinic, a time that suits you, and the dentist you'd like to see.
            </p>
          </div>

          <div className="page-column booking-body">
            {loadError && <div className="alert alert-error" role="alert"><i className="fa-solid fa-circle-exclamation"></i> <span>{loadError}</span></div>}

            {/* ---------- After booking: the confirmation ---------- */}
            {done && (
              <div className="panel confirmation">
                <div className="confirmation-icon"><i className="fa-solid fa-check"></i></div>
                <h2>You're booked in!</h2>
                <span className="reference">Ref: {done.appointment.reference}</span>
                {done.newAccount && (
                  <div className="alert alert-success">
                    <i className="fa-solid fa-user-check"></i>
                    <span>Your account has been created. You can manage this appointment from My Account.</span>
                  </div>
                )}
                <dl className="summary-list">
                  {summary.map(([icon, label, value]) => (
                    <div key={label}><dt><i className={icon} aria-hidden="true"></i>{label}</dt><dd>{value}</dd></div>
                  ))}
                </dl>
                <div className="confirmation-actions">
                  <Link to="/dashboard" className="btn btn-primary btn-lg"><i className="fa-regular fa-calendar-check"></i> View my appointments</Link>
                  <Link to="/" className="btn btn-outline btn-lg">Back to home</Link>
                </div>
              </div>
            )}

            {!done && options && (
              <>
                {/* Progress timeline: 1 ── 2 ── 3 ── 4 */}
                <nav className="booking-steps" aria-label="Booking progress">
                  <ol>
                    {STEPS.map((label, i) => (
                      <li key={label} className={stepClass(i + 1)}>
                        <a href={'#step-' + (i + 1)} onClick={(e) => { e.preventDefault(); if (i + 1 < step) setStep(i + 1) }}>
                          <span className="step-dot">{i + 1 < step ? <i className="fa-solid fa-check"></i> : i + 1}</span>
                          <span className="step-label">{label}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>

                <form noValidate onSubmit={handleSubmit}>

                  {/* ---------- STEP 1: patient details ---------- */}
                  <div className="panel" hidden={step !== 1}>
                    <div className="panel-head">
                      <span className="step-number">1</span>
                      <div>
                        <h2>Fill in patient details</h2>
                        {loggedIn ? (
                          <>
                            <div className="account-switch">
                              <span>Booking as <strong>{patient.name}</strong>.</span>{' '}
                              <button type="button" className="link-button"
                                      onClick={() => window.confirm('Are you sure you want to log out?') && logout()}>Not you? Log out</button>
                            </div>
                            <p>Changes to personal details here will also update your profile.</p>
                          </>
                        ) : (
                          <div className="account-switch">
                            <span>New patient? Register below, or <Link to="/login">Log in</Link></span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-grid">
                        <Field id="name" label="Name" error={errors.name}>
                          <input type="text" id="name" autoComplete="name" placeholder="e.g. Jaslyn Tan" maxLength="100"
                                 value={details.name} onChange={(e) => updateDetail('name', e.target.value)} />
                        </Field>
                        <Field id="nric" label="NRIC/FIN No." error={errors.nric}>
                          <input type="text" id="nric" autoComplete="off" placeholder="e.g. S1234567A" maxLength="9"
                                 value={details.nric} onChange={(e) => updateDetail('nric', e.target.value)} />
                        </Field>
                        <Field id="phone" label="Contact No." error={errors.phone}>
                          <input type="tel" id="phone" autoComplete="tel" placeholder="e.g. 9123 4567" maxLength="15"
                                 value={details.phone} onChange={(e) => updateDetail('phone', e.target.value)} />
                        </Field>
                        <Field id="email" label="Email" error={errors.email}>
                          <input type="email" id="email" autoComplete="email" placeholder="you@example.com" maxLength="255"
                                 value={details.email} onChange={(e) => updateDetail('email', e.target.value)} />
                        </Field>
                        {/* the password is only needed when creating a new account */}
                        {!loggedIn && (
                          <>
                            <hr className="form-divider" />
                            <Field id="password" label="Create a password" error={errors.password} hint="At least 8 characters, with a letter and a number.">
                              <input type="password" id="password" autoComplete="new-password" placeholder="At least 8 characters" maxLength="72"
                                     value={details.password} onChange={(e) => updateDetail('password', e.target.value)} />
                            </Field>
                            <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword}>
                              <input type="password" id="confirmPassword" autoComplete="new-password" placeholder="Type it again" maxLength="72"
                                     value={details.confirmPassword} onChange={(e) => updateDetail('confirmPassword', e.target.value)} />
                            </Field>
                          </>
                        )}
                    </div>
                  </div>

                  {/* ---------- STEP 2: service + branch ---------- */}
                  <div className="panel" hidden={step !== 2}>
                    <div className="panel-head">
                      <span className="step-number">2</span>
                      <div>
                        <h2>Choose a service and branch</h2>
                        <p>Not sure what you need? Pick General Dentistry and we'll take a look.</p>
                      </div>
                    </div>
                    <Field id="serviceId" label="Service" error={errors.serviceId} hint={service && service.summary}>
                      <select id="serviceId" value={choice.serviceId} onChange={(e) => choose('serviceId', e.target.value)}>
                        <option value="">Select a service</option>
                        {options.services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </Field>
                    <fieldset className="branch-fieldset">
                      <legend className="form-legend">Branch <span className="req">*</span></legend>
                      <div className="choice-grid">
                        {options.branches.map((b) => (
                          <label className="choice-card" key={b.id}>
                            <input type="radio" name="branchId" value={b.id} checked={Number(choice.branchId) === b.id}
                                   onChange={() => choose('branchId', b.id)} />
                            <span className="choice-body">
                              <img src={img(b.mapImg)} alt="" />
                              <span className="choice-text">
                                <span className="choice-title">{b.name}<span className="choice-check"><i className="fa-solid fa-check"></i></span></span>
                                <span className="choice-line">{b.address}</span>
                                <span className="choice-line">
                                  <i className="fa-regular fa-clock"></i> {b.hours[0] ? 'Open 7 days' : 'Mon – Sat · closed Sundays'}
                                </span>
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                      {errors.branchId && <span className="field-error" role="alert">{errors.branchId}</span>}
                    </fieldset>
                  </div>

                  {/* ---------- STEP 3: date + time ---------- */}
                  <div className="panel" hidden={step !== 3}>
                    <div className="panel-head">
                      <span className="step-number">3</span>
                      <div>
                        <h2>Choose a timeslot</h2>
                        <p>Each appointment is 30 minutes. Crossed-out times are fully booked.</p>
                      </div>
                    </div>
                    {branch && (
                      <div className="schedule-grid">
                        <div>
                          <div className="calendar">
                            <Calendar options={options} branch={branch} value={choice.date} onPick={(iso) => choose('date', iso)} />
                          </div>
                          {errors.date && <span className="field-error" role="alert">{errors.date}</span>}
                        </div>
                        <div>
                          <h3 className="slot-heading">{choice.date ? formatDate(choice.date) : 'Pick a date'}</h3>
                          <p className="slot-sub">
                            {!choice.date ? 'Available times will appear here.'
                              : !slots ? 'Loading times…'
                              : slots.length === 0 ? 'No times left on this day. Please pick another date.'
                              : 'Pick a time.'}
                          </p>
                          <div className="slot-grid" role="group">
                            {(slots || []).map((s) => (
                              <button type="button" key={s.time} disabled={s.freeDoctors.length === 0}
                                      className={'slot' + (s.time === choice.time ? ' is-selected' : '')}
                                      aria-pressed={s.time === choice.time} onClick={() => choose('time', s.time)}>
                                {formatTime(s.time)}
                              </button>
                            ))}
                          </div>
                          {errors.time && <span className="field-error" role="alert">{errors.time}</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ---------- STEP 4: doctor + summary ---------- */}
                  <div className="panel" hidden={step !== 4}>
                    <div className="panel-head">
                      <span className="step-number">4</span>
                      <div>
                        <h2>Select a doctor</h2>
                        <p>Only dentists who treat your chosen service are listed.</p>
                      </div>
                    </div>
                    {service && slot && (
                      <>
                        <p className="service-label"><i className="fa-solid fa-tooth"></i> Service: {service.name}</p>
                        <div className="doctor-options" role="radiogroup" aria-label="Doctor">
                          {options.doctors.filter((d) => d.serviceIds.includes(service.id)).map((d) => {
                            const free = slot.freeDoctors.includes(d.id)
                            return (
                              <label className={'choice-card' + (free ? '' : ' is-unavailable')} key={d.id}>
                                <input type="radio" name="doctorId" value={d.id} disabled={!free}
                                       checked={Number(choice.doctorId) === d.id} onChange={() => choose('doctorId', d.id)} />
                                <span className="choice-body">
                                  <img src={img(d.photo)} alt="" />
                                  <span className="choice-text">
                                    <span className="choice-title">{d.name}<span className="choice-check"><i className="fa-solid fa-check"></i></span></span>
                                    <span className="choice-line doctor-role">{d.role}</span>
                                    <span className="choice-line">{d.bio}</span>
                                    {!free && <span className="unavailable-tag">Booked at this time</span>}
                                  </span>
                                </span>
                              </label>
                            )
                          })}
                        </div>
                        {errors.doctorId && <span className="field-error" role="alert">{errors.doctorId}</span>}
                      </>
                    )}
                  </div>

                  <div className="panel" hidden={step !== 4}>
                    <div className="panel-head">
                      <span className="step-number"><i className="fa-solid fa-check"></i></span>
                      <div><h2>Review and confirm</h2></div>
                    </div>
                    <dl className="summary-list">
                      {summary.map(([icon, label, value]) => (
                        <div key={label}>
                          <dt><i className={icon} aria-hidden="true"></i>{label}</dt>
                          <dd className={value ? '' : 'is-missing'}>{value || 'Not chosen yet'}</dd>
                        </div>
                      ))}
                    </dl>
                    {serverError && <div className="alert alert-error" role="alert"><i className="fa-solid fa-circle-exclamation"></i> <span>{serverError}</span></div>}
                    <p className="form-note">
                      Need to change something later? You can reschedule or cancel from <Link to="/dashboard">My Account</Link>.
                    </p>
                  </div>

                  {/* ---------- BACK / NEXT ---------- */}
                  <div className="wizard-nav">
                    <button type="button" className="btn btn-outline btn-lg" hidden={step === 1} onClick={() => setStep(step - 1)}>
                      <i className="fa-solid fa-arrow-left"></i> Back
                    </button>
                    <button type="button" className="btn btn-primary btn-lg" hidden={step === 4} onClick={next}>
                      Next <i className="fa-solid fa-arrow-right"></i>
                    </button>
                    <button type="submit" className="btn btn-primary btn-lg" hidden={step !== 4} disabled={submitting}>
                      {submitting
                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Booking…</>
                        : <><i className="fa-regular fa-calendar-check"></i> Confirm booking</>}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
