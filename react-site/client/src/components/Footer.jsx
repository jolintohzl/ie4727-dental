/* The footer shared by every page (same markup as index.html). */
import { Link } from 'react-router-dom'
import { img } from '../images'

export default function Footer() {
    return (
    <footer className="site-footer">
        <div className="container footer-inner">
            {/* Left: logo, name and contact details */}
            <div className="footer-col footer-brand">
                <Link to="/" className="logo logo-footer"> <img src={img('dental group footer.png')} alt="Smile Dental Group logo" className="logo-img" /> <span className="logo-name">Smile Dental Group</span> </Link>
                <ul className="footer-contact">
                    <li>
                        <i className="fa-solid fa-location-dot"></i> 123 Orchard Road, #05-12<br />Singapore 238888
                    </li>
                    <li><i className="fa-solid fa-phone"></i> <a href="tel:+6561234567">+65 6123 4567</a></li>
                    <li><i className="fa-regular fa-envelope"></i> <a href="mailto:hello@smiledental.sg">hello@smiledental.sg</a></li>
                </ul>

                {/* social media icons sit under the contact details */}
                <ul className="social-links">
                    <li><a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook-f"></i></a></li>
                    <li><a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a></li>
                    <li><a href="#" aria-label="WhatsApp"><i className="fa-brands fa-whatsapp"></i></a></li>
                </ul>
            </div>

            {/* Link column: About */}
            <div className="footer-col">
                <h4>About</h4>
                <ul className="footer-links">
                    <li><Link to="/about-us">About Us</Link></li>
                    <li><Link to="/about-us#join">Join Us</Link></li>
                </ul>
            </div>

            {/* Link column: Our Doctors */}
            <div className="footer-col">
                <h4>Our Doctors</h4>
                <ul className="footer-links">
                    <li><Link to="/doctors#general">General Dentists</Link></li>
                    <li><Link to="/doctors#endodontics">Endodontists/Root Canal Specialists</Link></li>
                    <li><Link to="/doctors#orthodontics">Aligner Team and Orthodontists</Link></li>
                    <li><Link to="/doctors#periodontics">Periodontists/Gum Specialists</Link></li>
                    <li><Link to="/doctors#prosthodontics">Prosthodontists/Restorative Dentistry</Link></li>
                </ul>
            </div>

            {/* Link column: Services */}
            <div className="footer-col">
                <h4>Services</h4>
                <ul className="footer-links">
                    <li><Link to="/fees-calculator">Fees Calculator</Link></li>
                    <li><Link to="/services">Dental Services</Link></li>
                </ul>
            </div>

            {/* Link column: Locate Us */}
            <div className="footer-col">
                <h4>Locate Us</h4>
                <ul className="footer-links">
                    <li><Link to="/locate-us">Locations</Link></li>
                </ul>
            </div>
        </div>
        <div className="footer-bottom">
            <div className="container">
                <p>© 2026 Smile Dental Group. All rights reserved.</p>
                <ul>
                    <li><a href="#">Privacy Policy</a></li>
                    <li><a href="#">Terms of Service</a></li>
                </ul>
            </div>
        </div>
    </footer>
    )
}
