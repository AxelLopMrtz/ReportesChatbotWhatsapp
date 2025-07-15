<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$mysqli = new mysqli("localhost", "root", "", "whatsappbot");
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Conexión fallida: " . $mysqli->connect_error]);
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
