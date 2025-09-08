<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

require_once('/etc/chatbot-api/config.php');

$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'DB connect: '.$mysqli->connect_error]);
    exit;
}

$query = "SELECT * FROM ciudadano ORDER BY fecha_registro DESC";
$result = $mysqli->query($query);

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
?>
