<?php
// Tillat CORS slik at frontend kan hente data
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Hent endpoint fra query string
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';
if (!$endpoint) {
    echo json_encode(["error" => "Missing endpoint"]);
    exit;
}

// Bygg URL til FPL API
$url = "https://fantasy.premierleague.com/api/" . $endpoint;

// Sett User-Agent for å unngå blokkering
$options = [
    "http" => [
        "header" => "User-Agent: Mozilla/5.0\r\nAccept: application/json\r\n"
    ]
];
$context = stream_context_create($options);

// Hent data fra FPL API
$response = @file_get_contents($url, false, $context);

if ($response === FALSE) {
    echo json_encode(["error" => "Failed to fetch from FPL API"]);
    exit;
}

// Returner JSON
echo $response;
