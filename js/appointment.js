/* ==========================================================
   appointment.html — the booking form.

   A 4-step wizard — one step ("page") shows at a time:
     1. patient details  (or log in to fill them in)
     2. service + branch
     3. date on the calendar → timeslot
     4. doctor who is free at that time + summary
     → confirm → success message
   Each step gets its own #step-N address, so the browser's
   back button goes to the previous step.

   Server side: api/options.php, api/slots.php, api/book.php
   ========================================================== */

(function () {

    const PATIENT_FIELDS = ['name', 'nric', 'phone', 'email'];
    const ACCOUNT_FIELDS = ['password', 'confirmPassword'];

    const form = document.getElementById('bookingForm');
    const $ = function (id) { return document.getElementById(id); };

    // Everything the page knows, in one place.
    const state = {
        options: null,     // services, branches, doctors from the server
        patient: null,     // logged-in patient, or null
        serviceId: null,
        branchId: null,
        date: null,        // "2026-09-16"
        time: null,        // "13:30"
        doctorId: null,
        month: null,       // Date: first day of the month the calendar shows
        slots: [],         // [{ time, freeDoctors: [ids] }] for state.date
        slotsRequest: 0,   // ignores slow replies that arrive after a newer one
        step: 1,           // which step of the wizard is showing
        booked: false      // true once the booking has gone through
    };


    /* ---------- Little lookups ---------- */

    function service() {
        return state.options.services.find(function (s) { return s.id === state.serviceId; });
    }
    function branch() {
        return state.options.branches.find(function (b) { return b.id === state.branchId; });
    }
    function doctor() {
        return state.options.doctors.find(function (d) { return d.id === state.doctorId; });
    }
    function doctorsForService() {
        return state.options.doctors.filter(function (d) {
            return d.serviceIds.indexOf(state.serviceId) !== -1;
        });
    }
    function selectedSlot() {
        return state.slots.find(function (s) { return s.time === state.time; });
    }
    function today() {
        return Smile.parseDate(state.options.today);   // Singapore date from the server
    }
    function lastBookableDay() {
        const d = today();
        d.setDate(d.getDate() + state.options.bookingWindowDays);
        return d;
    }
    function branchOpenOn(date) {
        return !!branch().hours[date.getDay()];
    }


    /* ==========================================================
       STEP 1 — patient details
       ========================================================== */

    function showPatient(patient) {
        state.patient = patient;
        const loggedIn = !!patient;

        $('accountGuest').hidden = loggedIn;
        $('accountMember').hidden = !loggedIn;
        $('memberName').textContent = loggedIn ? patient.name : '';

        // logged in: details come from the account and can't be edited here
        PATIENT_FIELDS.forEach(function (field) {
            const input = $(field);
            input.readOnly = loggedIn;
            input.value = loggedIn ? patient[field] : '';
            Smile.setFieldError(field, '');
        });

        // the password boxes are only for creating a new account
        form.querySelectorAll('[data-new-account]').forEach(function (el) {
            el.hidden = loggedIn;
        });
        ACCOUNT_FIELDS.forEach(function (field) {
            $(field).value = '';
            Smile.setFieldError(field, '');
        });
        if (state.options) updateSteps();
    }

    const rules = {
        name: Validators.name,
        nric: Validators.nric,
        phone: Validators.phone,
        email: Validators.email,
        password: Validators.newPassword,
        confirmPassword: function (value, values) { return Validators.confirmPassword(value, values.password); }
    };

    function readDetails() {
        const values = {};
        PATIENT_FIELDS.concat(ACCOUNT_FIELDS).forEach(function (field) {
            values[field] = $(field).value;
        });
        return values;
    }

    // Check a field as soon as the user leaves it, then keep it live
    // while they fix it — but don't nag while they are typing it the first time.
    PATIENT_FIELDS.concat(ACCOUNT_FIELDS).forEach(function (field) {
        const input = $(field);
        input.addEventListener('blur', function () {
            if (state.patient || !input.value) return;
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
        const input = $('nric');
        const pos = input.selectionStart;
        input.value = input.value.toUpperCase().replace(/\s/g, '');
        input.setSelectionRange(pos, pos);
    });

    $('bookingLoginBtn').addEventListener('click', function () {
        Smile.openLogin({
            message: 'Log in and we will fill in your details for you.',
            onSuccess: showPatient
        });
    });

    $('bookingLogoutBtn').addEventListener('click', async function () {
        try {
            await Smile.logout();
        } catch (error) {
            showBookingError(error.message);
        }
    });

    // keep in sync if the user logs in / out another way (e.g. the navbar)
    document.addEventListener('smile:auth', function (event) {
        showPatient(event.detail.patient);
    });


    /* ==========================================================
       STEP 2 — service + branch
       ========================================================== */

    function drawServices() {
        const select = $('serviceId');
        select.innerHTML = '<option value="">Select a service</option>' +
            state.options.services.map(function (s) {
                return '<option value="' + s.id + '">' + Smile.escapeHtml(s.name) + '</option>';
            }).join('');
    }

    function drawBranches() {
        $('branchOptions').innerHTML = state.options.branches.map(function (b) {
            return (
                '<label class="choice-card">' +
                    '<input type="radio" name="branchId" value="' + b.id + '">' +
                    '<span class="choice-body">' +
                        '<img src="' + Smile.escapeHtml(b.mapImg) + '" alt="">' +
                        '<span class="choice-text">' +
                            '<span class="choice-title">' + Smile.escapeHtml(b.name) +
                                '<span class="choice-check"><i class="fa-solid fa-check"></i></span></span>' +
                            '<span class="choice-line">' + Smile.escapeHtml(b.address) + '</span>' +
                            '<span class="choice-line">' + hoursSummary(b) + '</span>' +
                        '</span>' +
                    '</span>' +
                '</label>'
            );
        }).join('');
    }

    // "Open Sundays" / "Closed Sundays" — the detail people most often need
    function hoursSummary(b) {
        return b.hours[0]
            ? '<i class="fa-regular fa-clock"></i> Open 7 days'
            : '<i class="fa-regular fa-clock"></i> Mon – Sat · closed Sundays';
    }

    $('serviceId').addEventListener('change', function () {
        state.serviceId = Number(this.value) || null;
        const s = state.serviceId && service();
        $('serviceHint').textContent = s ? s.summary + ' From $' + s.priceFrom.toLocaleString() + '.' : '';
        Smile.setFieldError('serviceId', '');
        state.doctorId = null;
        refreshSchedule();
    });

    $('branchOptions').addEventListener('change', function (event) {
        state.branchId = Number(event.target.value);
        Smile.setFieldError('branchId', '');
        // a date the new branch is closed on can't stay selected
        if (state.date && !branchOpenOn(Smile.parseDate(state.date))) {
            state.date = null;
        }
        refreshSchedule();
    });


    /* ==========================================================
       STEP 3 — calendar + timeslots
       ========================================================== */

    // Called whenever the service, branch or date changes.
    function refreshSchedule() {
        const ready = state.serviceId && state.branchId;
        $('timeLocked').hidden = !!ready;
        $('timePicker').hidden = !ready;

        state.time = null;
        state.slots = [];

        if (ready) {
            drawCalendar();
            loadSlots();
        }
        drawDoctors();
        drawSummary();
    }

    function drawCalendar() {
        const first = state.month;
        const min = today();
        const max = lastBookableDay();
        const year = first.getFullYear();
        const month = first.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const canGoBack = first > new Date(min.getFullYear(), min.getMonth(), 1);
        const canGoForward = new Date(year, month + 1, 1) <= max;

        let html =
            '<div class="calendar-head">' +
                '<button type="button" class="calendar-nav" data-step="-1" aria-label="Previous month"' + (canGoBack ? '' : ' disabled') + '>' +
                    '<i class="fa-solid fa-chevron-left"></i></button>' +
                '<h3 aria-live="polite">' + Smile.MONTHS[month] + ' ' + year + '</h3>' +
                '<button type="button" class="calendar-nav" data-step="1" aria-label="Next month"' + (canGoForward ? '' : ' disabled') + '>' +
                    '<i class="fa-solid fa-chevron-right"></i></button>' +
            '</div>' +
            '<div class="calendar-grid">';

        ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(function (d) {
            html += '<span class="calendar-dow" aria-hidden="true">' + d + '</span>';
        });

        // blank cells before the 1st
        for (let i = 0; i < first.getDay(); i++) {
            html += '<span></span>';
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const iso = Smile.toIsoDate(date);
            const closed = !branchOpenOn(date);
            const disabled = date < min || date > max || closed;

            let classes = 'calendar-day';
            if (iso === state.options.today) classes += ' is-today';
            if (iso === state.date) classes += ' is-selected';

            html += '<button type="button" class="' + classes + '" data-date="' + iso + '"' +
                ' aria-label="' + Smile.formatDate(iso) + (closed ? ' (clinic closed)' : '') + '"' +
                (iso === state.date ? ' aria-pressed="true"' : '') +
                (disabled ? ' disabled' : '') + '>' + day + '</button>';
        }

        html += '</div><p class="calendar-legend">Greyed-out days are in the past, too far ahead, or the branch is closed.</p>';
        $('calendar').innerHTML = html;
    }

    $('calendar').addEventListener('click', function (event) {
        const nav = event.target.closest('.calendar-nav');
        const day = event.target.closest('.calendar-day');

        if (nav && !nav.disabled) {
            state.month = new Date(state.month.getFullYear(), state.month.getMonth() + Number(nav.dataset.step), 1);
            drawCalendar();
        } else if (day && !day.disabled) {
            state.date = day.dataset.date;
            Smile.setFieldError('date', '');
            refreshSchedule();
        }
    });

    async function loadSlots() {
        const grid = $('slotGrid');
        Smile.setFieldError('time', '');

        if (!state.date) {
            $('slotHeading').textContent = 'Pick a date';
            $('slotSub').textContent = 'Available times will appear here.';
            grid.innerHTML = '';
            return;
        }

        $('slotHeading').textContent = Smile.formatDate(state.date);
        $('slotSub').textContent = 'Checking availability…';
        grid.innerHTML = '';

        const request = ++state.slotsRequest;
        try {
            const data = await Smile.api('slots.php?service=' + state.serviceId +
                '&branch=' + state.branchId + '&date=' + state.date);
            if (request !== state.slotsRequest) return;   // a newer request is on its way
            state.slots = data.slots;
            drawSlots();
        } catch (error) {
            if (request !== state.slotsRequest) return;
            $('slotSub').textContent = '';
            Smile.setFieldError('time', error.message);
        }
    }

    function drawSlots() {
        const grid = $('slotGrid');
        const open = state.slots.filter(function (s) { return s.freeDoctors.length; });

        if (!state.slots.length) {
            $('slotSub').textContent = 'There are no more times left on this day. Please choose another date.';
        } else if (!open.length) {
            $('slotSub').textContent = 'This day is fully booked. Please choose another date.';
        } else {
            $('slotSub').textContent = open.length + ' of ' + state.slots.length + ' times available';
        }

        grid.innerHTML = state.slots.map(function (s) {
            const full = !s.freeDoctors.length;
            const selected = s.time === state.time;
            return '<button type="button" class="slot' + (selected ? ' is-selected' : '') + '" data-time="' + s.time + '"' +
                (full ? ' disabled aria-label="' + Smile.formatTime(s.time) + ' (fully booked)"' : '') +
                (selected ? ' aria-pressed="true"' : '') + '>' +
                Smile.formatTime(s.time) + '</button>';
        }).join('');
    }

    $('slotGrid').addEventListener('click', function (event) {
        const button = event.target.closest('.slot');
        if (!button || button.disabled) return;

        state.time = button.dataset.time;
        Smile.setFieldError('time', '');

        // keep the chosen doctor only if they are free at the new time
        if (state.doctorId && selectedSlot().freeDoctors.indexOf(state.doctorId) === -1) {
            state.doctorId = null;
        }
        drawSlots();
        drawDoctors();
        drawSummary();
    });


    /* ==========================================================
       STEP 4 — doctor
       ========================================================== */

    function drawDoctors() {
        const slot = state.time && selectedSlot();
        $('doctorLocked').hidden = !!slot;
        $('doctorPicker').hidden = !slot;
        if (!slot) return;

        $('doctorServiceLabel').innerHTML = '<i class="fa-solid fa-tooth"></i> Service: ' +
            Smile.escapeHtml(service().name) + ' · ' + Smile.formatDate(state.date) + ', ' + Smile.formatTime(state.time);

        // free doctors first
        const list = doctorsForService().slice().sort(function (a, b) {
            return (slot.freeDoctors.indexOf(b.id) !== -1) - (slot.freeDoctors.indexOf(a.id) !== -1);
        });

        $('doctorOptions').innerHTML = list.map(function (d) {
            const free = slot.freeDoctors.indexOf(d.id) !== -1;
            return (
                '<label class="choice-card' + (free ? '' : ' is-unavailable') + '">' +
                    '<input type="radio" name="doctorId" value="' + d.id + '"' +
                        (d.id === state.doctorId ? ' checked' : '') + (free ? '' : ' disabled') + '>' +
                    '<span class="choice-body">' +
                        '<img src="' + Smile.escapeHtml(d.photo) + '" alt="">' +
                        '<span class="choice-text">' +
                            '<span class="choice-title">' + Smile.escapeHtml(d.name) +
                                '<span class="choice-check"><i class="fa-solid fa-check"></i></span></span>' +
                            '<span class="choice-line doctor-role">' + Smile.escapeHtml(d.role) + '</span>' +
                            '<span class="choice-line">' + Smile.escapeHtml(d.bio) + '</span>' +
                            (free ? '' : '<span class="unavailable-tag">Booked at this time</span>') +
                        '</span>' +
                    '</span>' +
                '</label>'
            );
        }).join('');
    }

    $('doctorOptions').addEventListener('change', function (event) {
        state.doctorId = Number(event.target.value);
        Smile.setFieldError('doctorId', '');
        drawSummary();
    });


    /* ==========================================================
       SUMMARY + CONFIRM
       ========================================================== */

    function summaryItems(values) {
        const rows = [
            ['fa-solid fa-tooth', 'Service', values.service],
            ['fa-solid fa-user-doctor', 'Doctor', values.doctor],
            ['fa-regular fa-calendar', 'Date & time', values.when],
            ['fa-solid fa-location-dot', 'Branch', values.branch]
        ];
        return rows.map(function (row) {
            return '<div>' +
                '<dt><i class="' + row[0] + '" aria-hidden="true"></i>' + row[1] + '</dt>' +
                '<dd' + (row[2] ? '' : ' class="is-missing"') + '>' + (row[2] || 'Not chosen yet') + '</dd>' +
                '</div>';
        }).join('');
    }

    function drawSummary() {
        const s = state.serviceId && service();
        const b = state.branchId && branch();
        const d = state.doctorId && doctor();
        $('bookingSummary').innerHTML = summaryItems({
            service: s && Smile.escapeHtml(s.name),
            doctor: d && Smile.escapeHtml(d.name),
            when: state.date && state.time && (Smile.formatDate(state.date) + ', ' + Smile.formatTime(state.time)),
            branch: b && Smile.escapeHtml(b.name)
        });
        showBookingError('');
        updateSteps();
    }

    function showBookingError(message) {
        $('bookingError').hidden = !message;
        $('bookingError').innerHTML = message
            ? '<i class="fa-solid fa-circle-exclamation"></i> <span>' + Smile.escapeHtml(message) + '</span>'
            : '';
    }

    // Which step of the wizard each field is on (also the order errors are checked in).
    const FIELD_STEP = {
        name: 1, nric: 1, phone: 1, email: 1, password: 1, confirmPassword: 1,
        serviceId: 2, branchId: 2,
        date: 3, time: 3,
        doctorId: 4
    };
    const ERROR_ORDER = Object.keys(FIELD_STEP);

    // Returns { field: message } for everything missing or wrong on one step.
    function stepErrors(step) {
        const errors = {};
        if (step === 1 && !state.patient) {
            Object.assign(errors, Validators.check(readDetails(), rules));
        }
        if (step === 2) {
            if (!state.serviceId) errors.serviceId = 'Please choose a service.';
            if (!state.branchId) errors.branchId = 'Please choose a branch.';
        }
        if (step === 3) {
            if (!state.date) errors.date = 'Please choose a date.';
            else if (!state.time) errors.time = 'Please choose a time.';
        }
        if (step === 4 && !state.doctorId) {
            errors.doctorId = 'Please choose a doctor.';
        }
        return errors;
    }

    function validateAll() {
        return Object.assign({}, stepErrors(1), stepErrors(2), stepErrors(3), stepErrors(4));
    }

    // Shows the messages, then opens the step with the first problem on it.
    function showErrors(errors) {
        ERROR_ORDER.forEach(function (field) {
            Smile.setFieldError(field, errors[field] || '');
        });

        const first = ERROR_ORDER.find(function (field) { return errors[field]; });
        if (!first) return;

        if (FIELD_STEP[first] !== state.step) {
            goToStep(FIELD_STEP[first], 'push');
        }
        const target = $(first) || $(first + '-error');
        const anchor = target.closest('.form-field, fieldset, .panel') || target;
        anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (target.matches('input, select')) target.focus({ preventScroll: true });
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        // pressing Enter on steps 1 – 3 just moves on to the next step
        if (state.step < TOTAL_STEPS) {
            goNext();
            return;
        }

        const errors = validateAll();
        if (Object.keys(errors).length) {
            showErrors(errors);
            return;
        }

        const body = {
            serviceId: state.serviceId,
            branchId: state.branchId,
            doctorId: state.doctorId,
            date: state.date,
            time: state.time
        };
        if (!state.patient) {
            const details = readDetails();
            body.name = details.name.trim();
            body.nric = details.nric.trim().toUpperCase();
            body.phone = Validators.cleanPhone(details.phone);
            body.email = details.email.trim();
            body.password = details.password;
        }

        const button = $('confirmBtn');
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Booking…';
        showBookingError('');

        try {
            const data = await Smile.api('book.php', { body: body });
            if (data.newAccount) {
                Smile.getSession(true).then(function (session) {
                    // tell the navbar (and anything else) that we are now logged in
                    Smile.setPatient(session.patient);
                });
            }
            showConfirmation(data.appointment, data.newAccount, body.email);
        } catch (error) {
            // the slot went while the form was open → show fresh availability
            if (error.status === 409 && error.fields.time) {
                state.time = null;
                state.doctorId = null;
                goToStep(3, 'push');
                loadSlots().then(function () {
                    Smile.setFieldError('time', error.fields.time);
                    drawDoctors();
                    drawSummary();
                    showBookingError(error.message);
                });
            } else {
                showErrors(error.fields || {});
                showBookingError(error.message);
            }
        } finally {
            button.disabled = false;
            button.innerHTML = '<i class="fa-regular fa-calendar-check"></i> Confirm booking';
        }
    });


    /* ---------- Success ---------- */

    function showConfirmation(appt, newAccount, email) {
        const firstName = (state.patient ? state.patient.name : $('name').value).trim().split(/\s+/)[0];

        state.booked = true;
        form.hidden = true;
        stepsBar.hidden = true;
        const done = $('bookingDone');
        done.hidden = false;
        done.innerHTML =
            '<div class="panel confirmation" tabindex="-1" id="confirmationPanel">' +
                '<div class="confirmation-icon"><i class="fa-solid fa-check"></i></div>' +
                '<h2>Booking confirmed</h2>' +
                '<p>Thank you, ' + Smile.escapeHtml(firstName) + '. Please arrive 10 minutes early and bring your NRIC/FIN.</p>' +
                '<span class="reference">Ref: ' + Smile.escapeHtml(appt.reference) + '</span>' +
                (newAccount
                    ? '<div class="alert alert-success"><i class="fa-solid fa-user-check"></i><span>Your account has been created. ' +
                      'Log in any time with <strong>' + Smile.escapeHtml(email) + '</strong> to see or change this booking.</span></div>'
                    : '') +
                '<dl class="summary-list">' + summaryItems({
                    service: Smile.escapeHtml(appt.service),
                    doctor: Smile.escapeHtml(appt.doctor),
                    when: Smile.formatDate(appt.date) + ', ' + Smile.formatTime(appt.time),
                    branch: Smile.escapeHtml(appt.branch) + '<br><small>' + Smile.escapeHtml(appt.address) + '</small>'
                }) + '</dl>' +
                '<div class="confirmation-actions">' +
                    '<a href="dashboard.html" class="btn btn-primary btn-lg"><i class="fa-regular fa-calendar-check"></i> View my appointments</a>' +
                    '<a href="index.html" class="btn btn-outline btn-lg">Back to home</a>' +
                '</div>' +
            '</div>';

        window.scrollTo({ top: 0, behavior: 'smooth' });
        $('confirmationPanel').focus({ preventScroll: true });
    }


    /* ==========================================================
       STEPS  (one "page" at a time + the 1 ── 2 ── 3 ── 4 timeline)
       ========================================================== */

    const TOTAL_STEPS = 4;
    const STEP_NAMES = ['Your details', 'Service & branch', 'Date & time', 'Doctor'];
    const stepsBar = $('bookingSteps');
    const stepItems = stepsBar.querySelectorAll('li');

    function isComplete(step) {
        return !Object.keys(stepErrors(step)).length;
    }

    // A step can be opened once every step before it is complete.
    function canOpen(step) {
        for (let s = 1; s < step; s++) {
            if (!isComplete(s)) return false;
        }
        return true;
    }

    // Timeline: tick finished steps, ring the current one, grey out locked ones.
    function updateSteps() {
        stepItems.forEach(function (li, i) {
            const step = i + 1;
            const done = isComplete(step);
            const locked = !canOpen(step);
            const link = li.querySelector('a');

            li.classList.toggle('is-done', done);
            li.classList.toggle('is-active', step === state.step);
            li.classList.toggle('is-locked', locked);
            li.querySelector('.step-dot').innerHTML = done ? '<i class="fa-solid fa-check"></i>' : String(step);

            link.setAttribute('aria-label', 'Step ' + step + ': ' + STEP_NAMES[i] +
                (done ? ', done' : '') + (locked ? ', not available yet' : ''));
            if (step === state.step) link.setAttribute('aria-current', 'step');
            else link.removeAttribute('aria-current');
            if (locked) link.setAttribute('aria-disabled', 'true');
            else link.removeAttribute('aria-disabled');
        });

        if (state.step < TOTAL_STEPS) {
            $('nextLabel').textContent = 'Next: ' + STEP_NAMES[state.step];
        }
    }

    // Shows one step and hides the rest.
    //   how = 'start' → first load (no scrolling, replaces the address)
    //         'push'  → user moved on/back: new #step-N in the browser history
    //         'pop'   → browser back/forward button
    function goToStep(step, how) {
        state.step = step;

        form.querySelectorAll('.panel[data-step]').forEach(function (panel) {
            panel.hidden = Number(panel.dataset.step) !== step;
        });
        $('backBtn').hidden = step === 1;
        $('nextBtn').hidden = step === TOTAL_STEPS;
        $('confirmBtn').hidden = step !== TOTAL_STEPS;
        showBookingError('');
        updateSteps();

        if (how === 'start') {
            history.replaceState({ step: step }, '', '#step-' + step);
            return;
        }
        if (how === 'push') {
            history.pushState({ step: step }, '', '#step-' + step);
        }

        // a new "page": back up to the timeline, and move keyboard /
        // screen-reader focus to the new step's heading
        const headerHeight = document.querySelector('.site-header').offsetHeight;
        const top = stepsBar.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
        if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });

        const heading = form.querySelector('.panel[data-step="' + step + '"] h2');
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
    }

    // Next only works when the current step is filled in properly.
    function goNext() {
        const errors = stepErrors(state.step);
        if (Object.keys(errors).length) {
            showErrors(errors);
            return;
        }
        goToStep(state.step + 1, 'push');
    }

    $('nextBtn').addEventListener('click', goNext);
    $('backBtn').addEventListener('click', function () {
        goToStep(state.step - 1, 'push');
    });

    // Clicking the timeline jumps to any step that is already unlocked.
    stepsBar.addEventListener('click', function (event) {
        const li = event.target.closest('li');
        if (!li) return;
        event.preventDefault();
        const step = Array.prototype.indexOf.call(stepItems, li) + 1;
        if (step !== state.step && canOpen(step)) {
            goToStep(step, 'push');
        }
    });

    // Browser back / forward between steps.
    window.addEventListener('popstate', function () {
        if (state.booked || !state.options) return;
        const match = /^#step-(\d)$/.exec(window.location.hash);
        let step = match ? Math.min(Math.max(Number(match[1]), 1), TOTAL_STEPS) : 1;
        while (step > 1 && !canOpen(step)) step--;     // can't skip ahead via the address bar
        goToStep(step, 'pop');
        if (window.location.hash !== '#step-' + step) {
            history.replaceState({ step: step }, '', '#step-' + step);
        }
    });

    // typing in step 1 can complete it
    form.addEventListener('input', updateSteps);


    /* ==========================================================
       START
       ========================================================== */

    async function start() {
        try {
            const results = await Promise.all([Smile.api('options.php'), Smile.getSession()]);
            state.options = results[0];
            const t = today();
            state.month = new Date(t.getFullYear(), t.getMonth(), 1);

            drawServices();
            drawBranches();
            showPatient(results[1].patient);

            // links like appointment.html?service=root-canal&branch=orchard pre-select choices
            const params = new URLSearchParams(window.location.search);
            const s = state.options.services.find(function (x) { return x.slug === params.get('service'); });
            const b = state.options.branches.find(function (x) { return x.slug === params.get('branch'); });
            if (s) {
                $('serviceId').value = s.id;
                $('serviceId').dispatchEvent(new Event('change'));
            }
            if (b) {
                const radio = form.querySelector('input[name="branchId"][value="' + b.id + '"]');
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }

            refreshSchedule();
            goToStep(1, 'start');
        } catch (error) {
            $('bookingLoadError').hidden = false;
            $('bookingLoadError').innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> <span>' +
                Smile.escapeHtml(error.message) + '</span>';
            form.hidden = true;
            stepsBar.hidden = true;
        }
    }

    start();

})();
