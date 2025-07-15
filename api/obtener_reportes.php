<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$mysqli = new mysqli("localhost", "root", "", "whatsappbot");
if ($mysqli->connect_error) {
    echo json_encode(["error" => $mysqli->connect_error]);
    exit;
}

$query = "
SELECT 
    r.id,
    r.tipo_reporte,
    r.descripcion,
    r.ubicacion,
    r.fecha_hora,
    c.nombre,
    c.telefono,
    e.estado
FROM Reporte r
JOIN Ciudadano c ON r.ciudadano_id = c.id
LEFT JOIN (
    SELECT reporte_id, estado
    FROM EstadoReporte
    WHERE (reporte_id, fecha_estado) IN (
        SELECT reporte_id, MAX(fecha_estado)
        FROM EstadoReporte
        GROUP BY reporte_id
    )
) e ON r.id = e.reporte_id
ORDER BY r.fecha_hora DESC
";

$result = $mysqli->query($query);
$data = [];

while ($row = $result->fetch_assoc()) {
    // Procesar ubicación (lat, lng si aplica)
    if (!empty($row['ubicacion'])) {
        $coords = explode(',', $row['ubicacion']);
        $row['lat'] = floatval($coords[0]);
        $row['lng'] = floatval($coords[1]);
    } else {
        $row['lat'] = null;
        $row['lng'] = null;
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
