/* ==========================================================
   Shared script for every page.
     1. Form helpers     – field error messages, show/hide password
     2. Navbar: search   – the search box next to the profile icon

   This file never talks to the server. Every form on the site is a
   normal HTML form that the browser submits to a PHP page.
   The profile icon in the navbar is a plain link to dashboard.php,
   which sends logged-out visitors to login.php.

   Helpers are shared through one global object, window.Smile.
   ========================================================== */

(function () {

    const Smile = {};
    window.Smile = Smile;


    /* ---------- 1. Form helpers ---------- */

    // Shows (or with an empty message, clears) the error under a field.
    // Expects the markup used across the site:
    //   <input id="email">  +  <span class="field-error" id="email-error" hidden></span>
    Smile.setFieldError = function (name, message) {
        const input = document.getElementById(name);
        const box = document.getElementById(name + '-error');
        const field = input && input.closest('.form-field');

        if (field) field.classList.toggle('has-error', !!message);
        if (input && input.matches('input, select, textarea')) {
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


    /* ---------- 2. Navbar: search box ---------- */

    document.querySelectorAll('.nav-search').forEach(function (form) {
        const input = form.querySelector('input');

        // on search.php, keep the current search in the box
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
