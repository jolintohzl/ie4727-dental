/* Converted from about-us.html — edit this file, not the HTML, for the React site. */
import { Link } from 'react-router-dom'
import { img } from '../images'
import ApplyForm from '../components/ApplyForm'

export default function AboutUs() {
    return (
        <>
        {/*
           ==========================================================
           1. PAGE BANNER
           ==========================================================
        */}
        <section className="page-hero">
            <div className="container">
                <p className="breadcrumb"><Link to="/">Home</Link> <i className="fa-solid fa-chevron-right"></i> <span>About Us</span></p>
            </div>
        </section>

        {/*
           ==========================================================
           2. INTRODUCTION / MISSION STATEMENT
           ==========================================================
        */}
        <section className="section">
            <div className="container">
                <div className="section-head">
                    <h2>About Smile Dental Group</h2>
                    <p className="section-sub">
                        Smile Dental Group has cared for families across Singapore for over 15 years. What began as a single treatment room is now a group of clinics offering general, cosmetic and specialist dentistry under one roof.
                    </p>
                </div>

                {/* Our mission + values, reusing the benefit cards from the homepage */}
                <div className="grid grid-3">
                    <article className="benefit-card">
                        <div className="benefit-icon"><i className="fa-solid fa-bullseye"></i></div>
                        <h3>Our Mission</h3>
                        <p>To make good dental care calm, clear and affordable — so nobody puts off the visit they need.</p>
                    </article>
                    <article className="benefit-card">
                        <div className="benefit-icon"><i className="fa-solid fa-eye"></i></div>
                        <h3>Our Vision</h3>
                        <p>To be the practice families recommend first, and come back to for a lifetime.</p>
                    </article>
                    <article className="benefit-card">
                        <div className="benefit-icon"><i className="fa-solid fa-handshake-angle"></i></div>
                        <h3>Our Values</h3>
                        <p>Honest advice, gentle hands, and prices you see before we start.</p>
                    </article>
                </div>
            </div>
        </section>

        {/*
           ==========================================================
           3. MEET THE TEAM
           Each card has the same structure — copy one to add a doctor.
           Full profiles live on doctors.html.
           ==========================================================
        */}
        <section className="section doctors">
            <div className="container">
                <div className="section-head">
                    <p className="section-label">Our team</p>
                    <h2>Meet the people behind your smile</h2>
                    <p className="section-sub">
                        A short introduction below — visit the doctors page for full qualifications and treatment interests.
                    </p>
                </div>
                <div className="grid grid-3">
                    {/* DOCTOR CARD 1 */}
                    <article className="doctor-card">
                        <img src={img('doctor-about-1.jpg')} alt="Dr. Cheong Li Wen" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Cheong Li Wen</h3>
                            <p className="doctor-role">Orthodontics · Braces & Invisalign</p>
                            <p className="doctor-bio">
                                She completed her orthodontic training at NUS and has spent ten years straightening teeth with both fixed braces and clear aligners. She enjoys the cases where a small correction changes how someone smiles in photographs.
                            </p>
                            <ul className="doctor-social">
                                <li><Link to="/doctors" aria-label="View full profile"><i className="fa-regular fa-id-badge"></i></Link></li>
                                <li><a href="#" aria-label="Email"><i className="fa-regular fa-envelope"></i></a></li>
                            </ul>
                        </div>
                    </article>

                    {/* DOCTOR CARD 2 */}
                    <article className="doctor-card">
                        <img src={img('doctor-about-2.jpg')} alt="Dr. Lau Hui Qi" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Lau Hui Qi</h3>
                            <p className="doctor-role">Prosthodontics · Implants & Surgery</p>
                            <p className="doctor-bio">
                                A prosthodontist with a Master's from the University of Melbourne, she has thirteen years of experience placing and restoring implants. She is known for taking the time to get the shade and shape of a front tooth exactly right.
                            </p>
                            <ul className="doctor-social">
                                <li><Link to="/doctors" aria-label="View full profile"><i className="fa-regular fa-id-badge"></i></Link></li>
                                <li><a href="#" aria-label="Email"><i className="fa-regular fa-envelope"></i></a></li>
                            </ul>
                        </div>
                    </article>

                    {/* DOCTOR CARD 3 */}
                    <article className="doctor-card">
                        <img src={img('doctor-general-2.jpg')} alt="Dr. Marcus Lim" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Marcus Lim</h3>
                            <p className="doctor-role">General Dentistry · Preventive Care</p>
                            <p className="doctor-bio">
                                He trained at NUS with further study in minimally invasive dentistry and has twelve years in family practice. He would rather catch a problem at the check-up than drill it out six months later.
                            </p>
                            <ul className="doctor-social">
                                <li>
                                    <Link to="/doctors#general" aria-label="View full profile"><i className="fa-regular fa-id-badge"></i></Link>
                                </li>
                                <li><a href="#" aria-label="Email"><i className="fa-regular fa-envelope"></i></a></li>
                            </ul>
                        </div>
                    </article>
                </div>
                <div className="section-cta">
                    <Link to="/doctors" className="btn btn-outline btn-lg">View Full Doctor Profiles <i className="fa-solid fa-arrow-right"></i></Link>
                </div>
            </div>
        </section>

        {/*
           ==========================================================
           4. CAREERS BAND
           A dark band marks the switch from "about us" to "join us",
           so the two halves of the page never blur into each other.
           ==========================================================
        */}
        <section className="cta-band section-divider" id="join">
            <div className="container">
                <div className="section-head">
                    <p className="section-label light">Careers</p>
                    <h2>Come and work with us</h2>
                    <p className="section-sub">
                        We give our team the time, the equipment and the support to do dentistry properly. Here is what that looks like day to day.
                    </p>
                </div>

                {/* Four reasons to join, on white cards so they lift off the dark band */}
                <div className="grid grid-4">
                    <article className="benefit-card">
                        <div className="benefit-icon"><i className="fa-solid fa-calendar-check"></i></div>
                        <h3>Work-Life Balance</h3>
                        <p>Rosters published well in advance, no on-call rota and leave you can actually take.</p>
                    </article>
                    <article className="benefit-card">
                        <div className="benefit-icon"><i className="fa-solid fa-people-group"></i></div>
                        <h3>A Supportive Culture</h3>
                        <p>Small enough that everyone knows your name, big enough that you are never on your own.</p>
                    </article>
                    <article className="benefit-card">
                        <div className="benefit-icon"><i className="fa-solid fa-sack-dollar"></i></div>
                        <h3>Competitive Package</h3>
                        <p>Salary that reflects your experience, plus full medical and dental cover for your family.</p>
                    </article>
                    <article className="benefit-card">
                        <div className="benefit-icon"><i className="fa-solid fa-arrow-trend-up"></i></div>
                        <h3>Room to Grow</h3>
                        <p>A yearly training budget, paid study leave and mentoring from our specialist clinicians.</p>
                    </article>
                </div>
            </div>
        </section>

        {/*
           ==========================================================
           5. CURRENT JOB OPENINGS
           Each opening is one .job-card — copy a block to add a role,
           or delete one when the position is filled.
           ==========================================================
        */}
        <section className="section why" id="openings">
            <div className="container">
                <div className="section-head">
                    <p className="section-label">Open roles</p>
                    <h2>Current job openings</h2>
                    <p className="section-sub">Last updated Sep 2026.</p>
                </div>
                <div className="job-list">
                    {/* JOB 1 */}
                    <article className="job-card">
                        <div>
                            <h3>Front Desk Receptionist</h3>
                            <ul>
                                <li>Greet Patients</li>
                                <li>Manage appointment bookings</li>
                                <li>Handle billing and insurance paperwork</li>
                            </ul>
                            <ul className="job-meta">
                                <li className="tag"><i className="fa-solid fa-briefcase"></i> Full-time</li>
                                <li className="tag"><i className="fa-solid fa-location-dot"></i> Orchard</li>
                                <li className="tag"><i className="fa-solid fa-clock"></i> 9am-6pm</li>
                                <li className="tag"><i className="fa-solid fa-graduation-cap"></i> 1 year receptionist experience</li>
                            </ul>
                        </div>
                        <a href="#apply" className="btn btn-primary">Apply Now</a>
                    </article>

                    {/* JOB 2 */}
                    <article className="job-card">
                        <div>
                            <h3>Dental Implants Specialist</h3>
                            <ul>
                                <li>Plan and place implants</li>
                                <li>Work alongside our restorative team</li>
                                <li>Mentor junior dentists on surgical techniques</li>
                            </ul>
                            <ul className="job-meta">
                                <li className="tag"><i className="fa-solid fa-briefcase"></i> Full-time / Sessional</li>
                                <li className="tag"><i className="fa-solid fa-location-dot"></i> Orchard & Jurong East</li>
                                <li className="tag"><i className="fa-solid fa-clock"></i> 9am-6pm, 3 days a week</li>
                                <li className="tag"><i className="fa-solid fa-graduation-cap"></i> 5 years implant experience</li>
                            </ul>
                        </div>
                        <a href="#apply" className="btn btn-primary">Apply Now</a>
                    </article>

                    {/* JOB 3 */}
                    <article className="job-card">
                        <div>
                            <h3>Dental Assistant</h3>
                            <ul>
                                <li>Chairside Assisting</li>
                                <li>Sterilisation and instrument preparation</li>
                                <li>Help patients feel at ease before and after treatment</li>
                            </ul>
                            <ul className="job-meta">
                                <li className="tag"><i className="fa-solid fa-briefcase"></i> Full-time</li>
                                <li className="tag"><i className="fa-solid fa-location-dot"></i> Tampines</li>
                                <li className="tag"><i className="fa-solid fa-clock"></i> 10am-8pm</li>
                                <li className="tag"><i className="fa-solid fa-graduation-cap"></i> Training provided</li>
                            </ul>
                        </div>
                        <a href="#apply" className="btn btn-primary">Apply Now</a>
                    </article>

                    {/* JOB 4 */}
                    <article className="job-card">
                        <div>
                            <h3>Dental Hygienist</h3>
                            <ul>
                                <li>Scaling and polishing</li>
                                <li>Periodontal Maintenance</li>
                                <li>Coach patients on home care that fits their routine</li>
                            </ul>
                            <ul className="job-meta">
                                <li className="tag"><i className="fa-solid fa-briefcase"></i> Part-time</li>
                                <li className="tag"><i className="fa-solid fa-location-dot"></i> Jurong East</li>
                                <li className="tag"><i className="fa-solid fa-clock"></i> 9am-1pm, 3 days a week</li>
                                <li className="tag">
                                    <i className="fa-solid fa-graduation-cap"></i> Registered with the Singapore Dental Council
                                </li>
                            </ul>
                        </div>
                        <a href="#apply" className="btn btn-primary">Apply Now</a>
                    </article>
                </div>
            </div>
        </section>

        {/*
           ==========================================================
           6. APPLICATION FORM
           The form lives in components/ApplyForm.jsx. It uses the same
           validation rules as the base site (js/validators.js).
           ==========================================================
        */}
        <section className="section" id="apply">
            <div className="container">
                <div className="section-head">
                    <p className="section-label">Apply</p>
                    <h2>Send us your application</h2>
                    <p className="section-sub">Fill in the form below and attach your CV. We reply to every applicant within 5 working days.</p>
                </div>

                <ApplyForm />
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
