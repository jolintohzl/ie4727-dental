/* Converted from locate-us.html — edit this file, not the HTML, for the React site. */
import { Link } from 'react-router-dom'
import { img } from '../images'

export default function LocateUs() {
    return (
        <>
        {/*
           ==========================================================
           1. PAGE BANNER
           ==========================================================
        */}
        <section className="page-hero">
            <div className="container">
                <p className="breadcrumb"><Link to="/">Home</Link> <i className="fa-solid fa-chevron-right"></i> <span>Locate Us</span></p>
            </div>
        </section>

        {/*
           ==========================================================
           2. OUR CLINICS
           One .location-card per branch — copy a block to add another.
           ==========================================================
        */}
        <section className="section" id="locations">
            <div className="container">
                <div className="section-head">
                    <p className="section-label">Our clinics</p>
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

                            {/* NOTE: point this at the real Google Maps link for the branch */}
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

                            {/* NOTE: point this at the real Google Maps link for the branch */}
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

                            {/* NOTE: point this at the real Google Maps link for the branch */}
                            <a href="#" className="btn btn-outline btn-block">Get Directions <i className="fa-solid fa-arrow-right"></i></a>
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
