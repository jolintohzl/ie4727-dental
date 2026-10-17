/* Converted from dashboard.html — edit this file, not the HTML, for the React site. */
import { Link, useNavigate } from 'react-router-dom'

export default function Dashboard() {
    // For now this always shows the "please log in" view.
    // TODO (step 2 of the project): ask Express who is logged in, then show
    // #dashMember with the profile form and appointments, like js/dashboard.js.
    const navigate = useNavigate()

    return (
        <>
        {/*
           ==========================================================
           1. PAGE BANNER
           ==========================================================
        */}
        <section className="page-hero">
            <div className="container">
                <p className="breadcrumb"><Link to="/">Home</Link> <i className="fa-solid fa-chevron-right"></i> <span>My Account</span></p>
            </div>
        </section>

        {/*
           ==========================================================
           2. ACCOUNT DASHBOARD
           Which of the three blocks shows will come from the Express API.
           ==========================================================
        */}
        <section className="section">
            <div className="container">
                {/* page heading — same style as "About Smile Dental Group" */}
                <div className="section-head">
                    <h1 id="dashTitle">My account</h1>
                    <p className="section-sub" id="dashSub">Your profile and appointments in one place.</p>
                    <button type="button" className="btn btn-outline" id="logoutBtn" hidden><i className="fa-solid fa-arrow-right-from-bracket"></i> Log out</button>
                </div>
                <div className="page-column">
                    <p className="loading-note" id="dashLoading" hidden><i className="fa-solid fa-spinner fa-spin"></i> Loading your account…</p>

                    {/* ---------- Not logged in ---------- */}
                    <div className="panel confirmation" id="dashGuest">
                        <div className="confirmation-icon info"><i className="fa-regular fa-user"></i></div>
                        <h2>Log in to your account</h2>
                        <p>See your upcoming appointments, reschedule them and keep your details up to date.</p>
                        <div className="confirmation-actions">
                            <button type="button" className="btn btn-primary btn-lg" id="dashLoginBtn" onClick={() => navigate('/login')}><i className="fa-solid fa-arrow-right-to-bracket"></i> Log in</button> <Link to="/appointment" className="btn btn-outline btn-lg">New patient? Book now</Link>
                        </div>
                    </div>

                    {/* ---------- Logged in ---------- */}
                    <div id="dashMember" hidden>
                        {/* Profile */}
                        <form className="panel profile-form" id="profileForm" noValidate>
                            <div className="panel-head">
                                <span className="step-number"><i className="fa-regular fa-id-card"></i></span>
                                <div>
                                    <h2>Edit profile details</h2>
                                    <p>We use these to confirm your identity and contact you about appointments.</p>
                                </div>
                            </div>
                            <div className="form-field">
                                <label htmlFor="name">Name</label> <input type="text" id="name" name="name" autoComplete="name" maxLength="100" /> <span className="field-error" id="name-error" hidden></span>
                            </div>
                            <div className="form-field">
                                <label htmlFor="nric">NRIC/FIN No.</label> <input type="text" id="nric" name="nric" autoComplete="off" maxLength="9" /> <span className="field-error" id="nric-error" hidden></span>
                            </div>
                            <div className="form-field">
                                <label htmlFor="phone">Contact No.</label> <input type="tel" id="phone" name="phone" autoComplete="tel" maxLength="15" /> <span className="field-error" id="phone-error" hidden></span>
                            </div>
                            <div className="form-field">
                                <label htmlFor="email">Email</label> <input type="email" id="email" name="email" autoComplete="email" maxLength="255" /> <span className="field-error" id="email-error" hidden></span>
                            </div>
                            <div className="alert alert-error" id="profileError" role="alert" hidden></div>
                            <div className="profile-actions">
                                <span className="save-status" id="saveStatus" role="status"></span> <button type="submit" className="btn btn-primary" id="saveBtn"><i className="fa-regular fa-floppy-disk"></i> Save</button>
                            </div>
                        </form>

                        {/* Appointments */}
                        <div className="panel">
                            <div className="panel-head">
                                <span className="step-number"><i className="fa-regular fa-calendar"></i></span>
                                <div>
                                    <h2>Upcoming appointments</h2>
                                    <p>Need to change a time? Reschedule up until the appointment starts.</p>
                                </div>
                            </div>
                            <div className="alert alert-success" id="apptNotice" role="status" hidden></div>
                            <div className="appt-list" id="upcomingList"></div>
                            <details className="past-toggle" id="pastWrap" hidden>
                                <summary id="pastSummary">Past and cancelled appointments</summary>
                                <div className="appt-list" id="pastList"></div>
                            </details>
                            <div className="panel-foot">
                                <Link to="/appointment" className="btn btn-outline"><i className="fa-solid fa-plus"></i> Book another appointment</Link>
                            </div>
                        </div>
                    </div>
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
