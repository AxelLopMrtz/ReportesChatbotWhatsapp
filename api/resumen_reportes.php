<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$mysqli = new mysqli("localhost", "root", "", "whatsappbot");
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

$total = contar($mysqli, "SELECT COUNT(*) as count FROM Reporte");
$sin_revisar = contar($mysqli, "SELECT COUNT(*) as count FROM EstadoReporte WHERE estado = 'Sin revisar'");
$esperando = contar($mysqli, "SELECT COUNT(*) as count FROM EstadoReporte WHERE estado = 'Esperando recepción'");
$completado = contar($mysqli, "SELECT COUNT(*) as count FROM EstadoReporte WHERE estado = 'Completado'");
$rechazado = contar($mysqli, "SELECT COUNT(*) as count FROM EstadoReporte WHERE estado LIKE 'Rechazado%'");

echo json_encode([
    "total" => $total,
    "sin_revisar" => $sin_revisar,
    "esperando" => $esperando,
    "completado" => $completado,
    "rechazado" => $rechazado
]);
?>
