<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$mysqli = new mysqli("crossover.proxy.rlwy.net", "root", "TWLhLEUhjeLmtKQgkHkBKxfBYbXIkXLK", "railway", 32613);
if ($mysqli->connect_error) {
    echo json_encode(["error" => $mysqli->connect_error]);
    exit;
}

$query = "
SELECT 
    r.id,
    r.tipo_reporte,
    r.descripcion,
    r.evidencia_recurso,
    r.ubicacion,
    r.fecha_hora,
    c.nombre,
    c.telefono,
    e.estado
FROM reporte r
JOIN ciudadano c ON r.ciudadano_id = c.id
LEFT JOIN (
    SELECT reporte_id, estado
    FROM estadoreporte
    WHERE (reporte_id, fecha_estado) IN (
        SELECT reporte_id, MAX(fecha_estado)
        FROM estadoreporte
        GROUP BY reporte_id
    )
) e ON r.id = e.reporte_id
ORDER BY r.fecha_hora DESC
";

$result = $mysqli->query($query);
$data = [];

while ($row = $result->fetch_assoc()) {
    // Procesar ubicación (lat, lng si aplica)
    if (!empty($row['ubicacion']) && str_contains($row['ubicacion'], ',')) {
    $coords = explode(',', $row['ubicacion']);
    $row['lat'] = floatval($coords[0]);
    $row['lng'] = floatval($coords[1]);
} else {
    $row['lat'] = 0;
    $row['lng'] = 0;
}


    // Color por estado (opcional si se usa)
    switch (strtolower($row['estado'])) {
        case 'completado':
            $row['color'] = 'green';
            break;
        case 'rechazado':
            $row['color'] = 'red';
            break;
        case 'esperando':
        case 'sin revisar':
            $row['color'] = 'grey';
            break;
        default:
            $row['color'] = 'blue';
            break;
    }

    $data[] = $row;
}

echo json_encode($data);
?> 