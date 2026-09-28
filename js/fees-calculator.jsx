/* ==========================================================
   Fees calculator — React.

   Loaded with:
     <script type="text/babel" src="js/fees-calculator.jsx"></script>
   Babel turns the JSX below into plain JavaScript in the browser,
   so there is no build step — same approach as the other two
   components on this site.

   This replaces about 250 lines of hand-written DOM updating. The
   old version had to remember to refresh six separate elements and
   rebuild the scheme dropdown by hand every time the age changed.
   Here the answer is worked out from the three choices on every
   render, so the screen cannot fall out of step with the state.

   Nothing here touches the network: no fetch, no AJAX, no JSON.
   The price list below is the whole data source.

   Everything is wrapped in an IIFE because each Babel script shares
   one global scope — a second top-level `const { useState }` would
   collide with the one in login-modal.jsx.
   ========================================================== */

(function () {

    const { useState, useMemo } = React;


    /* ----------------------------------------------------------
       1. THE PRICE LIST
       One entry per treatment. Update the numbers here and the
       whole calculator follows.

         price      what the clinic charges, in SGD
         chasBlue   dollars off for a CHAS Blue cardholder
         chasOrange dollars off for a CHAS Orange cardholder
         medisave   most you may withdraw from MediSave (0 = not claimable;
                    MediSave only covers surgical dental work)
         flexi      true if Flexi-MediSave can be used on it
       ---------------------------------------------------------- */
    const TREATMENTS = [
        { id: "consult",   name: "Consultation & Check-up",            price: 45,   chasBlue: 11.5, chasOrange: 8,    medisave: 0,    flexi: true  },
        { id: "scaling",   name: "Scaling & Polishing",                price: 110,  chasBlue: 50.5, chasOrange: 25,   medisave: 0,    flexi: true  },
        { id: "filling",   name: "Filling",                            price: 140,  chasBlue: 75.5, chasOrange: 52.5, medisave: 0,    flexi: true  },
        { id: "extract",   name: "Simple Extraction",                  price: 130,  chasBlue: 75.5, chasOrange: 52.5, medisave: 0,    flexi: true  },
        { id: "surgical",  name: "Surgical Extraction (wisdom tooth)", price: 1200, chasBlue: 0,    chasOrange: 0,    medisave: 950,  flexi: false },
        { id: "rootcanal", name: "Root Canal Treatment",               price: 1100, chasBlue: 170,  chasOrange: 100,  medisave: 0,    flexi: true  },
        { id: "crown",     name: "Dental Crown",                       price: 1300, chasBlue: 190,  chasOrange: 130,  medisave: 0,    flexi: true  },
        { id: "bridge",    name: "Dental Bridge (3 units)",            price: 2400, chasBlue: 190,  chasOrange: 130,  medisave: 0,    flexi: true  },
        { id: "implant",   name: "Dental Implant",                     price: 4500, chasBlue: 0,    chasOrange: 0,    medisave: 1150, flexi: false },
        { id: "denturef",  name: "Full Denture (per arch)",            price: 1200, chasBlue: 260,  chasOrange: 190,  medisave: 0,    flexi: true  },
        { id: "denturep",  name: "Partial Denture",                    price: 700,  chasBlue: 150,  chasOrange: 110,  medisave: 0,    flexi: true  },
        { id: "braces",    name: "Braces / Invisalign",                price: 5500, chasBlue: 0,    chasOrange: 0,    medisave: 0,    flexi: false }
    ];


    /* ----------------------------------------------------------
       2. THE SCHEMES
       "ages" lists the age groups that may pick each scheme, which
       is what filters the third dropdown.
       ---------------------------------------------------------- */
    const FLEXI_CAP = 200;   // Flexi-MediSave allows up to $200 a year

    const AGE_GROUPS = [
        { id: "under21", name: "Under 21" },
        { id: "21to59",  name: "21 to 59" },
        { id: "60to64",  name: "60 to 64" },
        { id: "65plus",  name: "65 and above" }
    ];

    const SCHEMES = [
        { id: "none",       name: "No scheme (pay in full)",
          ages: ["under21", "21to59", "60to64", "65plus"],
          hint: "The full clinic fee, with nothing deducted." },

        { id: "chasBlue",   name: "CHAS Blue",
          ages: ["under21", "21to59", "60to64", "65plus"],
          hint: "For lower-income households. The higher of the two CHAS subsidy tiers." },

        { id: "chasOrange", name: "CHAS Orange",
          ages: ["under21", "21to59", "60to64", "65plus"],
          hint: "For middle-income households. Covers dental and chronic conditions only." },

        { id: "merdeka",    name: "Merdeka Generation",
          ages: ["65plus"],
          hint: "Merdeka Generation cardholders receive more than the CHAS Blue rate." },

        { id: "pioneer",    name: "Pioneer Generation",
          ages: ["65plus"],
          hint: "Pioneer Generation cardholders receive the highest rate of subsidy." },

        { id: "medisave",   name: "MediSave",
          ages: ["21to59", "60to64", "65plus"],
          hint: "Only for surgical procedures such as implants and surgical extractions." },

        { id: "flexi",      name: "Flexi-MediSave",
          ages: ["60to64", "65plus"],
          hint: "From age 60 you may use up to $" + FLEXI_CAP + " of MediSave a year on outpatient treatment." }
    ];

    /* Merdeka and Pioneer build on the CHAS Blue rate.
       Adjust these two multipliers if the published rates change. */
    const MERDEKA_MULTIPLIER = 1.25;
    const PIONEER_MULTIPLIER = 1.50;


    /* ---------- Helpers ---------- */

    // Show money the same way everywhere: $1,234.50
    function money(amount) {
        return "$" + amount.toLocaleString("en-SG", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    const findTreatment = (id) => TREATMENTS.find((t) => t.id === id) || null;
    const findScheme    = (id) => SCHEMES.find((s) => s.id === id) || null;


    /* ----------------------------------------------------------
       Work out the subsidy for one treatment under one scheme.
       Returns the dollar amount and a line explaining it.
       ---------------------------------------------------------- */
    function calculateSubsidy(treatment, schemeId) {
        let amount = 0;
        let note = "";

        if (schemeId === "chasBlue" || schemeId === "chasOrange") {
            amount = schemeId === "chasBlue" ? treatment.chasBlue : treatment.chasOrange;
            const label = schemeId === "chasBlue" ? "CHAS Blue" : "CHAS Orange";
            note = amount > 0
                ? label + " covers " + money(amount) + " of this treatment."
                : "CHAS does not cover this treatment.";

        } else if (schemeId === "merdeka" || schemeId === "pioneer") {
            const isPioneer = schemeId === "pioneer";
            amount = treatment.chasBlue * (isPioneer ? PIONEER_MULTIPLIER : MERDEKA_MULTIPLIER);
            note = amount > 0
                ? "You receive the CHAS Blue rate plus the extra "
                  + (isPioneer ? "Pioneer" : "Merdeka") + " Generation subsidy."
                : "This treatment is not on the subsidised list.";

        } else if (schemeId === "medisave") {
            if (treatment.medisave > 0) {
                amount = treatment.medisave;
                note = "MediSave covers up to " + money(treatment.medisave)
                     + " of this procedure. The rest is paid in cash.";
            } else {
                note = "MediSave can only be used for surgical procedures, so it does "
                     + "not apply to this treatment.";
            }

        } else if (schemeId === "flexi") {
            if (treatment.flexi) {
                amount = FLEXI_CAP;
                note = "Flexi-MediSave covers up to " + money(FLEXI_CAP)
                     + " a year towards outpatient treatment.";
            } else {
                note = "Flexi-MediSave is for routine outpatient treatment and does not "
                     + "apply to this procedure.";
            }

        } else {
            note = "No scheme applied — this is the full clinic fee.";
        }

        // Round to whole cents first, otherwise the subsidy and the amount
        // payable can display as a cent more than the fee they came from.
        amount = Math.round(amount * 100) / 100;

        // Never give back more than the treatment costs
        if (amount > treatment.price) {
            amount = treatment.price;
            note += " The subsidy is capped at the cost of the treatment.";
        }

        return { amount: amount, note: note };
    }


    /* ---------- One row of the estimate panel ---------- */
    function Line({ label, value, className, total }) {
        return (
            <div className={'calc-line' + (total ? ' total' : '')}>
                <span>{label}</span>
                <strong className={className}>{value}</strong>
            </div>
        );
    }


    /* ---------- The calculator ---------- */
    function FeesCalculator() {
        const [serviceId, setServiceId] = useState('');
        const [ageGroup, setAgeGroup]   = useState('');
        const [schemeId, setSchemeId]   = useState('');

        const treatment = findTreatment(serviceId);
        const scheme    = findScheme(schemeId);

        // Only the schemes this age group may hold. The old version rebuilt
        // the <select> by hand whenever the age changed; here the list is
        // simply derived, so it can never be out of date.
        const openSchemes = useMemo(
            () => (ageGroup ? SCHEMES.filter((s) => s.ages.indexOf(ageGroup) !== -1) : []),
            [ageGroup]
        );

        // Changing age can make the chosen scheme ineligible — drop it if so.
        function changeAge(value) {
            setAgeGroup(value);
            const stillAllowed = SCHEMES.some(
                (s) => s.id === schemeId && s.ages.indexOf(value) !== -1
            );
            if (!stillAllowed) {
                setSchemeId('');
            }
        }

        const ready   = treatment && ageGroup && scheme;
        const subsidy = ready ? calculateSubsidy(treatment, scheme.id) : null;
        const payable = ready ? treatment.price - subsidy.amount : 0;
        const dash    = '—';

        return (
            <React.Fragment>
                <div className="calc-grid">

                    {/* ---------- Left: the three choices ---------- */}
                    <div className="form-card">
                        <div className="form-grid">

                            <div className="form-field full">
                                <label htmlFor="service">1. Which treatment do you need?</label>
                                <select id="service" value={serviceId}
                                        onChange={(e) => setServiceId(e.target.value)}>
                                    <option value="">-- Please select a treatment --</option>
                                    {TREATMENTS.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} — {money(t.price)}
                                        </option>
                                    ))}
                                </select>
                                {treatment && (
                                    <span className="form-hint">
                                        Clinic fee for this treatment: {money(treatment.price)}
                                    </span>
                                )}
                            </div>

                            <div className="form-field full">
                                <label htmlFor="ageGroup">2. Which age group are you in?</label>
                                <select id="ageGroup" value={ageGroup}
                                        onChange={(e) => changeAge(e.target.value)}>
                                    <option value="">-- Please select an age group --</option>
                                    {AGE_GROUPS.map((a) => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                                <span className="form-hint">
                                    Some schemes are only open to certain ages, so this decides
                                    what you can pick below.
                                </span>
                            </div>

                            <div className="form-field full">
                                <label htmlFor="scheme">3. Which scheme would you like to apply?</label>
                                <select id="scheme" value={schemeId} disabled={!ageGroup}
                                        onChange={(e) => setSchemeId(e.target.value)}>
                                    <option value="">
                                        {ageGroup ? '-- Please select a scheme --' : '-- Choose an age group first --'}
                                    </option>
                                    {openSchemes.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                {scheme && <span className="form-hint">{scheme.hint}</span>}
                            </div>

                        </div>
                    </div>

                    {/* ---------- Right: the running total ---------- */}
                    <div className="form-card calc-result">

                        <h3 className="calc-title">Your estimate</h3>

                        <Line label="Treatment" value={ready ? treatment.name : dash} />
                        <Line label="Clinic fee" value={ready ? money(treatment.price) : dash} />
                        <Line
                            label={ready && scheme.id !== 'none' ? scheme.name : 'Subsidy applied'}
                            value={ready ? (subsidy.amount > 0 ? '− ' + money(subsidy.amount) : money(0)) : dash}
                            className="calc-subsidy"
                        />
                        <Line label="You pay" value={ready ? money(payable) : dash} total />

                        <p className="calc-message">
                            {ready
                                ? subsidy.note
                                : 'Choose a treatment, an age group and a scheme to see your estimate.'}
                        </p>

                    </div>

                </div>

                {/* Everything on this page is an estimate, so say so plainly */}
                <p className="calc-disclaimer">
                    <i className="fa-solid fa-circle-info"></i>
                    <span>
                        <strong>These figures are estimates only.</strong>{' '}
                        Clinic fees vary with the complexity of each case, and subsidy rates are set by
                        the Ministry of Health and change from time to time. Please check the current
                        CHAS, Pioneer Generation, Merdeka Generation and MediSave rates before relying
                        on the amounts shown here. Your final bill is confirmed at your appointment.
                    </span>
                </p>
            </React.Fragment>
        );
    }


    // The plain markup inside this div is what shows if JavaScript is off;
    // createRoot() clears it and renders the calculator in its place.
    const mount = document.getElementById('feesCalculatorRoot');
    if (mount) {
        ReactDOM.createRoot(mount).render(<FeesCalculator />);
    }

})();
