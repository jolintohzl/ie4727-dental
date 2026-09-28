/* ==========================================================
   Job application form — React (about-us.html)

   Loaded with:
     <script type="text/babel" src="js/apply-form.jsx"></script>
   Babel turns the JSX below into plain JavaScript in the browser,
   so there is no build step — same approach as js/login-modal.jsx.

   Validation rules live in js/validators.js so the booking form,
   the login modal and this form all agree on what a valid name,
   email or phone number looks like.

   Everything is wrapped in an IIFE. Without it, `const { useState }`
   here would clash with the same line at the top of login-modal.jsx
   ("Identifier 'useState' has already been declared") because both
   files run as plain scripts sharing one global scope.
   ========================================================== */

(function () {

    const { useState, useRef } = React;

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


    function ApplicationForm() {
        const blank = { fullName: '', email: '', contact: '', position: '', resume: null, message: '' };

        const [values, setValues]     = useState(blank);
        const [touched, setTouched]   = useState({});   // fields the user has left
        const [sent, setSent]         = useState(null); // the server's reply once accepted
        const [serverError, setError] = useState('');
        const [serverFields, setServerFields] = useState({});
        const [submitting, setSubmitting]     = useState(false);

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
        const showError = (field) =>
            serverFields[field] || (touched[field] ? errors[field] : '');

        function update(field, value) {
            setValues((prev) => ({ ...prev, [field]: value }));
            setSent(null);
            setError('');
            setServerFields((prev) => ({ ...prev, [field]: '' }));
        }

        function markTouched(field) {
            setTouched((prev) => ({ ...prev, [field]: true }));
        }

        async function handleSubmit(event) {
            event.preventDefault();
            setSent(null);      // a fresh attempt clears the last success banner
            setError('');

            // On submit every field counts as visited, so nothing stays hidden.
            const all = {};
            FIELD_ORDER.forEach((f) => { all[f] = true; });
            setTouched(all);

            const firstBad = FIELD_ORDER.find((f) => errors[f]);
            if (firstBad) {
                const el = refs[firstBad].current;
                el && el.focus();
                el && el.scrollIntoView({ block: 'center', behavior: 'smooth' });
                return;
            }

            // FormData, not JSON, because of the file. Smile.api spots it and
            // lets the browser set the multipart Content-Type itself.
            const body = new FormData();
            body.append('fullName', values.fullName.trim());
            body.append('email', values.email.trim());
            body.append('contact', values.contact);
            body.append('position', values.position);
            body.append('message', values.message);
            body.append('resume', values.resume);

            setSubmitting(true);
            try {
                const data = await Smile.api('apply.php', { body: body });
                setSent(data);
                setValues(blank);
                setTouched({});
                if (refs.resume.current) refs.resume.current.value = '';
            } catch (err) {
                setError(err.message);
                setServerFields(err.fields || {});
                // jump to whichever field the server objected to
                const bad = FIELD_ORDER.find((f) => (err.fields || {})[f]);
                if (bad && refs[bad].current) {
                    refs[bad].current.focus();
                    refs[bad].current.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
            } finally {
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

                {sent && (
                    <div className="alert alert-success" role="status">
                        <i className="fa-solid fa-circle-check"></i>
                        <span>
                            Thanks — your application for <strong>{sent.position}</strong> has
                            been received. Your reference is <strong>{sent.reference}</strong>,
                            and a confirmation is on its way to your inbox.
                        </span>
                    </div>
                )}

                {serverError && (
                    <div className="alert alert-error" role="alert">
                        <i className="fa-solid fa-circle-exclamation"></i>
                        <span>{serverError}</span>
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


    // The plain HTML form inside this div is the no-JavaScript fallback;
    // createRoot() clears it and renders the React version in its place.
    const mount = document.getElementById('applyFormRoot');
    if (mount) {
        ReactDOM.createRoot(mount).render(<ApplicationForm />);
    }

})();
