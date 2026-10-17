/* Converted from services.html — edit this file, not the HTML, for the React site. */
import { Link } from 'react-router-dom'
import { img } from '../images'

export default function Services() {
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
                    <Link to="/">Home</Link> <i className="fa-solid fa-chevron-right"></i> <span>Dental Services</span>
                </p>
                <p>What we treat, what each visit involves, and what to expect afterwards.</p>
            </div>
        </section>

        {/*
           ==========================================================
           2. GENERAL DENTISTRY
           ==========================================================
        */}
        <section className="section" id="general-dentistry">
            <div className="container">
                <div className="section-head">
                    <h2>General Dentistry</h2>
                </div>
                <div className="why-inner">
                    <div className="why-visual">
                        {/* TO REPLACE: swap this src for a real photo, e.g. images/general-dentistry.jpg */}
                        <img src={img('service-general-dentistry.jpg')} alt="General Dentistry" className="why-photo" />
                    </div>
                    <div className="why-copy">
                        <p className="lead">
                            The routine care that keeps everything else from becoming a bigger job — check-ups, cleaning, fillings and early warnings when something is starting to go wrong.
                        </p>
                        <ul className="why-list">
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <div>
                                    <h4>What is included</h4>
                                    <p>Examination, scaling and polishing, digital X-rays when they are needed, and simple fillings.</p>
                                </div>
                            </li>
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <div>
                                    <h4>How often</h4>
                                    <p>Most patients come every six months. We will tell you if your teeth need to be seen sooner.</p>
                                </div>
                            </li>
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <div>
                                    <h4>Good to know</h4>
                                    <p>Nervous patients are welcome. Say so when you book and we will allow extra time.</p>
                                </div>
                            </li>
                        </ul>
                        <p className="service-price">From $45 · <Link to="/fees-calculator">see the fees calculator</Link></p>
                    </div>
                </div>
            </div>
        </section>

        {/*
           ==========================================================
           3. BRACES / INVISALIGN
           ==========================================================
        */}
        <section className="section why" id="braces">
            <div className="container">
                <div className="section-head">
                    <h2>Braces / Invisalign</h2>
                </div>
                <div className="why-inner flip">
                    <div className="why-visual"><img src={img('service-braces.jpg')} alt="Braces / Invisalign" className="why-photo" /></div>
                    <div className="why-copy">
                        <p className="lead">
                            Straightening teeth either with fixed braces or with clear removable aligners. Which one suits you depends on how far the teeth need to move, not on preference alone.
                        </p>
                        <ul className="why-list">
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <div>
                                    <h4>Clear aligners</h4>
                                    <p>Removable, close to invisible, and taken out to eat. Best for mild to moderate crowding.</p>
                                </div>
                            </li>
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <div>
                                    <h4>Fixed braces</h4>
                                    <p>Metal or ceramic brackets. Slower to get used to, but they handle bigger corrections.</p>
                                </div>
                            </li>
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <div>
                                    <h4>How long</h4>
                                    <p>Typically 6 to 24 months. You will get an estimate after the first scan.</p>
                                </div>
                            </li>
                        </ul>
                        <p className="service-price">From $5,500 · <Link to="/fees-calculator">see the fees calculator</Link></p>
                    </div>
                </div>
            </div>
        </section>

        {/*
           ==========================================================
           4. ROOT CANAL
           ==========================================================
        */}
        <section className="section" id="root-canal">
            <div className="container">
                <div className="section-head">
                    <h2>Root Canal</h2>
                </div>
                <div className="why-inner">
                    <div className="why-visual"><img src={img('service-root-canal.jpg')} alt="Root Canal" className="why-photo" /></div>
                    <div className="why-copy">
                        <p className="lead">
                            When decay or injury reaches the nerve inside a tooth, a root canal clears the infection and saves the tooth — the alternative is usually taking it out.
                        </p>
                        <ul className="why-list">
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <div>
                                    <h4>What happens</h4>
                                    <p>The infected pulp is removed, the canal is cleaned and sealed, and the tooth is rebuilt.</p>
                                </div>
                            </li>
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <div>
                                    <h4>Does it hurt</h4>
                                    <p>The tooth is fully numbed. Most patients say it feels much like having a filling.</p>
                                </div>
                            </li>
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <div>
                                    <h4>Afterwards</h4>
                                    <p>A crown is often recommended, since a treated tooth becomes more brittle over time.</p>
                                </div>
                            </li>
                        </ul>
                        <p className="service-price">From $1,100 · <Link to="/fees-calculator">see the fees calculator</Link></p>
                    </div>
                </div>
            </div>
        </section>

        {/*
           ==========================================================
           5. DENTAL IMPLANTS
           ==========================================================
        */}
        <section className="section why" id="implants">
            <div className="container">
                <div className="section-head">
                    <h2>Dental Implants</h2>
                </div>
                <div className="why-inner flip">
                    <div className="why-visual"><img src={img('service-implants.jpg')} alt="Dental Implants" className="why-photo" /></div>
                    <div className="why-copy">
                        <p className="lead">
                            A titanium post placed in the jaw to replace the root of a missing tooth, topped with a crown that looks and works like the tooth that was there before.
                        </p>
                        <ul className="why-list">
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <div>
                                    <h4>Who it suits</h4>
                                    <p>Anyone missing one or more teeth with enough healthy bone to hold the implant.</p>
                                </div>
                            </li>
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <div>
                                    <h4>The timeline</h4>
                                    <p>Placement, then three to six months for the bone to fuse, then the final crown.</p>
                                </div>
                            </li>
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <div>
                                    <h4>Lifespan</h4>
                                    <p>With normal brushing and regular check-ups, implants routinely last decades.</p>
                                </div>
                            </li>
                        </ul>
                        <p className="service-price">From $4,500 · <Link to="/fees-calculator">see the fees calculator</Link></p>
                    </div>
                </div>
            </div>
        </section>

        {/*
           ==========================================================
           6. CROWNS AND BRIDGES
           ==========================================================
        */}
        <section className="section" id="crowns-bridges">
            <div className="container">
                <div className="section-head">
                    <h2>Crowns and Bridges</h2>
                </div>
                <div className="why-inner">
                    <div className="why-visual">
                        <img src={img('service-crowns-bridges.jpg')} alt="Crowns and Bridges" className="why-photo" />
                    </div>
                    <div className="why-copy">
                        <p className="lead">
                            A crown caps a tooth that is cracked, worn or heavily filled. A bridge spans a gap by anchoring a replacement tooth to the teeth on either side.
                        </p>
                        <ul className="why-list">
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <div>
                                    <h4>Same-day crowns</h4>
                                    <p>Scanned, milled and fitted in one visit, so there is no temporary crown to look after.</p>
                                </div>
                            </li>
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <div>
                                    <h4>Materials</h4>
                                    <p>Porcelain and zirconia are matched to the shade of the teeth around them.</p>
                                </div>
                            </li>
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <div>
                                    <h4>Crown or bridge</h4>
                                    <p>A crown restores a tooth you still have. A bridge fills a gap where one is missing.</p>
                                </div>
                            </li>
                        </ul>
                        <p className="service-price">From $1,300 · <Link to="/fees-calculator">see the fees calculator</Link></p>
                    </div>
                </div>
            </div>
        </section>

        {/*
           ==========================================================
           7. DENTURES
           ==========================================================
        */}
        <section className="section why" id="dentures">
            <div className="container">
                <div className="section-head">
                    <h2>Dentures</h2>
                </div>
                <div className="why-inner flip">
                    <div className="why-visual"><img src={img('service-dentures.jpg')} alt="Dentures" className="why-photo" /></div>
                    <div className="why-copy">
                        <p className="lead">
                            Removable replacements for several missing teeth or a full arch, made to fit your mouth and adjusted until they sit comfortably.
                        </p>
                        <ul className="why-list">
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <div>
                                    <h4>Full dentures</h4>
                                    <p>Replace a whole upper or lower arch when no natural teeth remain.</p>
                                </div>
                            </li>
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <div>
                                    <h4>Partial dentures</h4>
                                    <p>Fill several gaps while clipping around the healthy teeth you still have.</p>
                                </div>
                            </li>
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <div>
                                    <h4>Settling in</h4>
                                    <p>Expect a few adjustment visits. Speaking and eating take a couple of weeks to feel normal.</p>
                                </div>
                            </li>
                        </ul>
                        <p className="service-price">From $700 · <Link to="/fees-calculator">see the fees calculator</Link></p>
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
