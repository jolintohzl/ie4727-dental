/* ==========================================================
   dashboard.html — "My Account"
     • edit profile details        → api/profile.php
     • list appointments           → api/appointments.php
     • reschedule an appointment   → api/slots.php + api/reschedule.php
     • cancel an appointment       → api/cancel.php
   Not logged in? The login modal opens instead.
   ========================================================== */

(function () {

    const FIELDS = ['name', 'nric', 'phone', 'email'];
    const $ = function (id) { return document.getElementById(id); };

    const state = {
        patient: null,
        appointments: [],
        today: null,           // "2026-09-23" from the server
        windowDays: 60
    };


    /* ---------- Which block is showing ---------- */

    function showGuest() {
        state.patient = null;
        $('dashLoading').hidden = true;
        $('dashMember').hidden = true;
        $('dashGuest').hidden = false;
        $('logoutBtn').hidden = true;
        $('dashTitle').textContent = 'My account';
        $('dashSub').textContent = 'Your profile and appointments in one place.';
    }

    function showMember(patient) {
        state.patient = patient;
        $('dashLoading').hidden = true;
        $('dashGuest').hidden = true;
        $('dashMember').hidden = false;
        $('logoutBtn').hidden = false;
        $('dashTitle').textContent = 'Hi, ' + patient.name.split(' ')[0];
        $('dashSub').textContent = 'Manage your profile and appointments.';
        fillProfile(patient);
        loadAppointments();
    }

    function askToLogIn() {
        Smile.openLogin({
            message: 'Log in to see your profile and appointments.',
            onSuccess: showMember
        });
    }

    $('dashLoginBtn').addEventListener('click', askToLogIn);

    $('logoutBtn').addEventListener('click', async function () {
        try {
            await Smile.logout();
            window.location.href = 'index.html';
        } catch (error) {
            alert(error.message);
        }
    });

    // logged out in another tab, etc.
    document.addEventListener('smile:auth', function (event) {
        if (!event.detail.patient) showGuest();
    });


    /* ==========================================================
       PROFILE
       ========================================================== */

    const rules = {
        name: Validators.name,
        nric: Validators.nric,
        phone: Validators.phone,
        email: Validators.email
    };

    function fillProfile(patient) {
        FIELDS.forEach(function (field) {
            $(field).value = patient[field];
            Smile.setFieldError(field, '');
        });
        $('profileError').hidden = true;
    }

    function readProfile() {
        return {
            name: $('name').value.trim(),
            nric: $('nric').value.trim().toUpperCase(),
            phone: Validators.cleanPhone($('phone').value),
            email: $('email').value.trim()
        };
    }

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

    $('profileForm').addEventListener('submit', async function (event) {
        event.preventDefault();
        $('profileError').hidden = true;
        $('saveStatus').textContent = '';

        const values = readProfile();
        const errors = Validators.check(values, rules);
        FIELDS.forEach(function (field) { Smile.setFieldError(field, errors[field] || ''); });

        const firstBad = FIELDS.find(function (field) { return errors[field]; });
        if (firstBad) {
            $(firstBad).focus();
            return;
        }

        const button = $('saveBtn');
        button.disabled = true;
        try {
            const data = await Smile.api('profile.php', { body: values });
            fillProfile(data.patient);
            Smile.setPatient(data.patient);   // navbar initials update too
            $('dashTitle').textContent = 'Hi, ' + data.patient.name.split(' ')[0];
            $('saveStatus').innerHTML = '<i class="fa-solid fa-circle-check"></i> Saved';
        } catch (error) {
            if (error.status === 401) return showGuest();
            FIELDS.forEach(function (field) { Smile.setFieldError(field, error.fields[field] || ''); });
            $('profileError').hidden = false;
            $('profileError').innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> <span>' +
                Smile.escapeHtml(error.message) + '</span>';
        } finally {
            button.disabled = false;
        }
    });


    /* ==========================================================
       APPOINTMENTS
       ========================================================== */

    async function loadAppointments() {
        $('upcomingList').innerHTML = '<p class="loading-note"><i class="fa-solid fa-spinner fa-spin"></i> Loading appointments…</p>';
        try {
            const data = await Smile.api('appointments.php');
            state.appointments = data.appointments;
            drawAppointments();
        } catch (error) {
            if (error.status === 401) return showGuest();
            $('upcomingList').innerHTML = '<div class="alert alert-error"><i class="fa-solid fa-circle-exclamation"></i> <span>' +
                Smile.escapeHtml(error.message) + '</span></div>';
        }
    }

    function drawAppointments() {
        const upcoming = state.appointments.filter(function (a) { return a.upcoming; });
        const past = state.appointments.filter(function (a) { return !a.upcoming; }).reverse();   // newest first

        $('upcomingList').innerHTML = upcoming.length
            ? upcoming.map(appointmentCard).join('')
            : '<p class="empty-note"><i class="fa-regular fa-calendar"></i> You have no upcoming appointments.</p>';

        $('pastWrap').hidden = !past.length;
        $('pastSummary').textContent = 'Past and cancelled appointments (' + past.length + ')';
        $('pastList').innerHTML = past.map(appointmentCard).join('');
    }

    function appointmentCard(a) {
        const e = Smile.escapeHtml;
        const status = a.status === 'cancelled'
            ? '<span class="status-tag cancelled">Cancelled</span>'
            : (a.upcoming ? '' : '<span class="status-tag">Completed</span>');

        return (
            '<article class="appt-card' + (a.upcoming ? '' : ' is-past') + '" data-id="' + a.id + '">' +
                '<div class="appt-card-top">' +
                    '<img src="' + e(a.doctorPhoto) + '" alt="">' +
                    '<div class="appt-card-main">' +
                        '<p class="appt-when">' + Smile.formatDate(a.date) + ' – ' + Smile.formatTime(a.time) + status + '</p>' +
                        '<p class="appt-detail"><strong>' + e(a.service) + '</strong> with ' + e(a.doctor) + '</p>' +
                        '<p class="appt-detail"><i class="fa-solid fa-location-dot"></i> ' + e(a.branch) + ' · ' + e(a.address) + '</p>' +
                        '<p class="appt-ref">Ref ' + e(a.reference) + '</p>' +
                    '</div>' +
                '</div>' +
                (a.upcoming
                    ? '<div class="appt-actions">' +
                          '<button type="button" class="btn btn-danger-outline btn-sm" data-action="cancel">Cancel</button>' +
                          '<button type="button" class="btn btn-outline btn-sm" data-action="reschedule" aria-expanded="false">' +
                              '<i class="fa-regular fa-calendar"></i> Reschedule</button>' +
                      '</div>' +
                      '<div class="reschedule-box" hidden></div>'
                    : '') +
            '</article>'
        );
    }

    function findAppointment(id) {
        return state.appointments.find(function (a) { return a.id === id; });
    }

    function notice(message) {
        $('apptNotice').hidden = !message;
        $('apptNotice').innerHTML = message ? '<i class="fa-solid fa-circle-check"></i> <span>' + message + '</span>' : '';
    }

    // One click handler for every button inside the list.
    $('upcomingList').addEventListener('click', function (event) {
        const button = event.target.closest('button');
        if (!button) return;
        const card = button.closest('.appt-card');
        const appt = findAppointment(Number(card.dataset.id));

        if (button.dataset.action === 'cancel') cancelAppointment(appt);
        if (button.dataset.action === 'reschedule') toggleReschedule(card, appt, button);
        if (button.dataset.action === 'close-reschedule') {
            toggleReschedule(card, appt, card.querySelector('[data-action="reschedule"]'));
        }
        if (button.classList.contains('slot') && !button.disabled) pickSlot(card, button);
        if (button.dataset.action === 'confirm-reschedule') confirmReschedule(card, appt);
    });


    /* ---------- Cancel ---------- */

    async function cancelAppointment(appt) {
        const when = Smile.formatDate(appt.date) + ' at ' + Smile.formatTime(appt.time);
        if (!window.confirm('Cancel your ' + appt.service + ' appointment on ' + when + '?')) return;

        try {
            await Smile.api('cancel.php', { body: { id: appt.id } });
            notice('Your appointment on ' + Smile.escapeHtml(when) + ' has been cancelled.');
            loadAppointments();
        } catch (error) {
            if (error.status === 401) return showGuest();
            alert(error.message);
            loadAppointments();
        }
    }


    /* ---------- Reschedule ---------- */

    function toggleReschedule(card, appt, toggleButton) {
        const box = card.querySelector('.reschedule-box');
        const opening = box.hidden;
        box.hidden = !opening;
        toggleButton.setAttribute('aria-expanded', String(opening));
        if (!opening) return;

        const min = state.today;
        const maxDate = Smile.parseDate(state.today);
        maxDate.setDate(maxDate.getDate() + state.windowDays);
        const inputId = 'newDate-' + appt.id;

        box.innerHTML =
            '<div class="form-field">' +
                '<label for="' + inputId + '">New date with ' + Smile.escapeHtml(appt.doctor) + '</label>' +
                '<input type="date" id="' + inputId + '" min="' + min + '" max="' + Smile.toIsoDate(maxDate) + '" value="' + appt.date + '">' +
            '</div>' +
            '<p class="slot-sub" data-role="slot-sub"></p>' +
            '<div class="slot-grid" data-role="slots"></div>' +
            '<div class="alert alert-error" data-role="error" role="alert" hidden></div>' +
            '<div class="appt-actions">' +
                '<button type="button" class="btn btn-outline btn-sm" data-action="close-reschedule">Keep current time</button>' +
                '<button type="button" class="btn btn-primary btn-sm" data-action="confirm-reschedule" disabled>Confirm new time</button>' +
            '</div>';

        const input = box.querySelector('input');
        input.addEventListener('change', function () { loadRescheduleSlots(card, appt); });
        loadRescheduleSlots(card, appt);
        input.focus();
    }

    async function loadRescheduleSlots(card, appt) {
        const box = card.querySelector('.reschedule-box');
        const date = box.querySelector('input').value;
        const sub = box.querySelector('[data-role="slot-sub"]');
        const grid = box.querySelector('[data-role="slots"]');
        box.dataset.time = '';
        box.querySelector('[data-action="confirm-reschedule"]').disabled = true;
        showBoxError(box, '');
        grid.innerHTML = '';

        if (!date) {
            sub.textContent = 'Choose a date to see available times.';
            return;
        }
        sub.textContent = 'Checking availability…';

        try {
            const data = await Smile.api('slots.php?doctor=' + appt.doctorId + '&branch=' + appt.branchId + '&date=' + date);
            if (box.querySelector('input').value !== date) return;   // date changed while waiting

            const isCurrentDay = date === appt.date;
            const free = data.slots.filter(function (s) { return s.freeDoctors.length; });
            sub.textContent = !data.slots.length
                ? 'The ' + appt.branch + ' clinic has no times left on this day. Please pick another date.'
                : (free.length ? 'Choose a new time at ' + appt.branch + ':' : 'Fully booked on this day. Please pick another date.');

            grid.innerHTML = data.slots.map(function (s) {
                const current = isCurrentDay && s.time === appt.time;
                const taken = !s.freeDoctors.length;
                return '<button type="button" class="slot" data-time="' + s.time + '"' +
                    (taken ? ' disabled' : '') +
                    (current ? ' title="Your current time"' : '') + '>' +
                    Smile.formatTime(s.time) + (current ? ' ✓' : '') + '</button>';
            }).join('');
        } catch (error) {
            sub.textContent = '';
            showBoxError(box, error.message);
        }
    }

    function pickSlot(card, button) {
        const box = card.querySelector('.reschedule-box');
        box.querySelectorAll('.slot').forEach(function (s) {
            s.classList.toggle('is-selected', s === button);
            s.setAttribute('aria-pressed', String(s === button));
        });
        box.dataset.time = button.dataset.time;
        box.querySelector('[data-action="confirm-reschedule"]').disabled = false;
        showBoxError(box, '');
    }

    function showBoxError(box, message) {
        const el = box.querySelector('[data-role="error"]');
        el.hidden = !message;
        el.innerHTML = message ? '<i class="fa-solid fa-circle-exclamation"></i> <span>' + Smile.escapeHtml(message) + '</span>' : '';
    }

    async function confirmReschedule(card, appt) {
        const box = card.querySelector('.reschedule-box');
        const date = box.querySelector('input').value;
        const time = box.dataset.time;
        const button = box.querySelector('[data-action="confirm-reschedule"]');
        if (!date || !time) return;

        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';
        try {
            const data = await Smile.api('reschedule.php', { body: { id: appt.id, date: date, time: time } });
            notice('Rescheduled to ' + Smile.formatDate(data.appointment.date) + ', ' +
                Smile.formatTime(data.appointment.time) + ' with ' + Smile.escapeHtml(data.appointment.doctor) + '.');
            loadAppointments();
        } catch (error) {
            if (error.status === 401) return showGuest();
            showBoxError(box, error.message);
            button.innerHTML = 'Confirm new time';
            loadRescheduleSlots(card, appt);   // show what's actually free now
        }
    }


    /* ==========================================================
       START
       ========================================================== */

    async function start() {
        try {
            const results = await Promise.all([Smile.getSession(), Smile.api('options.php')]);
            state.today = results[1].today;
            state.windowDays = results[1].bookingWindowDays;

            if (results[0].patient) {
                showMember(results[0].patient);
            } else {
                showGuest();
                askToLogIn();
            }
        } catch (error) {
            $('dashLoading').innerHTML = '<span class="alert alert-error"><i class="fa-solid fa-circle-exclamation"></i> ' +
                Smile.escapeHtml(error.message) + '</span>';
        }
    }

    start();

})();
