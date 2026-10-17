/* ==========================================================
   Job application form — plain JavaScript (about-us.html)

   Loaded with:
     <script src="js/apply-form.js"></script>

   The form itself is written in about-us.html and posts the
   old-fashioned way: action="apply.php" method="post", so the
   browser submits it and PHP renders the result page. This file
   only catches mistakes before the round trip — it never sends the
   data itself, and there is no fetch/AJAX or JSON anywhere in it.

   Validation rules live in js/validators.js so the booking form,
   the login modal and this form all agree on what a valid name,
   email or phone number looks like.
   ========================================================== */

(function () {

    const form = document.getElementById('applyForm');
    if (!form) return;

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

    const RESUME_HINT = 'Accepted formats: PDF, DOC or DOCX. Maximum file size 5 MB.';

    const resumeHint  = document.getElementById('resume-hint');
    const messageHint = document.getElementById('message-hint');
    const submitButton = document.getElementById('applySubmit');

    let touched = {};    // fields the user has left


    /* ---------- Reading and checking the fields ---------- */

    function currentValues() {
        const resumeInput = document.getElementById('resume');
        return {
            fullName: document.getElementById('fullName').value,
            email:    document.getElementById('email').value,
            contact:  document.getElementById('contact').value,
            position: document.getElementById('position').value,
            resume:   resumeInput.files[0] || null,    // the File object, not its name
            message:  document.getElementById('message').value
        };
    }

    // Errors are worked out on every change, but only shown once a field
    // has been visited — nobody wants to be told the name is wrong
    // before they have finished typing it.
    function refresh() {
        const values = currentValues();
        const errors = Validators.check(values, APPLY_RULES);

        FIELD_ORDER.forEach(function (field) {
            Smile.setFieldError(field, touched[field] ? (errors[field] || '') : '');
        });

        // Resume hint: show the chosen file's name and size. Hidden while there is an error.
        resumeHint.textContent = values.resume
            ? values.resume.name + ' — ' + (values.resume.size / 1024 / 1024).toFixed(1) + ' MB'
            : RESUME_HINT;
        resumeHint.hidden = !!(touched.resume && errors.resume);

        // Message hint: a character counter once they get close to the limit.
        const length = values.message.length;
        messageHint.textContent = length + ' / 2000 characters';
        messageHint.hidden = length <= 1700 || !!(touched.message && errors.message);

        return errors;
    }


    /* ---------- Listening to the fields ---------- */

    FIELD_ORDER.forEach(function (field) {
        const input = document.getElementById(field);

        input.addEventListener('blur', function () {
            touched[field] = true;
            refresh();
        });
        input.addEventListener('input', refresh);
        input.addEventListener('change', function () {
            // a file picker has no "typing" — choosing a file counts as visiting it
            if (field === 'resume') touched.resume = true;
            refresh();
        });
    });


    /* ---------- Submitting ---------- */

    // Only steps in when something is wrong. If every field is valid this
    // returns without calling preventDefault(), so the browser performs a
    // normal form POST to apply.php and PHP takes over from there.
    form.addEventListener('submit', function (event) {
        FIELD_ORDER.forEach(function (field) { touched[field] = true; });
        const errors = refresh();

        const firstBad = FIELD_ORDER.find(function (field) { return errors[field]; });
        if (firstBad) {
            event.preventDefault();
            const el = document.getElementById(firstBad);
            el.focus();
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
            return;
        }

        // stops an impatient second click
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
    });

    // If the user comes back with the browser's Back button, the page can be
    // restored from cache with the button still disabled — switch it back on.
    window.addEventListener('pageshow', function () {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fa-regular fa-paper-plane"></i> Submit Application';
    });

})();
