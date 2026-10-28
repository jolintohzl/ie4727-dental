/* ==========================================================
   dashboard.php — "My Account"

   PHP draws the whole page and handles every form (profile,
   cancel, reschedule, log out). This file only checks the
   profile form in the browser before it is submitted, so
   mistakes show up straight away. dashboard.php checks
   everything again, because the browser can be bypassed.
   ========================================================== */

(function () {

    const FIELDS = ['name', 'nric', 'phone', 'email'];
    const $ = function (id) { return document.getElementById(id); };

    const form = $('profile');
    if (!form) return;

    const rules = {
        name: Validators.name,
        nric: Validators.nric,
        phone: Validators.phone,
        email: Validators.email
    };

    // Check a field when the user leaves it, then keep it live while they fix it.
    FIELDS.forEach(function (field) {
        const input = $(field);
        input.addEventListener('blur', function () {
            Smile.setFieldError(field, rules[field](input.value));
        });
        input.addEventListener('input', function () {
            $('saveStatus').textContent = '';
            if (input.closest('.form-field').classList.contains('has-error')) {
                Smile.setFieldError(field, rules[field](input.value));
            }
        });
    });

    $('nric').addEventListener('input', function () {
        const pos = this.selectionStart;
        this.value = this.value.toUpperCase().replace(/\s/g, '');
        this.setSelectionRange(pos, pos);
    });

    // Only let the form go to the server once every field passes.
    form.addEventListener('submit', function (event) {
        const values = {};
        FIELDS.forEach(function (field) { values[field] = $(field).value; });
        const errors = Validators.check(values, rules);
        FIELDS.forEach(function (field) { Smile.setFieldError(field, errors[field] || ''); });

        const firstBad = FIELDS.find(function (field) { return errors[field]; });
        if (firstBad) {
            event.preventDefault();
            $(firstBad).focus();
        }
    });

})();
