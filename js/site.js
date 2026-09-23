/* ==========================================================
   Shared script for every page.
     1. Smile.api()        – talks to the PHP files in /api
     2. Small formatters   – dates, times, safe HTML
     3. Login state        – who is logged in, log in / log out
     4. Navbar: account    – profile icon → log-in modal or dashboard
     5. Navbar: search     – the search box next to the profile icon

   Everything is shared through one global object, window.Smile,
   so the other scripts (booking page, dashboard, React login modal)
   can use it.
   ========================================================== */

(function () {

    const Smile = {};
    window.Smile = Smile;


    /* ---------- 1. Talking to the server ---------- */

    // An error that remembers the HTTP status and any per-field messages
    // ({ email: 'Already taken' }) so forms can show them under the inputs.
    function ApiError(message, status, fields) {
        this.name = 'ApiError';
        this.message = message;
        this.status = status;
        this.fields = fields || {};
    }
    ApiError.prototype = Object.create(Error.prototype);
    Smile.ApiError = ApiError;

    // Smile.api('login.php', { body: { email, password } })  → POST with JSON
    // Smile.api('slots.php?date=...')                         → GET
    Smile.api = async function (path, options) {
        options = options || {};
        const init = {
            method: options.method || 'GET',
            credentials: 'same-origin',
            headers: { 'Accept': 'application/json' }
        };
        if (options.body !== undefined) {
            init.method = options.method || 'POST';
            init.headers['Content-Type'] = 'application/json';
            init.body = JSON.stringify(options.body);
        }

        let response;
        try {
            response = await fetch('api/' + path, init);
        } catch (e) {
            throw new ApiError('Could not reach the server. Please check your connection and try again.', 0);
        }

        let data;
        try {
            data = await response.json();
        } catch (e) {
            // usually means the page was opened without PHP running
            throw new ApiError('The server is not responding. Open the site through XAMPP (http://localhost/...) with Apache and MySQL started.', response.status);
        }

        if (!response.ok || !data.ok) {
            throw new ApiError(data.error || 'Something went wrong. Please try again.', response.status, data.fields);
        }
        return data;
    };


    /* ---------- 2. Formatters ---------- */

    const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                    'August', 'September', 'October', 'November', 'December'];
    Smile.MONTHS = MONTHS;

    // "2026-09-16" → a Date at local midnight (new Date("2026-09-16") would be UTC)
    Smile.parseDate = function (iso) {
        const parts = iso.split('-').map(Number);
        return new Date(parts[0], parts[1] - 1, parts[2]);
    };

    // Date → "2026-09-16"
    Smile.toIsoDate = function (date) {
        return date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
    };

    // "2026-09-16" → "Wed, 16 September 2026"
    Smile.formatDate = function (iso) {
        const d = Smile.parseDate(iso);
        return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    };

    // "13:30" → "1.30pm"   (same style as the opening hours on locate-us.html)
    Smile.formatTime = function (hhmm) {
        const parts = hhmm.split(':').map(Number);
        const suffix = parts[0] >= 12 ? 'pm' : 'am';
        const hour = parts[0] % 12 || 12;
        return hour + '.' + String(parts[1]).padStart(2, '0') + suffix;
    };

    // Anything typed by a user must go through this before being put into innerHTML.
    Smile.escapeHtml = function (value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    // Shows (or with an empty message, clears) the error under a field.
    // Expects the markup used across the site:
    //   <input id="email">  +  <span class="field-error" id="email-error" hidden></span>
    Smile.setFieldError = function (name, message) {
        const input = document.getElementById(name);
        const box = document.getElementById(name + '-error');
        const field = input && input.closest('.form-field');

        if (field) field.classList.toggle('has-error', !!message);
        if (input && input.matches('input, select')) {
            if (message) {
                input.setAttribute('aria-invalid', 'true');
                input.setAttribute('aria-describedby', name + '-error');
            } else {
                input.removeAttribute('aria-invalid');
                input.removeAttribute('aria-describedby');
            }
        }
        if (box) {
            box.textContent = message || '';
            box.hidden = !message;
        }
    };

    // Show / hide password eye buttons:  <button class="password-toggle" data-toggles="password">
    document.addEventListener('click', function (event) {
        const button = event.target.closest('.password-toggle[data-toggles]');
        if (!button) return;
        const input = document.getElementById(button.dataset.toggles);
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        button.innerHTML = show ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
    });

    // "Jaslyn Tan" → "JT"
    Smile.initials = function (name) {
        return String(name || '').trim().split(/\s+/).slice(0, 2)
            .map(function (word) { return word.charAt(0).toUpperCase(); }).join('');
    };


    /* ---------- 3. Login state ---------- */

    let sessionPromise = null;

    // Resolves to { loggedIn: true/false, patient: {...} | null }.
    // The answer is cached; pass true to ask the server again.
    Smile.getSession = function (refresh) {
        if (!sessionPromise || refresh) {
            sessionPromise = Smile.api('session.php').catch(function () {
                return { loggedIn: false, patient: null, offline: true };
            });
        }
        return sessionPromise;
    };

    // Call after logging in / out / editing the profile.
    // Other scripts listen for the "smile:auth" event to update themselves.
    Smile.setPatient = function (patient) {
        sessionPromise = Promise.resolve({ loggedIn: !!patient, patient: patient || null });
        document.dispatchEvent(new CustomEvent('smile:auth', { detail: { patient: patient || null } }));
    };

    Smile.logout = async function () {
        await Smile.api('logout.php', { body: {} });
        Smile.setPatient(null);
    };

    // The login modal is written in React (js/login-modal.jsx) and loads a
    // moment after this file. Calls made before it is ready wait in a queue.
    //
    // Smile.openLogin({
    //     onSuccess: function (patient) { ... },   // default: go to the dashboard
    //     onCancel:  function () { ... },
    //     message:   'Log in to see your appointments'
    // });
    const loginQueue = [];
    let showLogin = null;

    Smile.openLogin = function (options) {
        if (showLogin) {
            showLogin(options || {});
        } else {
            loginQueue.push(options || {});
        }
    };

    Smile.registerLoginModal = function (show) {
        showLogin = show;
        while (loginQueue.length) {
            showLogin(loginQueue.shift());
        }
    };


    /* ---------- 4. Navbar: profile icon ---------- */

    const accountBtn = document.getElementById('accountBtn');

    function paintAccountButton(patient) {
        if (!accountBtn) return;
        if (patient) {
            accountBtn.classList.add('is-signed-in');
            accountBtn.innerHTML = '<span class="account-initials">' + Smile.escapeHtml(Smile.initials(patient.name)) + '</span>';
            accountBtn.setAttribute('aria-label', 'My account (' + patient.name + ')');
            accountBtn.title = 'My account';
        } else {
            accountBtn.classList.remove('is-signed-in');
            accountBtn.innerHTML = '<i class="fa-regular fa-user"></i>';
            accountBtn.setAttribute('aria-label', 'Log in');
            accountBtn.title = 'Log in';
        }
    }

    if (accountBtn) {
        // The link already points at dashboard.html. When nobody is logged in
        // we open the login modal instead, then continue to the dashboard.
        accountBtn.addEventListener('click', function (event) {
            if (!accountBtn.classList.contains('is-signed-in')) {
                event.preventDefault();
                Smile.openLogin({
                    onSuccess: function () { window.location.href = 'dashboard.html'; }
                });
            }
        });

        Smile.getSession().then(function (session) { paintAccountButton(session.patient); });
        document.addEventListener('smile:auth', function (event) { paintAccountButton(event.detail.patient); });
    }


    /* ---------- 5. Navbar: search box ---------- */

    document.querySelectorAll('.nav-search').forEach(function (form) {
        const input = form.querySelector('input');

        // on search.html, keep the current search in the box
        if (/search\.html$/.test(window.location.pathname)) {
            input.value = new URLSearchParams(window.location.search).get('q') || '';
        }

        // the top-row box collapses to an icon, but stays open while it has text
        function syncOpen() { form.classList.toggle('is-open', input.value.trim() !== ''); }
        syncOpen();
        input.addEventListener('input', syncOpen);

        // Esc closes it again
        input.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                input.value = '';
                syncOpen();
                input.blur();
            }
        });

        // don't send an all-spaces search
        // (this is also what opens the collapsed box: clicking the icon focuses the input)
        form.addEventListener('submit', function (event) {
            input.value = input.value.trim();
            if (!input.value) {
                event.preventDefault();
                input.focus();
            }
        });
    });

})();
