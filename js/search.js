/* ==========================================================
   search.html — simple site search (no database needed).

   How it works:
     1. fetch each page of the site
     2. break it into searchable pieces: every <section> with a
        heading, and every card (<article>) with a title
     3. keep the pieces that contain ALL the words searched for,
        best matches first (a word in the title counts for more)

   Because it reads the real pages, results stay up to date
   whenever the page content changes.

   To search the database later instead (e.g. with SQL LIKE),
   replace buildIndex() with a fetch to a PHP file that returns
   the same { page, title, text, url } objects.
   ========================================================== */

(function () {

    const PAGES = [
        'index.html',
        'about-us.html',
        'doctors.html',
        'services.html',
        'fees-calculator.html',
        'locate-us.html'
    ];

    // pages whose content is drawn by JavaScript, so there's nothing to read
    const EXTRA = [
        {
            page: 'Book Appointment',
            title: 'Book an appointment',
            text: 'Book an appointment online. Choose a service, branch, date, time and doctor. New patients register and create an account while booking.',
            url: 'appointment.html'
        },
        {
            page: 'My Account',
            title: 'My account — log in, profile and appointments',
            text: 'Log in to your patient account to edit your profile details, see upcoming appointments, reschedule or cancel an appointment.',
            url: 'dashboard.html'
        }
    ];

    const MAX_RESULTS = 30;
    const $ = function (id) { return document.getElementById(id); };


    /* ---------- 1 + 2: read the pages into pieces ---------- */

    function clean(text) {
        return String(text || '').replace(/\s+/g, ' ').trim();
    }

    async function readPage(file) {
        const response = await fetch(file);
        if (!response.ok) return [];
        const doc = new DOMParser().parseFromString(await response.text(), 'text/html');

        // "Dental Services | Smile Dental Group" → "Dental Services"
        const pageName = clean(doc.title.split('|')[0]) || 'Home';
        doc.querySelectorAll('header, footer, script, noscript, nav').forEach(function (el) { el.remove(); });

        const pieces = [];

        doc.querySelectorAll('section').forEach(function (section) {
            const heading = section.querySelector('h1, h2');
            if (heading) {
                pieces.push({
                    page: pageName,
                    title: clean(heading.textContent),
                    text: clean(section.textContent),
                    url: file + (section.id ? '#' + section.id : '')
                });
            }

            section.querySelectorAll('article').forEach(function (card) {
                const title = card.querySelector('h3, h2');
                if (!title) return;
                const anchor = card.id || section.id;
                pieces.push({
                    page: pageName,
                    title: clean(title.textContent),
                    text: clean(card.textContent),
                    url: file + (anchor ? '#' + anchor : ''),
                    isCard: true
                });
            });
        });

        return pieces;
    }

    async function buildIndex() {
        const pages = await Promise.all(PAGES.map(function (file) {
            return readPage(file).catch(function () { return []; });
        }));
        return [].concat.apply(EXTRA.slice(), pages);
    }


    /* ---------- 3: match and rank ---------- */

    function words(query) {
        return query.toLowerCase().split(/\s+/).filter(Boolean);
    }

    function score(piece, query, terms) {
        const title = piece.title.toLowerCase();
        const text = piece.text.toLowerCase();

        // every word must appear somewhere
        for (let i = 0; i < terms.length; i++) {
            if (title.indexOf(terms[i]) === -1 && text.indexOf(terms[i]) === -1) return 0;
        }

        let points = 1;
        if (title.indexOf(query.toLowerCase()) !== -1) points += 20;       // whole phrase in title
        if (text.indexOf(query.toLowerCase()) !== -1) points += 5;         // whole phrase in text
        terms.forEach(function (term) {
            if (title.indexOf(term) !== -1) points += 8;
            points += Math.min(text.split(term).length - 1, 5);          // up to 5 mentions
        });
        if (piece.isCard) points += 2;                                     // cards are more specific
        return points;
    }


    /* ---------- Show the results ---------- */

    function escapeRegExp(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Escapes the text, then wraps the search words in <mark>.
    function highlight(text, terms) {
        const safe = Smile.escapeHtml(text);
        const pattern = new RegExp('(' + terms.map(function (t) { return escapeRegExp(Smile.escapeHtml(t)); }).join('|') + ')', 'gi');
        return safe.replace(pattern, '<mark>$1</mark>');
    }

    // ~180 characters of text around the first matching word
    function snippet(text, terms) {
        const lower = text.toLowerCase();
        let at = -1;
        terms.forEach(function (t) {
            const i = lower.indexOf(t);
            if (i !== -1 && (at === -1 || i < at)) at = i;
        });
        const start = Math.max(0, at - 60);
        const end = Math.min(text.length, start + 180);
        return (start > 0 ? '… ' : '') + text.slice(start, end).trim() + (end < text.length ? ' …' : '');
    }

    function showHelp(message) {
        $('searchHelp').hidden = false;
        $('searchHelpText').innerHTML = '<i class="fa-solid fa-lightbulb"></i> <span>' + message + '</span>';
    }

    async function run() {
        const query = clean(new URLSearchParams(window.location.search).get('q')).slice(0, 80);
        $('searchInput').value = query;

        if (!query) {
            showHelp('Type what you are looking for above, or try one of these:');
            $('searchInput').focus();
            return;
        }

        document.title = 'Search: ' + query + ' | Smile Dental Group';
        $('searchTitle').textContent = 'Results for “' + query + '”';
        $('resultCount').textContent = 'Searching…';

        const terms = words(query);
        const index = await buildIndex();

        const seen = {};
        const results = index
            .map(function (piece) { return { piece: piece, points: score(piece, query, terms) }; })
            .filter(function (r) { return r.points > 0; })
            .sort(function (a, b) { return b.points - a.points; })
            // the same heading on the same page only once
            .filter(function (r) {
                const key = r.piece.url + '|' + r.piece.title;
                if (seen[key]) return false;
                seen[key] = true;
                return true;
            })
            .slice(0, MAX_RESULTS);

        if (!results.length) {
            $('resultCount').textContent = 'No results found.';
            showHelp('Nothing matched “' + Smile.escapeHtml(query) + '”. Check the spelling, use fewer words, or try:');
            return;
        }

        $('resultCount').textContent = results.length + (results.length === 1 ? ' result' : ' results') +
            (results.length === MAX_RESULTS ? ' (showing the best ' + MAX_RESULTS + ')' : '');

        $('results').innerHTML = results.map(function (r) {
            const p = r.piece;
            return (
                '<a class="result-card" href="' + Smile.escapeHtml(p.url) + '">' +
                    '<span class="result-page">' + Smile.escapeHtml(p.page) + '</span>' +
                    '<h3>' + highlight(p.title, terms) + '</h3>' +
                    '<p>' + highlight(snippet(p.text, terms), terms) + '</p>' +
                '</a>'
            );
        }).join('');
    }

    run();

})();
