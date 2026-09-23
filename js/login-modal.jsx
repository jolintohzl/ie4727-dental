/* ==========================================================
   Patient log-in modal — React.

   Loaded on every page with:
     <script type="text/babel" src="js/login-modal.jsx"></script>
   Babel (from the CDN) turns the JSX below into plain JavaScript
   in the browser, so there is no build step.

   Other scripts open it with Smile.openLogin({...}) — see js/site.js.
   Validation rules come from js/validators.js.
   ========================================================== */

const { useState, useEffect, useRef } = React;

const LOGIN_RULES = {
    email: Validators.email,
    password: Validators.loginPassword
};


/* ---------- One labelled input with its error message ---------- */
function Field({ id, label, error, children }) {
    return (
        <div className={'form-field' + (error ? ' has-error' : '')}>
            <label htmlFor={id}>{label}</label>
            {children}
            {error && <span className="field-error" id={id + '-error'} role="alert">{error}</span>}
        </div>
    );
}


/* ---------- The modal itself ---------- */
function LoginModal({ options, onClose }) {
    const [view, setView] = useState('login');              // 'login' | 'forgot'
    const [values, setValues] = useState({ email: '', password: '' });
    const [touched, setTouched] = useState({});             // fields the user has left
    const [serverError, setServerError] = useState('');
    const [serverFields, setServerFields] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const dialogRef = useRef(null);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    // Errors are worked out from the current values every render,
    // but only shown once a field has been visited (or on submit).
    const errors = Validators.check(values, LOGIN_RULES);
    const visibleError = (field) => serverFields[field] || (touched[field] ? errors[field] : '');

    // Focus the email box when the modal opens; lock the page behind it.
    useEffect(() => {
        const opener = document.activeElement;
        document.body.classList.add('modal-open');
        emailRef.current && emailRef.current.focus();
        return () => {
            document.body.classList.remove('modal-open');
            opener && opener.focus && opener.focus();
        };
    }, []);

    // Escape closes; Tab stays inside the dialog.
    useEffect(() => {
        function onKey(event) {
            if (event.key === 'Escape') {
                onClose();
            } else if (event.key === 'Tab' && dialogRef.current) {
                const focusable = dialogRef.current.querySelectorAll('button, [href], input');
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    function update(field, value) {
        setValues((prev) => ({ ...prev, [field]: value }));
        setServerError('');
        setServerFields((prev) => ({ ...prev, [field]: '' }));
    }

    function markTouched(field) {
        setTouched((prev) => ({ ...prev, [field]: true }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setTouched({ email: true, password: true });

        if (errors.email) { emailRef.current.focus(); return; }
        if (errors.password) { passwordRef.current.focus(); return; }

        setSubmitting(true);
        setServerError('');
        try {
            const data = await Smile.api('login.php', {
                body: { email: values.email.trim(), password: values.password }
            });
            Smile.setPatient(data.patient);
            onClose(true);
            if (options.onSuccess) {
                options.onSuccess(data.patient);
            } else {
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            setServerError(error.message);
            setServerFields(error.fields || {});
            setValues((prev) => ({ ...prev, password: '' }));
            passwordRef.current && passwordRef.current.focus();
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal" role="dialog" aria-modal="true" aria-labelledby="loginTitle" ref={dialogRef}>

                <button type="button" className="modal-close" aria-label="Close" onClick={() => onClose()}>
                    <i className="fa-solid fa-xmark"></i>
                </button>

                {view === 'login' ? (
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="modal-head">
                            <div className="modal-icon"><i className="fa-regular fa-user"></i></div>
                            <h2 id="loginTitle">Patient Log in</h2>
                            <p>{options.message || 'Log in to manage your profile and appointments.'}</p>
                        </div>

                        {serverError && (
                            <div className="alert alert-error" role="alert">
                                <i className="fa-solid fa-circle-exclamation"></i> {serverError}
                            </div>
                        )}

                        <Field id="loginEmail" label="Email" error={visibleError('email')}>
                            <input
                                ref={emailRef}
                                id="loginEmail"
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                value={values.email}
                                aria-invalid={!!visibleError('email')}
                                aria-describedby={visibleError('email') ? 'loginEmail-error' : undefined}
                                onChange={(e) => update('email', e.target.value)}
                                onBlur={() => markTouched('email')}
                            />
                        </Field>

                        <Field id="loginPassword" label="Password" error={visibleError('password')}>
                            <div className="password-wrap">
                                <input
                                    ref={passwordRef}
                                    id="loginPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="Your password"
                                    value={values.password}
                                    aria-invalid={!!visibleError('password')}
                                    aria-describedby={visibleError('password') ? 'loginPassword-error' : undefined}
                                    onChange={(e) => update('password', e.target.value)}
                                    onBlur={() => markTouched('password')}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'}></i>
                                </button>
                            </div>
                        </Field>

                        <button type="button" className="link-button forgot-link" onClick={() => setView('forgot')}>
                            Forgot password?
                        </button>

                        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                            {submitting
                                ? <><i className="fa-solid fa-spinner fa-spin"></i> Logging in…</>
                                : 'Log in'}
                        </button>

                        <p className="modal-foot">
                            New patient? Your account is created when you{' '}
                            <a href="appointment.html">book your first appointment</a>.
                        </p>
                    </form>
                ) : (
                    <div>
                        <div className="modal-head">
                            <div className="modal-icon"><i className="fa-solid fa-key"></i></div>
                            <h2 id="loginTitle">Forgot your password?</h2>
                            <p>
                                For your privacy we reset passwords over the phone.
                                Call any of our clinics and we'll verify your NRIC/FIN
                                and set a new password for you.
                            </p>
                        </div>
                        <ul className="modal-contact">
                            <li><i className="fa-solid fa-phone"></i> <a href="tel:+6561234567">+65 6123 4567</a> (Orchard)</li>
                            <li><i className="fa-regular fa-envelope"></i> <a href="mailto:hello@smiledental.sg">hello@smiledental.sg</a></li>
                        </ul>
                        <button type="button" className="btn btn-outline btn-block" onClick={() => setView('login')}>
                            <i className="fa-solid fa-arrow-left"></i> Back to log in
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}


/* ---------- Keeps track of whether the modal is open ---------- */
function LoginRoot() {
    const [options, setOptions] = useState(null);   // null = closed
    const [openCount, setOpenCount] = useState(0);

    useEffect(() => {
        Smile.registerLoginModal((opts) => {
            setOptions(opts);
            setOpenCount((n) => n + 1);
        });
    }, []);

    if (!options) return null;

    // loggedIn is true when closing after a successful log in
    function close(loggedIn) {
        setOptions(null);
        if (!loggedIn && options.onCancel) options.onCancel();
    }

    // a new key every time it opens gives a fresh, empty form
    return <LoginModal key={openCount} options={options} onClose={close} />;
}


const loginMount = document.createElement('div');
loginMount.id = 'loginModalRoot';
document.body.appendChild(loginMount);
ReactDOM.createRoot(loginMount).render(<LoginRoot />);
