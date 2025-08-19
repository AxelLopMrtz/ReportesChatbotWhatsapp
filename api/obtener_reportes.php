<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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
    SELECT t1.reporte_id, t1.estado
    FROM estadoreporte t1
    INNER JOIN (
        SELECT reporte_id, MAX(fecha_estado) AS max_fecha
        FROM estadoreporte
        GROUP BY reporte_id
    ) t2 ON t1.reporte_id = t2.reporte_id AND t1.fecha_estado = t2.max_fecha
) e ON r.id = e.reporte_id
ORDER BY r.fecha_hora DESC
";

$result = $mysqli->query($query);
$data = [];

/**
 * Extrae coordenadas desde un texto o URL.
 * Soporta formatos:
 *   - https://maps.google.com/?q=lat,lng
 *   - ...@lat,lng,zoomz
 *   - cualquier "lat,lng" que aparezca en el texto
 */
function extraer_coordenadas($texto) {
    if (empty($texto)) return [0, 0];
    $u = (string)$texto;

    // 1) ...?q=lat,lng
    if (preg_match('/[?&]q=([-+]?\d+(?:\.\d+)?),\s*([-+]?\d+(?:\.\d+)?)/', $u, $m)) {
        return [floatval($m[1]), floatval($m[2])];
    }
    // 2) ...@lat,lng
    if (preg_match('/@([-+]?\d+(?:\.\d+)?),\s*([-+]?\d+(?:\.\d+)?)/', $u, $m)) {
        return [floatval($m[1]), floatval($m[2])];
    }
    // 3) primer par lat,lng en el texto
    if (preg_match('/([-+]?\d+(?:\.\d+)?),\s*([-+]?\d+(?:\.\d+)?)/', $u, $m)) {
        return [floatval($m[1]), floatval($m[2])];
    }
    return [0, 0];
}

while ($row = $result->fetch_assoc()) {

    // Coordenadas: prioriza si ya vienen separadas; si no, extrae del texto/link
    $lat = 0.0; $lng = 0.0;

    // Si la BD guarda solo "lat,lng"
    if (!empty($row['ubicacion']) && strpos($row['ubicacion'], ',') !== false) {
        // intenta parseo directo
        $parts = explode(',', $row['ubicacion']);
        if (count($parts) >= 2 && is_numeric(trim($parts[0])) && is_numeric(trim($parts[1]))) {
            $lat = floatval($parts[0]);
            $lng = floatval($parts[1]);
        } else {
            // si no fue un par limpio, usa regex (links de Google, etc.)
            list($lat, $lng) = extraer_coordenadas($row['ubicacion']);
        }
    } else {
        // si no hay coma (probable texto o URL), usa regex
        list($lat, $lng) = extraer_coordenadas($row['ubicacion']);
    }

    $row['lat'] = $lat;
    $row['lng'] = $lng;

    // Color por estado (opcional)
    switch (strtolower((string)$row['estado'])) {
        case 'completado': $row['color'] = 'green'; break;
        case 'rechazado':  $row['color'] = 'red';   break;
        case 'esperando':
        case 'sin revisar': $row['color'] = 'grey'; break;
        default: $row['color'] = 'blue'; break;
    }

    $data[] = $row;
}

echo json_encode($data, JSON_UNESCAPED_UNICODE);
