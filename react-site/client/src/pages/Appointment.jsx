/* Converted from appointment.html — edit this file, not the HTML, for the React site. */
import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Appointment() {
    // Which of the four steps is showing. The services, branches, time slots
    // and doctors are still placeholders.
    // TODO (step 2 of the project): load them from Express + MongoDB and
    // validate each step before moving on, like js/appointment.js does.
    const [step, setStep] = useState(1)

    function stepClass(n) {
        if (n === step) return 'is-active'
        return n < step ? 'is-done' : ''
    }

    function handleSubmit(event) {
        event.preventDefault()
        // TODO: POST the booking to the Express API.
        alert('Booking is not connected to the server yet.')
    }

    return (
        <>
        {/*
           ==========================================================
           1. PAGE BANNER
           ==========================================================
        */}
        <section className="page-hero">
            <div className="container">
                <p className="breadcrumb">
                    <Link to="/">Home</Link> <i className="fa-solid fa-chevron-right"></i> <span>Book Appointment</span>
                </p>
            </div>
        </section>

        {/*
           ==========================================================
           2. BOOKING FORM  (steps 1 – 4, one "page" at a time)
           The step state is at the top of this file. The services,
           branches and doctors will come from the Express API.
           ==========================================================
        */}
        <section className="section">
            <div className="container">
                {/* page heading — same style as "About Smile Dental Group" */}
                <div className="section-head">
                    <h1>Book an appointment</h1>
                    <p className="section-sub">
                        Four short steps: your details, the treatment and clinic, a time that suits you, and the dentist you'd like to see.
                    </p>
                </div>

                {/* one centred column for the steps */}
                <div className="page-column booking-body">
                    <div className="alert alert-error" id="bookingLoadError" role="alert" hidden></div>

                    <div className="alert alert-info" id="draftNotice" role="status" hidden>
                        <i className="fa-solid fa-clock-rotate-left"></i> <span><span id="draftNoticeText"></span> <button type="button" className="link-button" id="startOverBtn">Start over</button></span>
                    </div>

                    {/*
                       Progress timeline: 1 ── 2 ── 3 ── 4
                       Only one step of the form shows at a time. stepClass() marks the
                       current step (is-active), finished steps (is-done) and steps that
                       can't be opened yet (is-locked).
                    */}
                    <nav className="booking-steps" id="bookingSteps" aria-label="Booking progress">
                        <ol>
                            <li data-panel="stepDetails" className={stepClass(1)}>
                                <a href="#step-1"><span className="step-dot">1</span><span className="step-label">Your details</span></a>
                            </li>
                            <li data-panel="stepService" className={stepClass(2)}>
                                <a href="#step-2"><span className="step-dot">2</span><span className="step-label">Service & branch</span></a>
                            </li>
                            <li data-panel="stepTime" className={stepClass(3)}>
                                <a href="#step-3"><span className="step-dot">3</span><span className="step-label">Date & time</span></a>
                            </li>
                            <li data-panel="stepDoctor" className={stepClass(4)}>
                                <a href="#step-4"><span className="step-dot">4</span><span className="step-label">Doctor</span></a>
                            </li>
                        </ol>
                    </nav>
                    <form id="bookingForm" noValidate onSubmit={handleSubmit}>
                        {/* ---------- STEP 1: patient details ---------- */}
                        <div className="panel" id="stepDetails" data-step="1" hidden={step !== 1}>
                            <div className="panel-head">
                                <span className="step-number">1</span>
                                <div>
                                    <h2>Fill in patient details</h2>

                                    {/* shown when nobody is logged in */}
                                    <div className="account-switch" id="accountGuest">
                                        <span>New patient? Register below, or <button type="button" className="link-button" id="bookingLoginBtn">Log in</button></span>
                                    </div>

                                    {/* shown when logged in */}
                                    <div className="account-switch" id="accountMember" hidden>
                                        <span>Booking as <strong id="memberName"></strong>.</span> <Link to="/dashboard">Edit details</Link> <span aria-hidden="true">·</span> <button type="button" className="link-button" id="bookingLogoutBtn">Not you? Log out</button>
                                    </div>
                                </div>
                            </div>
                            <div className="form-grid">
                                <div className="form-field">
                                    <label htmlFor="name">Name <span className="req">*</span></label> <input type="text" id="name" name="name" autoComplete="name" placeholder="e.g. Jaslyn Tan" maxLength="100" /> <span className="field-error" id="name-error" hidden></span>
                                </div>
                                <div className="form-field">
                                    <label htmlFor="nric">NRIC/FIN No. <span className="req">*</span></label> <input type="text" id="nric" name="nric" autoComplete="off" placeholder="e.g. S1234567A" maxLength="9" /> <span className="field-error" id="nric-error" hidden></span>
                                </div>
                                <div className="form-field">
                                    <label htmlFor="phone">Contact No. <span className="req">*</span></label> <input type="tel" id="phone" name="phone" autoComplete="tel" placeholder="e.g. 9123 4567" maxLength="15" /> <span className="field-error" id="phone-error" hidden></span>
                                </div>
                                <div className="form-field">
                                    <label htmlFor="email">Email <span className="req">*</span></label> <input type="email" id="email" name="email" autoComplete="email" placeholder="you@example.com" maxLength="255" /> <span className="field-error" id="email-error" hidden></span>
                                </div>

                                {/* password is only needed when creating a new account */}
                                <hr className="form-divider" data-new-account />
                                <div className="form-field" data-new-account>
                                    <label htmlFor="password">Create a password <span className="req">*</span></label>
                                    <div className="password-wrap">
                                        <input type="password" id="password" name="password" autoComplete="new-password" placeholder="At least 8 characters" maxLength="72" /> <button type="button" className="password-toggle" data-toggles="password" aria-label="Show password"><i className="fa-regular fa-eye"></i></button>
                                    </div>
                                    <span className="form-hint" id="password-hint">At least 8 characters, with a letter and a number.</span> <span className="field-error" id="password-error" hidden></span>
                                </div>
                                <div className="form-field" data-new-account>
                                    <label htmlFor="confirmPassword">Confirm password <span className="req">*</span></label>
                                    <div className="password-wrap">
                                        <input type="password" id="confirmPassword" name="confirmPassword" autoComplete="new-password" placeholder="Type it again" maxLength="72" /> <button type="button" className="password-toggle" data-toggles="confirmPassword" aria-label="Show password"> <i className="fa-regular fa-eye"></i> </button>
                                    </div>
                                    <span className="field-error" id="confirmPassword-error" hidden></span>
                                </div>
                            </div>
                        </div>

                        {/* ---------- STEP 2: service + branch ---------- */}
                        <div className="panel" id="stepService" data-step="2" hidden={step !== 2}>
                            <div className="panel-head">
                                <span className="step-number">2</span>
                                <div>
                                    <h2>Choose a service and branch</h2>
                                    <p>Not sure what you need? Pick General Dentistry and we'll take a look.</p>
                                </div>
                            </div>
                            <div className="form-field">
                                <label htmlFor="serviceId">Service <span className="req">*</span></label> <select id="serviceId" name="serviceId"> <option value="">Loading services…</option> </select> <span className="form-hint" id="serviceHint"></span> <span className="field-error" id="serviceId-error" hidden></span>
                            </div>
                            <fieldset className="branch-fieldset">
                                <legend className="form-legend">Branch <span className="req">*</span></legend>
                                <div className="choice-grid" id="branchOptions">
                                    <p className="loading-note">Loading branches…</p>
                                </div>
                                <span className="field-error" id="branchId-error" hidden></span>
                            </fieldset>
                        </div>

                        {/* ---------- STEP 3: date + time ---------- */}
                        <div className="panel" id="stepTime" data-step="3" hidden={step !== 3}>
                            <div className="panel-head">
                                <span className="step-number">3</span>
                                <div>
                                    <h2>Choose a timeslot</h2>
                                    <p>Each appointment is 30 minutes. Crossed-out times are fully booked.</p>
                                </div>
                            </div>
                            <p className="empty-note" id="timeLocked">
                                <i className="fa-regular fa-calendar"></i> Choose a service and a branch first to see available dates.
                            </p>
                            <div className="schedule-grid" id="timePicker" hidden>
                                <div>
                                    <div className="calendar" id="calendar"></div>
                                    <span className="field-error" id="date-error" hidden></span>
                                </div>
                                <div>
                                    <h3 className="slot-heading" id="slotHeading">Pick a date</h3>
                                    <p className="slot-sub" id="slotSub">Available times will appear here.</p>
                                    <div className="slot-grid" id="slotGrid" role="group" aria-labelledby="slotHeading"></div>
                                    <span className="field-error" id="time-error" hidden></span>
                                </div>
                            </div>
                        </div>

                        {/* ---------- STEP 4: doctor ---------- */}
                        <div className="panel" id="stepDoctor" data-step="4" hidden={step !== 4}>
                            <div className="panel-head">
                                <span className="step-number">4</span>
                                <div>
                                    <h2>Select a doctor</h2>
                                    <p>Only dentists who treat your chosen service are listed.</p>
                                </div>
                            </div>
                            <p className="empty-note" id="doctorLocked">
                                <i className="fa-solid fa-user-doctor"></i> Choose a timeslot first to see which dentists are free.
                            </p>
                            <div id="doctorPicker" hidden>
                                <p className="service-label" id="doctorServiceLabel"></p>
                                <div className="doctor-options" id="doctorOptions" role="radiogroup" aria-label="Doctor"></div>
                                <span className="field-error" id="doctorId-error" hidden></span>
                            </div>
                        </div>

                        {/* ---------- SUMMARY (shown on step 4, under the doctors) ---------- */}
                        <div className="panel" id="stepConfirm" data-step="4" hidden={step !== 4}>
                            <div className="panel-head">
                                <span className="step-number"><i className="fa-solid fa-check"></i></span>
                                <div>
                                    <h2>Review and confirm</h2>
                                </div>
                            </div>
                            <dl className="summary-list" id="bookingSummary"></dl>
                            <div className="alert alert-error" id="bookingError" role="alert" hidden></div>
                            <p className="form-note">
                                Need to change something later? You can reschedule or cancel from <Link to="/dashboard">My Account</Link>.
                            </p>
                        </div>

                        {/* ---------- BACK / NEXT ---------- */}
                        <div className="wizard-nav">
                            <button type="button" className="btn btn-outline btn-lg" id="backBtn" hidden={step === 1} onClick={() => setStep(step - 1)}><i className="fa-solid fa-arrow-left"></i> Back</button> <button type="button" className="btn btn-primary btn-lg" id="nextBtn" hidden={step === 4} onClick={() => setStep(step + 1)}> <span id="nextLabel">Next</span> <i className="fa-solid fa-arrow-right"></i> </button> <button type="submit" className="btn btn-primary btn-lg" id="confirmBtn" hidden={step !== 4}> <i className="fa-regular fa-calendar-check"></i> Confirm booking </button>
                        </div>
                        <p className="draft-status" id="draftStatus" role="status" aria-live="polite"></p>
                    </form>

                    {/* filled in after a successful booking */}
                    <div id="bookingDone" hidden></div>
                </div>
            </div>
        </section>

        {/*
           ==========================================================
           FOOTER  (same structure as index.html)
           ==========================================================
        */}
        </>
    )
}
