<?php
// =====================================================
// FPL PHP Proxy – for berghweb.no same-folder setup
// =====================================================

// 1. Content-type
header("Content-Type: application/json");

// 2. Rate-limit per IP
$ip = $_SERVER['REMOTE_ADDR'];
$limitFile = sys_get_temp_dir() . "/fpl_rate_" . md5($ip);
$window = 60;  // 60 sekunder
$max = 30;     // maks 30 requests per IP

$data = @json_decode(@file_get_contents($limitFile), true) ?? ['t'=>time(),'c'=>0];
if (time() - $data['t'] > $window) { $data = ['t'=>time(),'c'=>0]; }
$data['c']++;
file_put_contents($limitFile, json_encode($data));

if ($data['c'] > $max) {
    http_response_code(429);
    echo json_encode(["error"=>"Too many requests"]);
    exit;
}

// 3. Hent endpoint og valider
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';
if (!$endpoint || !preg_match('/^[a-z0-9\-\/_]+$/i', $endpoint)) {
    http_response_code(400);
    echo json_encode(["error" => "Missing or invalid endpoint"]);
    exit;
}

// 4. Filcache (5 minutter)
$cacheFile = sys_get_temp_dir() . '/fpl_' . md5($endpoint) . '.json';
$ttl = 300; // 5 minutter

if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $ttl)) {
    header('X-Cache: HIT');
    readfile($cacheFile);
    exit;
}

// 5. Hent data fra FPL API
$fplApi = "https://fantasy.premierleague.com/api/" . $endpoint;

$ch = curl_init($fplApi);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0");
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_MAXREDIRS, 0);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if ($response === false) {
    echo json_encode([
        "error" => "Curl failed",
        "curl_error" => curl_error($ch),
        "http_code" => $httpCode
    ]);
    exit;
}

if (empty(trim($response))) {
    echo json_encode([
        "error" => "Empty response from FPL API",
        "http_code" => $httpCode
    ]);
    exit;
}

curl_close($ch);

// 6. Lagre i cache og returner
file_put_contents($cacheFile, $response);
header('X-Cache: MISS');
echo $response;
