<?php
/* ==========================================================
   Site search, done on the server.

   js/search.js used to fetch() every page and pick it apart in
   the browser. That was AJAX, so the work moved here: PHP reads
   the same HTML files straight off the disk with DOMDocument,
   builds the index, scores it and hands search.php a ranked list.

   Nothing is fetched and nothing is JSON — search.php renders
   the results as ordinary HTML.
   ========================================================== */

const SEARCH_PAGES = [
    'index.html',
    'about-us.html',
    'doctors.html',
    'services.html',
    'fees-calculator.html',
    'locate-us.html',
];

// Pages built by JavaScript have nothing readable in the file itself,
// so they are described by hand.
const SEARCH_EXTRA = [
    [
        'page'  => 'Book an Appointment',
        'title' => 'Book an appointment online',
        'text'  => 'Choose a treatment, a clinic, a dentist and a timeslot. New patients get an account as part of booking.',
        'url'   => 'appointment.html',
    ],
    [
        'page'  => 'My Account',
        'title' => 'My account — log in, profile and appointments',
        'text'  => 'Log in to your patient account to edit your profile details, see upcoming appointments, reschedule or cancel an appointment.',
        'url'   => 'dashboard.html',
    ],
];

const SEARCH_MAX_RESULTS = 30;


function search_clean(string $text): string
{
    return trim(preg_replace('/\s+/u', ' ', $text));
}


/* Pulls the readable chunks out of one page: each <section> with a heading,
   plus each <article> card inside it. */
function search_read_page(string $file): array
{
    $path = __DIR__ . '/../' . $file;
    if (!is_file($path)) {
        return [];
    }

    $html = file_get_contents($path);
    if ($html === false || $html === '') {
        return [];
    }

    $doc = new DOMDocument();
    // The pages are HTML5; libxml complains about tags it predates, and we
    // only want the text, so the warnings are suppressed deliberately.
    libxml_use_internal_errors(true);
    $doc->loadHTML('<?xml encoding="utf-8" ?>' . $html);
    libxml_clear_errors();

    $xpath = new DOMXPath($doc);

    // "Dental Services | Smile Dental Group" → "Dental Services"
    $titleNode = $xpath->query('//title')->item(0);
    $pageName  = $titleNode ? search_clean(explode('|', $titleNode->textContent)[0]) : '';
    if ($pageName === '') {
        $pageName = 'Home';
    }

    // Drop the chrome that appears on every page, or every result would match it
    foreach ($xpath->query('//header | //footer | //nav | //script | //noscript') as $node) {
        $node->parentNode->removeChild($node);
    }

    $pieces = [];

    foreach ($xpath->query('//section') as $section) {
        $heading = $xpath->query('.//h1 | .//h2', $section)->item(0);
        if ($heading) {
            $id = $section->getAttribute('id');
            $pieces[] = [
                'page'   => $pageName,
                'title'  => search_clean($heading->textContent),
                'text'   => search_clean($section->textContent),
                'url'    => $file . ($id !== '' ? '#' . $id : ''),
                'isCard' => false,
            ];
        }

        foreach ($xpath->query('.//article', $section) as $card) {
            $cardTitle = $xpath->query('.//h3 | .//h2', $card)->item(0);
            if (!$cardTitle) {
                continue;
            }
            $id = $section->getAttribute('id');
            $pieces[] = [
                'page'   => $pageName,
                'title'  => search_clean($cardTitle->textContent),
                'text'   => search_clean($card->textContent),
                'url'    => $file . ($id !== '' ? '#' . $id : ''),
                'isCard' => true,
            ];
        }
    }

    return $pieces;
}


function search_build_index(): array
{
    $index = [];
    foreach (SEARCH_EXTRA as $extra) {
        $extra['isCard'] = false;
        $index[] = $extra;
    }
    foreach (SEARCH_PAGES as $file) {
        $index = array_merge($index, search_read_page($file));
    }
    return $index;
}


/* Same scoring as the old JavaScript: every word has to appear somewhere,
   then the whole phrase and title hits are worth the most. */
function search_score(array $piece, string $query, array $terms): int
{
    $title = mb_strtolower($piece['title']);
    $text  = mb_strtolower($piece['text']);
    $q     = mb_strtolower($query);

    foreach ($terms as $term) {
        if (mb_strpos($title, $term) === false && mb_strpos($text, $term) === false) {
            return 0;
        }
    }

    $points = 1;
    if (mb_strpos($title, $q) !== false) { $points += 20; }   // whole phrase in the heading
    if (mb_strpos($text, $q)  !== false) { $points += 5; }    // whole phrase in the body

    foreach ($terms as $term) {
        if (mb_strpos($title, $term) !== false) { $points += 8; }
        $points += min(mb_substr_count($text, $term), 5);     // up to 5 mentions
    }
    if (!empty($piece['isCard'])) { $points += 2; }           // cards are more specific

    return $points;
}


function search_run(string $query): array
{
    $terms = array_values(array_filter(preg_split('/\s+/u', mb_strtolower(trim($query)))));
    if (!$terms) {
        return [];
    }

    $hits = [];
    foreach (search_build_index() as $piece) {
        $points = search_score($piece, $query, $terms);
        if ($points > 0) {
            $piece['score'] = $points;
            $hits[] = $piece;
        }
    }

    usort($hits, fn($a, $b) => $b['score'] <=> $a['score']);
    return array_slice($hits, 0, SEARCH_MAX_RESULTS);
}


/* ---------- Rendering helpers ---------- */

function search_escape(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

// Escapes first, then wraps the matched words in <mark>.
function search_highlight(string $text, array $terms): string
{
    $safe = search_escape($text);
    $parts = array_map(fn($t) => preg_quote(search_escape($t), '/'), $terms);
    if (!$parts) {
        return $safe;
    }
    return preg_replace('/(' . implode('|', $parts) . ')/iu', '<mark>$1</mark>', $safe);
}

// ~180 characters of text around the first word that matched
function search_snippet(string $text, array $terms): string
{
    $lower = mb_strtolower($text);
    $at = false;
    foreach ($terms as $term) {
        $found = mb_strpos($lower, $term);
        if ($found !== false) { $at = $found; break; }
    }
    if ($at === false) {
        return mb_substr($text, 0, 180) . (mb_strlen($text) > 180 ? '…' : '');
    }

    $start = max(0, $at - 60);
    $piece = mb_substr($text, $start, 180);
    return ($start > 0 ? '…' : '') . $piece . ($start + 180 < mb_strlen($text) ? '…' : '');
}
