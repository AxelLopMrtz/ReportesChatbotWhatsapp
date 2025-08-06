<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Conexión
$mysqli = new mysqli("crossover.proxy.rlwy.net", "root", "TWLhLEUhjeLmtKQgkHkBKxfBYbXIkXLK", "railway", 32613);
if ($mysqli->connect_error) {
    echo json_encode(["error" => $mysqli->connect_error]);
    exit;
}

// Consulta con JOIN (unificada y con alias correcto)
$query = "
SELECT 
    h.id,
    c.nombre AS ciudadano,
    h.mensaje,
    h.fecha_hora
FROM historialmensajes h
LEFT JOIN ciudadano c ON h.ciudadano_id = c.id
ORDER BY h.fecha_hora DESC
";

$result = $mysqli->query($query);
$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
?>
