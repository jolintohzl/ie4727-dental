/* Converted from doctors.html — edit this file, not the HTML, for the React site. */
import { Link } from 'react-router-dom'
import { img } from '../images'

export default function Doctors() {
    return (
        <>
        {/*
           ==========================================================
           1. PAGE BANNER
           ==========================================================
        */}
        <section className="page-hero">
            <div className="container">
                <p className="breadcrumb"><Link to="/">Home</Link> <i className="fa-solid fa-chevron-right"></i> <span>Our Doctors</span></p>
            </div>
        </section>

        {/*
           ==========================================================
           2. GENERAL DENTISTS
           Copy one .doctor-card block to add another dentist to this row.
           ==========================================================
        */}
        <section className="section" id="general">
            <div className="container">
                <div className="team-head">
                    <h2>General Dentists</h2>
                    <p className="team-blurb">Check-ups, fillings, cleaning and everyday care for the whole family.</p>
                </div>
                <div className="grid grid-4">
                    {/* DOCTOR CARD 1 */}
                    <article className="doctor-card">
                        <img src={img('doctor-general-1.jpg')} alt="Dr. Tan Wei Ling" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Tan Wei Ling</h3>
                            <p className="doctor-role">Family Dentistry</p>
                            <p className="doctor-bio">
                                Graduated from NUS Dentistry in 2011 and has spent her career in family practice, seeing three generations of some of our families.
                            </p>
                        </div>
                    </article>

                    {/* DOCTOR CARD 2 */}
                    <article className="doctor-card">
                        <img src={img('doctor-general-2.jpg')} alt="Dr. Marcus Lim" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Marcus Lim</h3>
                            <p className="doctor-role">Preventive Care</p>
                            <p className="doctor-bio">
                                Trained at NUS with further study in minimally invasive dentistry; he has twelve years of experience and a strong preference for catching problems early.
                            </p>
                        </div>
                    </article>

                    {/* DOCTOR CARD 3 */}
                    <article className="doctor-card">
                        <img src={img('doctor-general-3.jpg')} alt="Dr. Daniel Ong" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Daniel Ong</h3>
                            <p className="doctor-role">Paediatric Dentistry</p>
                            <p className="doctor-bio">
                                Completed his paediatric training in Melbourne and has spent eight years making first dental visits something children do not dread.
                            </p>
                        </div>
                    </article>

                    {/* DOCTOR CARD 4 */}
                    <article className="doctor-card">
                        <img src={img('doctor-general-4.jpg')} alt="Dr. Aaron Tan" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Aaron Tan</h3>
                            <p className="doctor-role">Emergency Care</p>
                            <p className="doctor-bio">
                                Nine years in practice, much of it on our walk-in emergency list, so he is used to sorting out pain quickly and calmly.
                            </p>
                        </div>
                    </article>
                </div>
            </div>
        </section>

        {/*
           ==========================================================
           3. ENDODONTISTS / ROOT CANAL SPECIALISTS
           Copy one .doctor-card block to add another dentist to this row.
           ==========================================================
        */}
        <section className="section why" id="endodontics">
            <div className="container">
                <div className="team-head">
                    <h2>Endodontists / Root Canal Specialists</h2>
                    <p className="team-blurb">Saving teeth that would otherwise need to come out.</p>
                </div>
                <div className="grid grid-4">
                    {/* DOCTOR CARD 1 */}
                    <article className="doctor-card">
                        <img src={img('doctor-endodontics-2.jpg')} alt="Dr. Jason Koh" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Jason Koh</h3>
                            <p className="doctor-role">Retreatment</p>
                            <p className="doctor-bio">
                                Fifteen years in specialist practice; he takes on the cases other clinics have already tried and could not settle.
                            </p>
                        </div>
                    </article>

                    {/* DOCTOR CARD 2 */}
                    <article className="doctor-card">
                        <img src={img('doctor-endodontics-1.jpg')} alt="Dr. Lim Hui Min" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Lim Hui Min</h3>
                            <p className="doctor-role">Root Canal Therapy</p>
                            <p className="doctor-bio">
                                Holds a Master's in Endodontics from the University of Hong Kong and has completed well over two thousand root canal treatments.
                            </p>
                        </div>
                    </article>

                    {/* DOCTOR CARD 3 */}
                    <article className="doctor-card">
                        <img src={img('doctor-endodontics-3.jpg')} alt="Dr. Benjamin Sim" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Benjamin Sim</h3>
                            <p className="doctor-role">Microsurgery</p>
                            <p className="doctor-bio">
                                Trained in surgical endodontics in the UK and works almost entirely under the operating microscope.
                            </p>
                        </div>
                    </article>

                    {/* DOCTOR CARD 4 */}
                    <article className="doctor-card">
                        <img src={img('doctor-endodontics-4.jpg')} alt="Dr. Ryan Chua" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Ryan Chua</h3>
                            <p className="doctor-role">Dental Trauma</p>
                            <p className="doctor-bio">
                                Seven years in hospital practice before joining us, so he is experienced with knocked-out and fractured teeth.
                            </p>
                        </div>
                    </article>
                </div>
            </div>
        </section>

        {/*
           ==========================================================
           4. ALIGNER TEAM AND ORTHODONTISTS
           Copy one .doctor-card block to add another dentist to this row.
           ==========================================================
        */}
        <section className="section" id="orthodontics">
            <div className="container">
                <div className="team-head">
                    <h2>Aligner Team and Orthodontists</h2>
                    <p className="team-blurb">Straightening teeth with braces and clear aligners.</p>
                </div>
                <div className="grid grid-4">
                    {/* DOCTOR CARD 1 */}
                    <article className="doctor-card">
                        <img src={img('doctor-orthodontics-2.jpg')} alt="Dr. Ethan Wong" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Ethan Wong</h3>
                            <p className="doctor-role">Fixed Braces</p>
                            <p className="doctor-bio">
                                Completed his orthodontic residency in Sydney and has fourteen years of experience with complex bite corrections.
                            </p>
                        </div>
                    </article>

                    {/* DOCTOR CARD 2 */}
                    <article className="doctor-card">
                        <img src={img('doctor-orthodontics-3.jpg')} alt="Dr. Samuel Teo" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Samuel Teo</h3>
                            <p className="doctor-role">Early Treatment</p>
                            <p className="doctor-bio">
                                Focuses on children aged seven to twelve, where guiding growth early can avoid longer treatment later.
                            </p>
                        </div>
                    </article>

                    {/* DOCTOR CARD 3 */}
                    <article className="doctor-card">
                        <img src={img('doctor-orthodontics-4.jpg')} alt="Dr. Nicholas Yeo" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Nicholas Yeo</h3>
                            <p className="doctor-role">Retention</p>
                            <p className="doctor-bio">
                                Ten years in orthodontics; he looks after the retention stage, which is where results are kept or lost.
                            </p>
                        </div>
                    </article>

                    {/* DOCTOR CARD 4 */}
                    <article className="doctor-card">
                        <img src={img('doctor-orthodontics-1.jpg')} alt="Dr. Ng Jia Hui" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Ng Jia Hui</h3>
                            <p className="doctor-role">Clear Aligners</p>
                            <p className="doctor-bio">
                                A certified aligner provider since 2015, she has planned more than a thousand cases and leads our digital treatment planning.
                            </p>
                        </div>
                    </article>
                </div>
            </div>
        </section>

        {/*
           ==========================================================
           5. PERIODONTISTS / GUM SPECIALISTS
           Copy one .doctor-card block to add another dentist to this row.
           ==========================================================
        */}
        <section className="section why" id="periodontics">
            <div className="container">
                <div className="team-head">
                    <h2>Periodontists / Gum Specialists</h2>
                    <p className="team-blurb">Treating gum disease and the bone that supports your teeth.</p>
                </div>
                <div className="grid grid-4">
                    {/* DOCTOR CARD 1 */}
                    <article className="doctor-card">
                        <img src={img('doctor-periodontics-1.jpg')} alt="Dr. Chua Mei Xin" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Chua Mei Xin</h3>
                            <p className="doctor-role">Gum Disease</p>
                            <p className="doctor-bio">
                                Specialist periodontist with a Master's from King's College London and thirteen years treating advanced gum disease.
                            </p>
                        </div>
                    </article>

                    {/* DOCTOR CARD 2 */}
                    <article className="doctor-card">
                        <img src={img('doctor-periodontics-2.jpg')} alt="Dr. Kelvin Ho" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Kelvin Ho</h3>
                            <p className="doctor-role">Gum Grafting</p>
                            <p className="doctor-bio">
                                Trained in soft tissue grafting in Taiwan and has eleven years of experience rebuilding receded gum lines.
                            </p>
                        </div>
                    </article>

                    {/* DOCTOR CARD 3 */}
                    <article className="doctor-card">
                        <img src={img('doctor-periodontics-3.jpg')} alt="Dr. Darren Loh" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Darren Loh</h3>
                            <p className="doctor-role">Implant Maintenance</p>
                            <p className="doctor-bio">
                                Nine years in practice, working with our implant team to keep the gum and bone around implants healthy.
                            </p>
                        </div>
                    </article>
                </div>
            </div>
        </section>

        {/*
           ==========================================================
           6. PROSTHODONTISTS / RESTORATIVE DENTISTRY
           Copy one .doctor-card block to add another dentist to this row.
           ==========================================================
        */}
        <section className="section" id="prosthodontics">
            <div className="container">
                <div className="team-head">
                    <h2>Prosthodontists / Restorative Dentistry</h2>
                    <p className="team-blurb">Rebuilding worn, broken or missing teeth.</p>
                </div>
                <div className="grid grid-4">
                    {/* DOCTOR CARD 1 */}
                    <article className="doctor-card">
                        <img src={img('doctor-prosthodontics-1.jpg')} alt="Dr. Goh Shu Fen" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Goh Shu Fen</h3>
                            <p className="doctor-role">Crowns & Bridges</p>
                            <p className="doctor-bio">
                                A prosthodontist trained in Japan, she has sixteen years of experience in full-mouth rehabilitation and shade matching.
                            </p>
                        </div>
                    </article>

                    {/* DOCTOR CARD 2 */}
                    <article className="doctor-card">
                        <img src={img('doctor-prosthodontics-2.jpg')} alt="Dr. Jonathan Neo" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Jonathan Neo</h3>
                            <p className="doctor-role">Dental Implants</p>
                            <p className="doctor-bio">
                                Places and restores implants, with over a decade of surgical experience and advanced training in bone grafting.
                            </p>
                        </div>
                    </article>

                    {/* DOCTOR CARD 3 */}
                    <article className="doctor-card">
                        <img src={img('doctor-prosthodontics-3.jpg')} alt="Dr. Bryan Seah" className="doctor-photo" />
                        <div className="doctor-info">
                            <h3>Dr. Bryan Seah</h3>
                            <p className="doctor-role">Dentures</p>
                            <p className="doctor-bio">
                                Twelve years spent almost entirely on removable prosthetics, and known for getting a difficult denture to fit.
                            </p>
                        </div>
                    </article>
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
