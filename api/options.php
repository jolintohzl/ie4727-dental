<?php
/* GET api/options.php — everything the booking form needs to draw itself:
   services, branches (with opening hours) and doctors. */
require __DIR__ . '/bootstrap.php';
require_method('GET');

$pdo = db();

$services = $pdo->query('SELECT id, slug, name, summary, price_from AS priceFrom FROM services ORDER BY id')->fetchAll();

$branches = $pdo->query('SELECT id, slug, name, address, phone, map_img AS mapImg FROM branches ORDER BY id')->fetchAll();
$hours = $pdo->query("SELECT branch_id, weekday, TIME_FORMAT(open_time, '%H:%i') AS open, TIME_FORMAT(close_time, '%H:%i') AS close FROM branch_hours")->fetchAll();
foreach ($branches as &$branch) {
    // hours[weekday] = { open, close }; a missing weekday means closed
    $branch['hours'] = new stdClass();
    foreach ($hours as $h) {
        if ((int) $h['branch_id'] === (int) $branch['id']) {
            $branch['hours']->{$h['weekday']} = ['open' => $h['open'], 'close' => $h['close']];
        }
    }
}
unset($branch);

$doctors = $pdo->query('SELECT id, name, specialty, role, bio, photo FROM doctors ORDER BY id')->fetchAll();
$links = $pdo->query('SELECT doctor_id, service_id FROM doctor_services')->fetchAll();
foreach ($doctors as &$doctor) {
    $doctor['serviceIds'] = [];
    foreach ($links as $link) {
        if ((int) $link['doctor_id'] === (int) $doctor['id']) {
            $doctor['serviceIds'][] = (int) $link['service_id'];
        }
    }
}
unset($doctor);

$cast = function (array $rows) {
    return array_map(function ($row) {
        $row['id'] = (int) $row['id'];
        if (isset($row['priceFrom'])) {
            $row['priceFrom'] = (int) $row['priceFrom'];
        }
        return $row;
    }, $rows);
};

respond([
    'today'             => date('Y-m-d'),
    'bookingWindowDays' => BOOKING_WINDOW_DAYS,
    'services'          => $cast($services),
    'branches'          => $cast($branches),
    'doctors'           => $cast($doctors),
]);
