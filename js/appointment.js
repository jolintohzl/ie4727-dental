/* ==========================================================
   appointment.php — the booking form, in the browser.

   PHP draws one step at a time and every button submits the
   form back to it. This file never talks to the server: it only
   checks the current step before the form is sent, so mistakes
   show up straight away, and keeps a few labels up to date.
   appointment.php checks everything again.
   ========================================================== */

(function () {

    const form = document.getElementById('bookingForm');
    if (!form) return;   // the confirmation page has no form

    const $ = function (id) { return document.getElementById(id); };
    const step = Number(form.dataset.step);

    // Shows the messages, and moves to the first field with a problem.
    function showErrors(errors, order) {
        order.forEach(function (field) { Smile.setFieldError(field, errors[field] || ''); });
        const first = order.find(function (field) { return errors[field]; });
        if (!first) return false;
        const target = $(first) || $(first + '-error');
        const anchor = target.closest('.form-field, fieldset, .panel') || target;
        anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (target.matches('input, select')) target.focus({ preventScroll: true });
        return true;
    }

    // Each step's check runs only for Next / Confirm, never for Back,
    // a calendar day or a timeslot.
    function onNext(check) {
        form.addEventListener('submit', function (event) {
            const button = event.submitter;
            if (!button || button.name !== 'nav' || button.value !== 'next') return;
            if (check()) event.preventDefault();
        });
    }


    /* ---------- STEP 1 — patient details ---------- */

    if (step === 1) {
        const passwordBox = $('password');
        const fields = ['name', 'nric', 'phone', 'email'];
        if (passwordBox) fields.push('password', 'confirmPassword');

        // A guest who already set a password this visit may leave both boxes blank.
        function keepingPassword() {
            return passwordBox && passwordBox.hasAttribute('data-saved') &&
                !passwordBox.value && !$('confirmPassword').value;
        }

        const rules = {
            name: Validators.name,
            nric: Validators.nric,
            phone: Validators.phone,
            email: Validators.email,
            password: function (value) { return keepingPassword() ? '' : Validators.newPassword(value); },
            confirmPassword: function (value, values) {
                return keepingPassword() ? '' : Validators.confirmPassword(value, values.password);
            }
        };

        function readDetails() {
            const values = {};
            fields.forEach(function (field) { values[field] = $(field).value; });
            return values;
        }

        // Check a field as soon as the user leaves it, then keep it live
        // while they fix it — but don't nag while they are typing it the first time.
        fields.forEach(function (field) {
            const input = $(field);
            input.addEventListener('blur', function () {
                if (!input.value) return;
                Smile.setFieldError(field, rules[field](input.value, readDetails()));
            });
            input.addEventListener('input', function () {
                if (input.closest('.form-field').classList.contains('has-error')) {
                    Smile.setFieldError(field, rules[field](input.value, readDetails()));
                }
                // re-check "confirm" when the first password changes
                if (field === 'password' && $('confirmPassword').value) {
                    Smile.setFieldError('confirmPassword', rules.confirmPassword($('confirmPassword').value, readDetails()));
                }
            });
        });

        // tidy up NRIC as it is typed
        $('nric').addEventListener('input', function () {
            const pos = this.selectionStart;
            this.value = this.value.toUpperCase().replace(/\s/g, '');
            this.setSelectionRange(pos, pos);
        });

        onNext(function () {
            const values = readDetails();
            const stepRules = {};
            fields.forEach(function (field) { stepRules[field] = rules[field]; });
            return showErrors(Validators.check(values, stepRules), fields);
        });
    }


    /* ---------- STEP 2 — service + branch ---------- */

    if (step === 2) {
        const select = $('serviceId');

        // "What it is + price from" under the menu
        select.addEventListener('change', function () {
            const option = select.options[select.selectedIndex];
            $('serviceHint').textContent = option.dataset.hint || '';
            Smile.setFieldError('serviceId', '');
        });
        $('branchOptions').addEventListener('change', function () {
            Smile.setFieldError('branchId', '');
        });

        onNext(function () {
            const errors = {};
            if (!select.value) errors.serviceId = 'Please choose a service.';
            if (!form.querySelector('input[name="branchId"]:checked')) errors.branchId = 'Please choose a branch.';
            return showErrors(errors, ['serviceId', 'branchId']);
        });
    }


    /* ---------- STEP 3 — date + time ---------- */

    if (step === 3) {
        onNext(function () {
            const errors = {};
            if (!form.querySelector('.calendar-day.is-selected')) errors.date = 'Please choose a date.';
            else if (!form.querySelector('.slot.is-selected')) errors.time = 'Please choose a time.';
            return showErrors(errors, ['date', 'time']);
        });
    }


    /* ---------- STEP 4 — doctor + confirm ---------- */

    if (step === 4) {
        // the summary's "Doctor" line follows the choice
        const doctorLine = form.querySelectorAll('.summary-list dd')[1];
        $('doctorOptions').addEventListener('change', function (event) {
            doctorLine.textContent = event.target.dataset.name;
            doctorLine.classList.remove('is-missing');
            Smile.setFieldError('doctorId', '');
        });

        onNext(function () {
            const errors = {};
            if (!form.querySelector('input[name="doctorId"]:checked')) errors.doctorId = 'Please choose a doctor.';
            return showErrors(errors, ['doctorId']);
        });

        // one click is enough: stop a double booking from a double click
        form.addEventListener('submit', function (event) {
            if (event.defaultPrevented || !event.submitter || event.submitter.id !== 'confirmBtn') return;
            const button = $('confirmBtn');
            setTimeout(function () {
                button.disabled = true;
                button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Booking…';
            }, 0);
        });
    }

})();
