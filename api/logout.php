<?php
/* POST api/logout.php */
require __DIR__ . '/bootstrap.php';
require_method('POST');
read_json();

$_SESSION = [];
session_destroy();
respond([]);
