<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

require_once('/etc/chatbot-api/config.php');

$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($mysqli->connect_error) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Conexión fallida: ' . $mysqli->connect_error]);
  exit;
}

function contar($conn, $query) {
    $res = $conn->query($query);
    $row = $res->fetch_assoc();
    return (int) $row['count'];
}

$total = contar($mysqli, "SELECT COUNT(*) as count FROM reporte");
$sin_revisar = contar($mysqli, "SELECT COUNT(*) as count FROM estadoreporte WHERE estado = 'Sin revisar'");
$esperando = contar($mysqli, "SELECT COUNT(*) as count FROM estadoreporte WHERE estado = 'Esperando recepción'");
$completado = contar($mysqli, "SELECT COUNT(*) as count FROM estadoreporte WHERE estado = 'Completado'");
$rechazado = contar($mysqli, "SELECT COUNT(*) as count FROM estadoreporte WHERE estado LIKE 'Rechazado%'");

echo json_encode([
    "total" => $total,
    "sin_revisar" => $sin_revisar,
    "esperando" => $esperando,
    "completado" => $completado,
    "rechazado" => $rechazado
]);
?>
