/* ==========================================================
   Form validation rules — shared by the booking page,
   the dashboard and the careers form.

   Every rule takes the field's value and returns an error message,
   or '' when the value is fine.

   The PHP side (includes/app.php → validate_patient) checks the
   same rules again, because anything in the browser can be bypassed.
   ========================================================== */

(function () {

    const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const NAME  = /^[\p{L} .,'\/@()-]{2,100}$/u;
    const NRIC  = /^[STFGM]\d{7}[A-Z]$/;       // e.g. S1234567A
    const PHONE = /^[689]\d{7}$/;              // Singapore: 8 digits starting 6, 8 or 9

    // "+65 9123-4567" → "91234567"
    function cleanPhone(value) {
        return String(value || '').replace(/[\s-]/g, '').replace(/^\+?65(?=\d{8}$)/, '');
    }

    const Validators = {
        cleanPhone: cleanPhone,

        name: function (value) {
            const v = String(value || '').trim().replace(/\s+/g, ' ');
            if (v.length < 2) return 'Please enter your full name.';
            if (!NAME.test(v)) return "Name can only contain letters, spaces and . , ' - / @ ( )";
            return '';
        },

        nric: function (value) {
            const v = String(value || '').trim().toUpperCase();
            if (!v) return 'Please enter your NRIC/FIN number.';
            if (!NRIC.test(v)) return 'NRIC/FIN should look like S1234567A.';
            return '';
        },

        phone: function (value) {
            const v = cleanPhone(value);
            if (!v) return 'Please enter your contact number.';
            if (!PHONE.test(v)) return 'Enter an 8-digit Singapore number starting with 6, 8 or 9.';
            return '';
        },

        email: function (value) {
            const v = String(value || '').trim();
            if (!v) return 'Please enter your email address.';
            if (v.length > 255 || !EMAIL.test(v)) return 'Please enter a valid email address.';
            return '';
        },

        // when logging in we only need *a* password — the server decides if it is right
        loginPassword: function (value) {
            return value ? '' : 'Please enter your password.';
        },

        // when creating an account the password has to be reasonably strong
        newPassword: function (value) {
            const v = String(value || '');
            if (!v) return 'Please create a password.';
            if (v.length < 8 || !/[A-Za-z]/.test(v) || !/\d/.test(v)) {
                return 'Use at least 8 characters with a letter and a number.';
            }
            if (v.length > 72) return 'Password must be 72 characters or fewer.';
            return '';
        },

        confirmPassword: function (value, password) {
            if (!value) return 'Please type your password again.';
            if (value !== password) return 'The passwords do not match.';
            return '';
        },

        /* ---- Job application form (about-us.html) ---- */

        position: function (value) {
            return value ? '' : 'Please choose the position you are applying for.';
        },

        // Takes the File object from the input, not a string.
        // Limits match the hint printed under the field.
        resume: function (file) {
            if (!file) return 'Please attach your resume.';
            if (!/\.(pdf|doc|docx)$/i.test(file.name || '')) {
                return 'Resume must be a PDF, DOC or DOCX file.';
            }
            if (file.size > 5 * 1024 * 1024) {
                return 'Resume must be 5 MB or smaller.';
            }
            return '';
        },

        // Optional — only complains if it is too long to store.
        coverNote: function (value) {
            return String(value || '').length > 2000
                ? 'Please keep this under 2000 characters.'
                : '';
        },

        // Runs several rules at once.
        // rules = { email: Validators.email, ... }  →  { email: 'message', ... }
        // Only fields with a problem appear in the result.
        check: function (values, rules) {
            const errors = {};
            Object.keys(rules).forEach(function (field) {
                const message = rules[field](values[field], values);
                if (message) errors[field] = message;
            });
            return errors;
        }
    };

    window.Validators = Validators;
})();
