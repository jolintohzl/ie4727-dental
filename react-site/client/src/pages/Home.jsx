/* Converted from index.html — edit this file, not the HTML, for the React site. */
import { Link } from 'react-router-dom'
import { img } from '../images'

export default function Home() {
    return (
        <>
        {/*
           ==========================================================
           2. HERO SECTION
           ==========================================================
        */}
        <section className="hero">
            <div className="container hero-inner">
                {/* Left: message + buttons */}
                <div className="hero-copy">
                    <p className="eyebrow"><i className="fa-solid fa-tooth"></i> Trusted by 12,000+ patients</p>
                    <h1>
                        Your Trusted Partner in Dental Care<br />
                    </h1>
                    <p className="hero-text">
                        From routine check-ups to full smile makeovers, our team combines modern technology with genuinely gentle care — so every visit feels calm, clear and comfortable.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/appointment" className="btn btn-primary btn-lg"><i className="fa-regular fa-calendar-check"></i> Book an Appointment</Link> <a href="#services" className="btn btn-outline btn-lg">Explore Our Services <i className="fa-solid fa-arrow-right"></i></a>
                    </div>
                </div>
                <div className="hero-visual"><img src={img('hero-image.jpg')} alt="Happy patient" className="hero-photo" /></div>
            </div>
        </section>

        {/*
           ==========================================================
           3. TRUST / KEY BENEFITS  (4 cards)
           ==========================================================
        */}
        <section className="section benefits" id="about">
            <div className="container">
                <div className="section-head">
                    <p className="section-label">Why patients trust us</p>
                    <h2>Care you can feel good about</h2>
                </div>
                <div className="grid grid-4">
                    <article className="benefit-card">
                        <div className="benefit-icon"><i className="fa-solid fa-user-doctor"></i></div>
                        <h3>Experienced Professionals</h3>
                        <p>Our dentists average 12+ years in practice and train continuously in the latest techniques.</p>
                    </article>
                    <article className="benefit-card">
                        <div className="benefit-icon"><i className="fa-solid fa-heart-pulse"></i></div>
                        <h3>Patient-Centred Care</h3>
                        <p>We explain every option in plain language, so you always decide with full confidence.</p>
                    </article>
                    <article className="benefit-card">
                        <div className="benefit-icon"><i className="fa-solid fa-microscope"></i></div>
                        <h3>Modern Technology</h3>
                        <p>Digital scanning, low-dose imaging and same-day crowns mean faster, more precise treatment.</p>
                    </article>
                    <article className="benefit-card">
                        <div className="benefit-icon"><i className="fa-solid fa-mug-saucer"></i></div>
                        <h3>Comfortable Environment</h3>
                        <p>Calm, quiet clinics designed to put nervous patients at ease from the moment they arrive.</p>
                    </article>
                </div>
            </div>
        </section>

        {/*
           ==========================================================
           4. WHY CHOOSE SMILE DENTAL GROUP
           ==========================================================
        */}
        <section className="section why">
            <div className="container why-inner">
                {/*
                   Left: image placeholder.
                   TO REPLACE: <img src="images/team.jpg" alt="Our team" class="why-photo">
                */}
                <div className="why-visual"><img src={img('dental team.png')} alt="Our Team" className="why-photo" /></div>

                {/* Right: reasons */}
                <div className="why-copy">
                    <p className="section-label">Why choose us</p>
                    <h2>More than a clinic — a long-term dental partner</h2>
                    <p className="lead">
                        Plenty of clinics can clean your teeth. We're built around the parts patients say matter most: honest advice, no rushed appointments and a team that remembers you.
                    </p>
                    <ul className="why-list">
                        <li>
                            <i className="fa-solid fa-check"></i>
                            <div>
                                <h4>One team, your whole family</h4>
                                <p>General, cosmetic and orthodontic care under one roof — no bouncing between clinics.</p>
                            </div>
                        </li>
                        <li>
                            <i className="fa-solid fa-check"></i>
                            <div>
                                <h4>Clear costs before we begin</h4>
                                <p>You receive a written treatment plan with prices upfront. No surprises on the invoice.</p>
                            </div>
                        </li>
                        <li>
                            <i className="fa-solid fa-check"></i>
                            <div>
                                <h4>Gentle with anxious patients</h4>
                                <p>Extra time, numbing options and a stop-anytime signal — dental fear is taken seriously here.</p>
                            </div>
                        </li>
                        <li>
                            <i className="fa-solid fa-check"></i>
                            <div>
                                <h4>Appointments that fit real life</h4>
                                <p>Evening and weekend slots, plus same-day emergency care when something can't wait.</p>
                            </div>
                        </li>
                    </ul>
                    <Link to="/appointment" className="btn btn-primary">Book a Consultation</Link>
                </div>
            </div>
        </section>

        {/*
           ==========================================================
           5. OUR SERVICES  (6 cards + view all)
           ==========================================================
        */}
        <section className="section services" id="services">
            <div className="container">
                <div className="section-head">
                    <p className="section-label">Our services</p>
                    <h2>Complete dental care, all in one place</h2>
                    <p className="section-sub">Whatever your smile needs, there's a specialist here for it.</p>
                </div>
                <div className="grid grid-3">
                    <article className="service-card">
                        <div className="service-icon"><i className="fa-solid fa-teeth"></i></div>
                        <h3>Braces & Invisalign</h3>
                        <p>Straighten your teeth with traditional braces or near-invisible clear aligners.</p>
                        <Link to="/services#braces" className="link-arrow">Learn more <i className="fa-solid fa-arrow-right"></i></Link>
                    </article>
                    <article className="service-card">
                        <div className="service-icon"><i className="fa-solid fa-tooth"></i></div>
                        <h3>General Dentistry</h3>
                        <p>Check-ups, scaling, polishing and fillings to keep problems small — or prevent them.</p>
                        <Link to="/services#general-dentistry" className="link-arrow">Learn more <i className="fa-solid fa-arrow-right"></i></Link>
                    </article>
                    <article className="service-card">
                        <div className="service-icon"><i className="fa-solid fa-syringe"></i></div>
                        <h3>Root Canal</h3>
                        <p>Clears infection from inside a tooth and saves it, when the alternative is taking it out.</p>
                        <Link to="/services#root-canal" className="link-arrow">Learn more <i className="fa-solid fa-arrow-right"></i></Link>
                    </article>
                    <article className="service-card">
                        <div className="service-icon"><i className="fa-solid fa-screwdriver-wrench"></i></div>
                        <h3>Dental Implants</h3>
                        <p>Permanent, natural-looking replacements for missing teeth that restore full bite strength.</p>
                        <Link to="/services#implants" className="link-arrow">Learn more <i className="fa-solid fa-arrow-right"></i></Link>
                    </article>
                    <article className="service-card">
                        <div className="service-icon"><i className="fa-solid fa-crown"></i></div>
                        <h3>Crowns & Bridges</h3>
                        <p>Protect damaged teeth and close gaps with custom-made, colour-matched restorations.</p>
                        <Link to="/services#crowns-bridges" className="link-arrow">Learn more <i className="fa-solid fa-arrow-right"></i></Link>
                    </article>
                    <article className="service-card">
                        <div className="service-icon"><i className="fa-solid fa-teeth-open"></i></div>
                        <h3>Dentures</h3>
                        <p>Comfortable full and partial dentures, fitted and adjusted until they feel right.</p>
                        <Link to="/services#dentures" className="link-arrow">Learn more <i className="fa-solid fa-arrow-right"></i></Link>
                    </article>
                </div>
                <div className="section-cta">
                    <Link to="/services" className="btn btn-outline btn-lg">View All Services <i className="fa-solid fa-arrow-right"></i></Link>
                </div>
            </div>
        </section>

        {/*
           ==========================================================
           6. OUR DOCTORS  (3 cards)
           Each card is identical in structure — copy one to add a doctor.
           ==========================================================
        */}
        <section className="section doctors" id="doctors">
            <div className="container">
                <div className="section-head">
                    <p className="section-label">Our team</p>
                    <h2>Meet the people behind your smile</h2>
                    <p className="section-sub">Experienced, approachable and genuinely happy to answer your questions.</p>
                </div>
                <div className="grid grid-3">
                    {/* DOCTOR CARD 1 */}
                    <article className="doctor-card">
                        <img src={img('doctor-orthodontics-1.jpg')} alt="Dr. Ng Jia Hui" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Ng Jia Hui</h3>
                            <p className="doctor-role">Orthodontics · Clear Aligners</p>
                            <p className="doctor-bio">
                                A certified aligner provider since 2015, she has planned more than a thousand cases and leads our digital treatment planning.
                            </p>
                        </div>
                    </article>

                    {/* DOCTOR CARD 2 */}
                    <article className="doctor-card">
                        <img src={img('doctor-prosthodontics-2.jpg')} alt="Dr. Jonathan Neo" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Jonathan Neo</h3>
                            <p className="doctor-role">Prosthodontics · Dental Implants</p>
                            <p className="doctor-bio">
                                Places and restores implants, with over a decade of surgical experience and advanced training in bone grafting.
                            </p>
                        </div>
                    </article>

                    {/* DOCTOR CARD 3 */}
                    <article className="doctor-card">
                        <img src={img('doctor-general-1.jpg')} alt="Dr. Tan Wei Ling" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Tan Wei Ling</h3>
                            <p className="doctor-role">General Dentistry · Family Dentistry</p>
                            <p className="doctor-bio">
                                Graduated from NUS Dentistry in 2011 and has spent her career in family practice, seeing three generations of some of our families.
                            </p>
                        </div>
                    </article>
                </div>
                <div className="section-cta">
                    <Link to="/doctors" className="btn btn-primary btn-lg">Meet Our Doctors <i className="fa-solid fa-arrow-right"></i></Link>
                </div>
            </div>
        </section>

        {/*
           ==========================================================
           7. PATIENT TESTIMONIALS  (3 cards)
           ==========================================================
        */}
        <section className="section testimonials">
            <div className="container">
                <div className="section-head">
                    <p className="section-label">Patient stories</p>
                    <h2>What our patients say</h2>
                </div>
                <div className="grid grid-3">
                    <article className="testimonial-card">
                        <div className="stars" aria-label="5 out of 5 stars">
                            <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
                        </div>
                        <p className="quote">
                            "I've avoided dentists for years. They talked me through everything before touching anything — I actually booked my next visit on the way out."
                        </p>
                        <div className="patient">
                            <div className="patient-avatar">JL</div>
                            <div><strong>Jasmine Lim</strong> <span>Invisalign patient</span></div>
                        </div>
                    </article>
                    <article className="testimonial-card">
                        <div className="stars" aria-label="5 out of 5 stars">
                            <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
                        </div>
                        <p className="quote">
                            "Two implants, zero drama. The price I was quoted was the price I paid, and the follow-up calls made me feel properly looked after."
                        </p>
                        <div className="patient">
                            <div className="patient-avatar">RK</div>
                            <div><strong>Ryan Koh</strong> <span>Dental implants</span></div>
                        </div>
                    </article>
                    <article className="testimonial-card">
                        <div className="stars" aria-label="4 out of 5 stars">
                            <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-regular fa-star"></i>
                        </div>
                        <p className="quote">
                            "We bring all three kids here. The team is patient with them and somehow makes a check-up feel like a treat rather than a chore."
                        </p>
                        <div className="patient">
                            <div className="patient-avatar">SM</div>
                            <div><strong>Sarah Menon</strong> <span>Family dentistry</span></div>
                        </div>
                    </article>
                </div>
            </div>
        </section>

        {/*
           ==========================================================
           8. APPOINTMENT CTA  (stands out — dark band)
           ==========================================================
        */}
        <section className="cta-band" id="appointment">
            <div className="container cta-inner">
                <div className="cta-copy">
                    <p className="section-label light">Ready when you are</p>
                    <h2>Book your appointment today</h2>
                    <p>
                        Most new patients are seen within 48 hours. Tell us what you need and we'll match you with the right dentist — no obligation, no pressure.
                    </p>
                    <div className="cta-buttons">
                        <Link to="/appointment" className="btn btn-white btn-lg"><i className="fa-regular fa-calendar-check"></i> Book Appointment</Link> <a href="tel:+6561234567" className="btn btn-ghost btn-lg"><i className="fa-solid fa-phone"></i> +65 6123 4567</a>
                    </div>
                </div>
                <ul className="cta-points">
                    <li><i className="fa-solid fa-bolt"></i> Same-day emergency care</li>
                    <li><i className="fa-solid fa-shield-heart"></i> Insurance & CHAS accepted</li>
                    <li><i className="fa-solid fa-clock"></i> Evening & weekend slots</li>
                </ul>
            </div>
        </section>

        {/*
           ==========================================================
           9. LOCATION PREVIEW  (the 3 branch cards, same as locate-us.html)
           ==========================================================
        */}
        <section className="section locate" id="locate">
            <div className="container">
                <div className="section-head">
                    <p className="section-label">Visit us</p>
                    <h2>Find your nearest clinic</h2>
                    <p className="section-sub">Walk-ins are welcome, though booking ahead means you will not wait.</p>
                </div>
                <div className="grid grid-3">
                    {/* ---------- Orchard ---------- */}
                    <article className="location-card">
                        <img src={img('map-orchard.svg')} alt="Map showing the Orchard clinic" className="location-map" />
                        <div className="location-info">
                            <h3>Orchard</h3>
                            <ul className="location-list">
                                <li>
                                    <i className="fa-solid fa-location-dot"></i>
                                    <div>
                                        <h4>Address</h4>
                                        <p>
                                            123 Orchard Road, #05-12<br />Singapore 238888
                                        </p>
                                    </div>
                                </li>
                                <li>
                                    <i className="fa-regular fa-clock"></i>
                                    <div>
                                        <h4>Opening hours</h4>
                                        <p>
                                            Mon – Fri 9.00am – 7.00pm<br />Saturday 9.00am – 2.00pm<br />Sunday & Public Holidays Closed
                                        </p>
                                    </div>
                                </li>
                                <li>
                                    <i className="fa-solid fa-phone"></i>
                                    <div>
                                        <h4>Phone</h4>
                                        <p>+65 6123 4567</p>
                                    </div>
                                </li>
                            </ul>

                            {/* does not link to real location */}
                            <a href="#" className="btn btn-outline btn-block">Get Directions <i className="fa-solid fa-arrow-right"></i></a>
                        </div>
                    </article>

                    {/* ---------- Tampines ---------- */}
                    <article className="location-card">
                        <img src={img('map-tampines.svg')} alt="Map showing the Tampines clinic" className="location-map" />
                        <div className="location-info">
                            <h3>Tampines</h3>
                            <ul className="location-list">
                                <li>
                                    <i className="fa-solid fa-location-dot"></i>
                                    <div>
                                        <h4>Address</h4>
                                        <p>
                                            8 Tampines Central 1, #03-21<br />Singapore 529536
                                        </p>
                                    </div>
                                </li>
                                <li>
                                    <i className="fa-regular fa-clock"></i>
                                    <div>
                                        <h4>Opening hours</h4>
                                        <p>
                                            Mon – Fri 10.00am – 8.00pm<br />Saturday 9.00am – 5.00pm<br />Sunday 9.00am – 1.00pm
                                        </p>
                                    </div>
                                </li>
                                <li>
                                    <i className="fa-solid fa-phone"></i>
                                    <div>
                                        <h4>Phone</h4>
                                        <p>+65 6234 5678</p>
                                    </div>
                                </li>
                            </ul>

                            {/* does not link to real map */}
                            <a href="#" className="btn btn-outline btn-block">Get Directions <i className="fa-solid fa-arrow-right"></i></a>
                        </div>
                    </article>

                    {/* ---------- Jurong East ---------- */}
                    <article className="location-card">
                        <img src={img('map-jurong.svg')} alt="Map showing the Jurong East clinic" className="location-map" />
                        <div className="location-info">
                            <h3>Jurong East</h3>
                            <ul className="location-list">
                                <li>
                                    <i className="fa-solid fa-location-dot"></i>
                                    <div>
                                        <h4>Address</h4>
                                        <p>
                                            50 Jurong Gateway Road, #04-07<br />Singapore 608549
                                        </p>
                                    </div>
                                </li>
                                <li>
                                    <i className="fa-regular fa-clock"></i>
                                    <div>
                                        <h4>Opening hours</h4>
                                        <p>
                                            Mon – Fri 9.00am – 6.30pm<br />Saturday 9.00am – 4.00pm<br />Sunday & Public Holidays Closed
                                        </p>
                                    </div>
                                </li>
                                <li>
                                    <i className="fa-solid fa-phone"></i>
                                    <div>
                                        <h4>Phone</h4>
                                        <p>+65 6345 6789</p>
                                    </div>
                                </li>
                            </ul>

                            {/* does not link to real map */}
                            <a href="#" className="btn btn-outline btn-block">Get Directions <i className="fa-solid fa-arrow-right"></i></a>
                        </div>
                    </article>
                </div>
            </div>
        </section>

        {/*
           ==========================================================
           10. FOOTER
           ==========================================================
        */}
        </>
    )
}
