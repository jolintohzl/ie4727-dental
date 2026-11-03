/* ==========================================================
   Fees calculator 
   Loaded with:
     <script src="js/fees-calculator.js"></script>

   The three dropdowns and the estimate panel are written in
   fees-calculator.html. This file fills in the treatment and
   scheme lists, and redraws the estimate whenever a choice changes.

   The price list below is the whole data source.
   ========================================================== */

(function () {

    const serviceSelect = document.getElementById('service');
    if (!serviceSelect) return;


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

    /* Merdeka and Pioneer build on the CHAS Blue rate. */
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

    function findTreatment(id) {
        return TREATMENTS.find(function (t) { return t.id === id; }) || null;
    }
    function findScheme(id) {
        return SCHEMES.find(function (s) { return s.id === id; }) || null;
    }


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


    /* ----------------------------------------------------------
       3. THE PAGE
       ---------------------------------------------------------- */
    const ageSelect    = document.getElementById('ageGroup');
    const schemeSelect = document.getElementById('scheme');
    const serviceHint  = document.getElementById('serviceHint');
    const schemeHint   = document.getElementById('schemeHint');

    const out = {
        treatment:   document.getElementById('outTreatment'),
        price:       document.getElementById('outPrice'),
        schemeLabel: document.getElementById('outSchemeLabel'),
        subsidy:     document.getElementById('outSubsidy'),
        total:       document.getElementById('outTotal'),
        message:     document.getElementById('outMessage')
    };

    const DASH = '—';

    // Adds one <option> to a <select>
    function addOption(select, value, label) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
    }

    // Fill the treatment list once, from the price list above
    TREATMENTS.forEach(function (t) {
        addOption(serviceSelect, t.id, t.name + ' — ' + money(t.price));
    });

    // Rebuild the scheme list with only the schemes this age group may hold.
    // If the scheme already chosen is still allowed, keep it selected.
    function fillSchemes() {
        const ageGroup = ageSelect.value;
        const previous = schemeSelect.value;

        schemeSelect.innerHTML = '';
        addOption(schemeSelect, '', ageGroup ? '-- Please select a scheme --' : '-- Choose an age group first --');
        schemeSelect.disabled = !ageGroup;

        SCHEMES.forEach(function (s) {
            if (ageGroup && s.ages.indexOf(ageGroup) !== -1) {
                addOption(schemeSelect, s.id, s.name);
            }
        });

        const stillAllowed = Array.prototype.some.call(schemeSelect.options, function (o) {
            return o.value === previous;
        });
        schemeSelect.value = stillAllowed ? previous : '';
    }

    // Work the estimate out again from the three choices and redraw it
    function update() {
        const treatment = findTreatment(serviceSelect.value);
        const scheme    = findScheme(schemeSelect.value);

        serviceHint.textContent = treatment ? 'Clinic fee for this treatment: ' + money(treatment.price) : '';
        serviceHint.hidden = !treatment;
        schemeHint.textContent = scheme ? scheme.hint : '';
        schemeHint.hidden = !scheme;

        const ready = treatment && ageSelect.value && scheme;
        if (!ready) {
            out.treatment.textContent   = DASH;
            out.price.textContent       = DASH;
            out.schemeLabel.textContent = 'Subsidy applied';
            out.subsidy.textContent     = DASH;
            out.total.textContent       = DASH;
            out.message.textContent     = 'Choose a treatment, an age group and a scheme to see your estimate.';
            return;
        }

        const subsidy = calculateSubsidy(treatment, scheme.id);
        const payable = treatment.price - subsidy.amount;

        out.treatment.textContent   = treatment.name;
        out.price.textContent       = money(treatment.price);
        out.schemeLabel.textContent = scheme.id !== 'none' ? scheme.name : 'Subsidy applied';
        out.subsidy.textContent     = subsidy.amount > 0 ? '− ' + money(subsidy.amount) : money(0);
        out.total.textContent       = money(payable);
        out.message.textContent     = subsidy.note;
    }
    //if age is changed, scheme is changed
    serviceSelect.addEventListener('change', update);
    ageSelect.addEventListener('change', function () {
        fillSchemes();     // changing age can make the chosen scheme ineligible
        update();
    });
    schemeSelect.addEventListener('change', update);

    // Draw the starting state (also covers a browser restoring old choices)
    fillSchemes();
    update();

})();
