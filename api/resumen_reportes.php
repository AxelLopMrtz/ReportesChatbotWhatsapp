<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$mysqli = new mysqli("crossover.proxy.rlwy.net", "root", "TWLhLEUhjeLmtKQgkHkBKxfBYbXIkXLK", "railway", 32613);
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Conexión fallida: " . $mysqli->connect_error]);
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
