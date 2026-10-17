/* ==========================================================
   Fees calculator — the three dropdowns and the estimate panel.
   The disclaimer under it stays in pages/FeesPage.jsx.

   The answer is worked out from the three choices on every
   render, so the screen cannot fall out of step with the state.
   ========================================================== */
import { useState, useMemo } from 'react'
import { TREATMENTS, AGE_GROUPS, SCHEMES, money, calculateSubsidy, findTreatment, findScheme } from '../data/fees'


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
export default function FeesCalculator() {
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
        <>
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

        </>
    );
}
