/* ==========================================================
   Patient log-in modal — plain JavaScript.

   Loaded on every page with:
     <script src="js/login-modal.js"></script>

   The modal's HTML is built once, here, and added to the end of
   <body>, so the pages themselves don't need a copy of it.

   Other scripts open it with Smile.openLogin({...}) — see js/site.js.
   Validation rules come from js/validators.js.
   ========================================================== */

(function () {

    const LOGIN_RULES = {
        loginEmail: Validators.email,
        loginPassword: Validators.loginPassword
    };


    /* ---------- 1. Build the modal ---------- */

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.id = 'loginModalRoot';
    backdrop.hidden = true;
    backdrop.innerHTML =
        '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="loginTitle">' +

            '<button type="button" class="modal-close" aria-label="Close">' +
                '<i class="fa-solid fa-xmark"></i>' +
            '</button>' +

            // View 1: the log-in form
            '<form id="loginForm" novalidate>' +
                '<div class="modal-head">' +
                    '<div class="modal-icon"><i class="fa-regular fa-user"></i></div>' +
                    '<h2 id="loginTitle">Patient Log in</h2>' +
                    '<p id="loginMessage"></p>' +
                '</div>' +

                '<div class="alert alert-error" role="alert" id="loginServerError" hidden></div>' +

                '<div class="form-field">' +
                    '<label for="loginEmail">Email</label>' +
                    '<input id="loginEmail" type="email" autocomplete="email" placeholder="you@example.com">' +
                    '<span class="field-error" id="loginEmail-error" role="alert" hidden></span>' +
                '</div>' +

                '<div class="form-field">' +
                    '<label for="loginPassword">Password</label>' +
                    '<div class="password-wrap">' +
                        '<input id="loginPassword" type="password" autocomplete="current-password" placeholder="Your password">' +
                        // data-toggles is picked up by the show/hide handler in site.js
                        '<button type="button" class="password-toggle" data-toggles="loginPassword" aria-label="Show password">' +
                            '<i class="fa-regular fa-eye"></i>' +
                        '</button>' +
                    '</div>' +
                    '<span class="field-error" id="loginPassword-error" role="alert" hidden></span>' +
                '</div>' +

                '<button type="button" class="link-button forgot-link" id="forgotLink">Forgot password?</button>' +

                '<button type="submit" class="btn btn-primary btn-lg btn-block" id="loginSubmit">Log in</button>' +

                '<p class="modal-foot">' +
                    'New patient? Your account is created when you ' +
                    '<a href="appointment.html">book your first appointment</a>.' +
                '</p>' +
            '</form>' +

            // View 2: forgot password
            '<div id="forgotView" hidden>' +
                '<div class="modal-head">' +
                    '<div class="modal-icon"><i class="fa-solid fa-key"></i></div>' +
                    '<h2>Forgot your password?</h2>' +
                    '<p>' +
                        'For your privacy we reset passwords over the phone. ' +
                        'Call any of our clinics and we\'ll verify your NRIC/FIN ' +
                        'and set a new password for you.' +
                    '</p>' +
                '</div>' +
                '<ul class="modal-contact">' +
                    '<li><i class="fa-solid fa-phone"></i> <a href="tel:+6561234567">+65 6123 4567</a> (Orchard)</li>' +
                    '<li><i class="fa-regular fa-envelope"></i> <a href="mailto:hello@smiledental.sg">hello@smiledental.sg</a></li>' +
                '</ul>' +
                '<button type="button" class="btn btn-outline btn-block" id="backToLogin">' +
                    '<i class="fa-solid fa-arrow-left"></i> Back to log in' +
                '</button>' +
            '</div>' +

        '</div>';
    document.body.appendChild(backdrop);

    const dialog       = backdrop.querySelector('.modal');
    const form         = document.getElementById('loginForm');
    const forgotView   = document.getElementById('forgotView');
    const messageBox   = document.getElementById('loginMessage');
    const serverBox    = document.getElementById('loginServerError');
    const emailInput   = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const submitButton = document.getElementById('loginSubmit');


    /* ---------- 2. Open / close ---------- */

    let options = null;      // what Smile.openLogin() was called with; null = closed
    let opener = null;       // element to give focus back to on close
    let touched = {};        // fields the user has left

    function open(opts) {
        options = opts;
        opener = document.activeElement;
        touched = {};

        // start every time with a fresh, empty form
        form.reset();
        passwordInput.type = 'password';
        const eye = form.querySelector('.password-toggle');
        eye.setAttribute('aria-label', 'Show password');
        eye.innerHTML = '<i class="fa-regular fa-eye"></i>';
        showServerError('');
        Smile.setFieldError('loginEmail', '');
        Smile.setFieldError('loginPassword', '');
        showView('login');
        messageBox.textContent = options.message || 'Log in to manage your profile and appointments.';

        backdrop.hidden = false;
        document.body.classList.add('modal-open');
        emailInput.focus();
    }

    // loggedIn is true when closing after a successful log in
    function close(loggedIn) {
        if (!options) return;
        const closing = options;
        options = null;

        backdrop.hidden = true;
        document.body.classList.remove('modal-open');
        if (opener && opener.focus) opener.focus();

        if (!loggedIn && closing.onCancel) closing.onCancel();
    }

    function showView(view) {
        form.hidden = view !== 'login';
        forgotView.hidden = view !== 'forgot';
    }

    Smile.registerLoginModal(open);

    backdrop.querySelector('.modal-close').addEventListener('click', function () { close(); });
    document.getElementById('forgotLink').addEventListener('click', function () { showView('forgot'); });
    document.getElementById('backToLogin').addEventListener('click', function () { showView('login'); });

    // clicking the dark area outside the box closes it
    backdrop.addEventListener('mousedown', function (event) {
        if (event.target === backdrop) close();
    });

    // Escape closes; Tab stays inside the dialog
    document.addEventListener('keydown', function (event) {
        if (!options) return;

        if (event.key === 'Escape') {
            close();
        } else if (event.key === 'Tab') {
            // only the buttons, links and inputs that are currently visible
            const focusable = Array.prototype.filter.call(
                dialog.querySelectorAll('button, [href], input'),
                function (el) { return el.offsetParent !== null; }
            );
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
    });


    /* ---------- 3. Validation ---------- */

    function currentErrors() {
        return Validators.check({
            loginEmail: emailInput.value,
            loginPassword: passwordInput.value
        }, LOGIN_RULES);
    }

    // Only show a field's error once it has been visited (or on submit)
    function showErrors() {
        const errors = currentErrors();
        Object.keys(LOGIN_RULES).forEach(function (field) {
            Smile.setFieldError(field, touched[field] ? (errors[field] || '') : '');
        });
        return errors;
    }

    function showServerError(message) {
        serverBox.innerHTML = message
            ? '<i class="fa-solid fa-circle-exclamation"></i> ' + Smile.escapeHtml(message)
            : '';
        serverBox.hidden = !message;
    }

    [emailInput, passwordInput].forEach(function (input) {
        input.addEventListener('blur', function () {
            touched[input.id] = true;
            showErrors();
        });
        // typing clears the server's message and re-checks a visited field
        input.addEventListener('input', function () {
            showServerError('');
            showErrors();
        });
    });


    /* ---------- 4. Submitting ---------- */

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        touched = { loginEmail: true, loginPassword: true };
        const errors = showErrors();

        if (errors.loginEmail) { emailInput.focus(); return; }
        if (errors.loginPassword) { passwordInput.focus(); return; }

        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in…';
        showServerError('');

        // remember these before close() clears options
        const onSuccess = options.onSuccess;

        try {
            const data = await Smile.api('login.php', {
                body: { email: emailInput.value.trim(), password: passwordInput.value }
            });
            Smile.setPatient(data.patient);
            close(true);
            if (onSuccess) {
                onSuccess(data.patient);
            } else {
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            showServerError(error.message);
            // the server may name the field it didn't like
            const fields = error.fields || {};
            if (fields.email) Smile.setFieldError('loginEmail', fields.email);
            if (fields.password) Smile.setFieldError('loginPassword', fields.password);
            passwordInput.value = '';
            passwordInput.focus();
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Log in';
        }
    });

})();
