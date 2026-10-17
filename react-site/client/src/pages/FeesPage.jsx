/* Converted from fees-calculator.html — edit this file, not the HTML, for the React site. */
import { Link } from 'react-router-dom'
import FeesCalculator from '../components/FeesCalculator'

export default function FeesPage() {
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
                    <Link to="/">Home</Link> <i className="fa-solid fa-chevron-right"></i> <span>Fees Calculator</span>
                </p>
            </div>
        </section>

        {/*
           ==========================================================
           2. THE CALCULATOR
           See components/FeesCalculator.jsx, which uses the price list
           and subsidy rates in data/fees.js.
           ==========================================================
        */}
        <section className="section" id="calculator">
            <div className="container">
                <div className="section-head">
                    <p className="section-label">Estimate your bill</p>
                    <h2>Fees calculator</h2>
                    <p className="section-sub">
                        Singapore residents can use CHAS, Pioneer or Merdeka Generation benefits and MediSave towards dental treatment. This works out a rough figure for you.
                    </p>
                </div>
                <FeesCalculator />

                {/* Everything on this page is an estimate, so say so plainly */}
                <p className="calc-disclaimer">
                    <i className="fa-solid fa-circle-info"></i> <span> <strong>These figures are estimates only.</strong> Clinic fees vary with the complexity of each case, and subsidy rates are set by the Ministry of Health and change from time to time. Please check the current CHAS, Pioneer Generation, Merdeka Generation and MediSave rates before relying on the amounts shown here. Your final bill is confirmed at your appointment. </span>
                </p>
            </div>
        </section>

        {/*
           ==========================================================
           3. FULL PRICE LIST
           The calculator above answers one question at a time. This
           table shows every treatment at once so the figures can be
           compared side by side.

           The look comes from Bootstrap's table classes (see the
           Bootstrap link in <head>):
           .table             the base table styling
           .table-striped     shades every other row
           .table-hover       highlights the row under the pointer
           .align-middle      centres the text in each cell vertically
           .table-responsive  on the wrapper, lets the table scroll
           sideways on a phone instead of squashing
           .visually-hidden   gives the tick / cross a word a screen
           reader can announce

           NOTE: these are the same numbers held in data/fees.js.
           If a price changes, update it in BOTH places.
           ==========================================================
        */}
        <section className="section price-list" id="price-list">
            <div className="container">
                <div className="section-head">
                    <p className="section-label">For reference</p>
                    <h2>Full price list</h2>
                    <p className="section-sub">Every treatment we offer, with the subsidy each scheme covers.</p>
                </div>
                <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle price-table">
                        <thead>
                            <tr>
                                <th scope="col">Treatment</th>
                                <th scope="col">Clinic fee</th>
                                <th scope="col">CHAS Blue</th>
                                <th scope="col">CHAS Orange</th>
                                <th scope="col">MediSave</th>
                                <th scope="col">Flexi-MediSave</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th scope="row">Consultation & Check-up</th>
                                <td>$45.00</td>
                                <td>$11.50</td>
                                <td>$8.00</td>
                                <td className="price-none">—</td>
                                <td>
                                    <i className="fa-solid fa-check price-yes" aria-hidden="true"></i><span className="visually-hidden">Yes</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">Scaling & Polishing</th>
                                <td>$110.00</td>
                                <td>$50.50</td>
                                <td>$25.00</td>
                                <td className="price-none">—</td>
                                <td>
                                    <i className="fa-solid fa-check price-yes" aria-hidden="true"></i><span className="visually-hidden">Yes</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">Filling</th>
                                <td>$140.00</td>
                                <td>$75.50</td>
                                <td>$52.50</td>
                                <td className="price-none">—</td>
                                <td>
                                    <i className="fa-solid fa-check price-yes" aria-hidden="true"></i><span className="visually-hidden">Yes</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">Simple Extraction</th>
                                <td>$130.00</td>
                                <td>$75.50</td>
                                <td>$52.50</td>
                                <td className="price-none">—</td>
                                <td>
                                    <i className="fa-solid fa-check price-yes" aria-hidden="true"></i><span className="visually-hidden">Yes</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">Surgical Extraction (wisdom tooth)</th>
                                <td>$1,200.00</td>
                                <td className="price-none">—</td>
                                <td className="price-none">—</td>
                                <td>$950.00</td>
                                <td>
                                    <i className="fa-solid fa-xmark price-no" aria-hidden="true"></i><span className="visually-hidden">No</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">Root Canal Treatment</th>
                                <td>$1,100.00</td>
                                <td>$170.00</td>
                                <td>$100.00</td>
                                <td className="price-none">—</td>
                                <td>
                                    <i className="fa-solid fa-check price-yes" aria-hidden="true"></i><span className="visually-hidden">Yes</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">Dental Crown</th>
                                <td>$1,300.00</td>
                                <td>$190.00</td>
                                <td>$130.00</td>
                                <td className="price-none">—</td>
                                <td>
                                    <i className="fa-solid fa-check price-yes" aria-hidden="true"></i><span className="visually-hidden">Yes</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">Dental Bridge (3 units)</th>
                                <td>$2,400.00</td>
                                <td>$190.00</td>
                                <td>$130.00</td>
                                <td className="price-none">—</td>
                                <td>
                                    <i className="fa-solid fa-check price-yes" aria-hidden="true"></i><span className="visually-hidden">Yes</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">Dental Implant</th>
                                <td>$4,500.00</td>
                                <td className="price-none">—</td>
                                <td className="price-none">—</td>
                                <td>$1,150.00</td>
                                <td>
                                    <i className="fa-solid fa-xmark price-no" aria-hidden="true"></i><span className="visually-hidden">No</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">Full Denture (per arch)</th>
                                <td>$1,200.00</td>
                                <td>$260.00</td>
                                <td>$190.00</td>
                                <td className="price-none">—</td>
                                <td>
                                    <i className="fa-solid fa-check price-yes" aria-hidden="true"></i><span className="visually-hidden">Yes</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">Partial Denture</th>
                                <td>$700.00</td>
                                <td>$150.00</td>
                                <td>$110.00</td>
                                <td className="price-none">—</td>
                                <td>
                                    <i className="fa-solid fa-check price-yes" aria-hidden="true"></i><span className="visually-hidden">Yes</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">Braces / Invisalign</th>
                                <td>$5,500.00</td>
                                <td className="price-none">—</td>
                                <td className="price-none">—</td>
                                <td className="price-none">—</td>
                                <td>
                                    <i className="fa-solid fa-xmark price-no" aria-hidden="true"></i><span className="visually-hidden">No</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
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
