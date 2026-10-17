/* ==========================================================
   Job application form (About Us page).

   Validation rules come from the base site's js/validators.js, so
   both versions of the site agree on what a valid name, email or
   phone number looks like.
   ========================================================== */
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Validators from '../validators'
import { api } from '../api'

const APPLY_RULES = {
    fullName: Validators.name,
    email:    Validators.email,
    contact:  Validators.phone,
    position: Validators.position,
    resume:   Validators.resume,
    message:  Validators.coverNote
};

// The order fields appear in, so submitting jumps to the first problem.
const FIELD_ORDER = ['fullName', 'email', 'contact', 'position', 'resume', 'message'];

const POSITIONS = [
    ['receptionist', 'Front Desk Receptionist'],
    ['implants',     'Dental Implants Specialist'],
    ['assistant',    'Dental Assistant'],
    ['hygienist',    'Dental Hygienist'],
    ['general',      'General Application']
];


/* ---------- One labelled field with its error message ---------- */
function ApplyField({ id, label, error, hint, required, className, children }) {
    return (
        <div className={'form-field' + (className ? ' ' + className : '') + (error ? ' has-error' : '')}>
            <label htmlFor={id}>
                {label}{required && <span className="required-star"> *</span>}
            </label>
            {children}
            {hint && !error && <span className="form-hint">{hint}</span>}
            {error && <span className="field-error" id={id + '-error'} role="alert">{error}</span>}
        </div>
    );
}


export default function ApplyForm() {
    const blank = { fullName: '', email: '', contact: '', position: '', resume: null, message: '' };

    const [values, setValues]   = useState(blank);
    const [touched, setTouched] = useState({});     // fields the user has left
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');
    const [serverFields, setServerFields] = useState({});   // e.g. { email: '...' } from the server
    const navigate = useNavigate();

    const refs = {
        fullName: useRef(null),
        email:    useRef(null),
        contact:  useRef(null),
        position: useRef(null),
        resume:   useRef(null),
        message:  useRef(null)
    };

    // Errors are recalculated every render, but only shown once a field
    // has been visited — nobody wants to be told the name is wrong
    // before they have finished typing it.
    const errors = Validators.check(values, APPLY_RULES);
    const showError = (field) => (touched[field] ? errors[field] : '') || serverFields[field] || '';

    function update(field, value) {
        setValues((prev) => ({ ...prev, [field]: value }));
        setServerFields((prev) => ({ ...prev, [field]: '' }));
    }

    function markTouched(field) {
        setTouched((prev) => ({ ...prev, [field]: true }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const all = {};
        FIELD_ORDER.forEach((f) => { all[f] = true; });
        setTouched(all);

        const firstBad = FIELD_ORDER.find((f) => errors[f]);
        if (firstBad) {
            const el = refs[firstBad].current;
            if (el) {
                el.focus();
                el.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
            return;
        }

        // FormData, not JSON, because the resume is a file
        const form = new FormData(event.currentTarget);
        setSubmitting(true);
        setServerError('');
        try {
            const data = await api('apply', { body: form });
            navigate('/apply', { state: { name: values.fullName.trim(), reference: data.reference } });
        } catch (error) {
            setServerError(error.message);
            setServerFields(error.fields);
            setSubmitting(false);
        }
    }

    const invalidProps = (field) => ({
        'aria-invalid': !!showError(field),
        'aria-describedby': showError(field) ? field + '-error' : undefined,
        onBlur: () => markTouched(field)
    });

    return (
        <form className="form-card" onSubmit={handleSubmit} noValidate>
            {serverError && (
                <div className="alert alert-error" role="alert">
                    <i className="fa-solid fa-circle-exclamation"></i> {serverError}
                </div>
            )}

            <div className="form-grid">

                <ApplyField id="fullName" label="Full Name" required error={showError('fullName')}>
                    <input
                        ref={refs.fullName}
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder="e.g. Tan Wei Ling"
                        maxLength={100}
                        value={values.fullName}
                        onChange={(e) => update('fullName', e.target.value)}
                        {...invalidProps('fullName')}
                    />
                </ApplyField>

                <ApplyField id="email" label="Email Address" required error={showError('email')}>
                    <input
                        ref={refs.email}
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        maxLength={255}
                        value={values.email}
                        onChange={(e) => update('email', e.target.value)}
                        {...invalidProps('email')}
                    />
                </ApplyField>

                <ApplyField id="contact" label="Contact Number" required error={showError('contact')}>
                    <input
                        ref={refs.contact}
                        id="contact"
                        name="contact"
                        type="tel"
                        placeholder="9123 4567"
                        value={values.contact}
                        onChange={(e) => update('contact', e.target.value)}
                        {...invalidProps('contact')}
                    />
                </ApplyField>

                <ApplyField id="position" label="Position Applying For" required error={showError('position')}>
                    <select
                        ref={refs.position}
                        id="position"
                        name="position"
                        value={values.position}
                        onChange={(e) => update('position', e.target.value)}
                        {...invalidProps('position')}
                    >
                        <option value="">-- Please select --</option>
                        {POSITIONS.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </ApplyField>

                <ApplyField
                    id="resume"
                    label="Upload Your Resume"
                    required
                    className="full"
                    error={showError('resume')}
                    hint={values.resume
                        ? values.resume.name + ' — ' + (values.resume.size / 1024 / 1024).toFixed(1) + ' MB'
                        : 'Accepted formats: PDF, DOC or DOCX. Maximum file size 5 MB.'}
                >
                    {/* A file input cannot be a controlled component, so its
                        value is read from the event and kept in state. */}
                    <input
                        ref={refs.resume}
                        id="resume"
                        name="resume"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                            update('resume', e.target.files[0] || null);
                            markTouched('resume');
                        }}
                        {...invalidProps('resume')}
                    />
                </ApplyField>

                <ApplyField
                    id="message"
                    label="Tell Us About Yourself"
                    className="full"
                    error={showError('message')}
                    hint={values.message.length > 1700
                        ? values.message.length + ' / 2000 characters'
                        : null}
                >
                    <textarea
                        ref={refs.message}
                        id="message"
                        name="message"
                        placeholder="A short note on your experience, what you are looking for, and when you could start."
                        value={values.message}
                        onChange={(e) => update('message', e.target.value)}
                        {...invalidProps('message')}
                    ></textarea>
                </ApplyField>

            </div>

            <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                    {submitting
                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Sending…</>
                        : <><i className="fa-regular fa-paper-plane"></i> Submit Application</>}
                </button>
                <p className="form-note">
                    By submitting you agree that we may keep your details on file for
                    2 months. Read our <a href="#">privacy policy</a>.
                </p>
            </div>
        </form>
    );
}
