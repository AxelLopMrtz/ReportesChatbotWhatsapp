<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once('/etc/chatbot-api/config.php');

$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'DB connect: ' . $mysqli->connect_error]);
    exit;
}

// 🔢 Parámetros de paginación
$pagina = isset($_GET['pagina']) ? max(1, intval($_GET['pagina'])) : 1;
$limite = isset($_GET['limite']) ? max(10, intval($_GET['limite'])) : 50;
$offset = ($pagina - 1) * $limite;

// 📌 Nuevo: filtro opcional de estados (pueden venir varios separados por coma)
$estados = [];
if (!empty($_GET['estados'])) {
    $rawEstados = explode(',', $_GET['estados']);
    foreach ($rawEstados as $e) {
        $e = trim($e);
        if ($e !== '') $estados[] = $mysqli->real_escape_string($e);
    }
}

$whereEstado = '';
if (count($estados) > 0) {
    $in = "'" . implode("','", $estados) . "'";
    $whereEstado = "WHERE e.estado IN ($in)";
}

// 📦 Query paginada con filtro opcional
$query = "
SELECT SQL_CALC_FOUND_ROWS 
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
$whereEstado
ORDER BY r.fecha_hora DESC
LIMIT $offset, $limite
";

$result = $mysqli->query($query);
$data = [];

// 🧠 Total real de reportes (con filtros aplicados)
$totalResult = $mysqli->query("SELECT FOUND_ROWS() as total");
$totalRow = $totalResult->fetch_assoc();
$total = intval($totalRow['total'] ?? 0);

// ===== Extraer coordenadas =====
function extraer_coordenadas($texto) {
    if (empty($texto)) return [0, 0];
    $u = (string)$texto;

    if (preg_match('/[?&]q=([-+]?\d+(?:\.\d+)?),\s*([-+]?\d+(?:\.\d+)?)/', $u, $m)) {
        return [floatval($m[1]), floatval($m[2])];
    }
    if (preg_match('/@([-+]?\d+(?:\.\d+)?),\s*([-+]?\d+(?:\.\d+)?)/', $u, $m)) {
        return [floatval($m[1]), floatval($m[2])];
    }
    if (preg_match('/([-+]?\d+(?:\.\d+)?),\s*([-+]?\d+(?:\.\d+)?)/', $u, $m)) {
        return [floatval($m[1]), floatval($m[2])];
    }
    return [0, 0];
}

while ($row = $result->fetch_assoc()) {
    $lat = 0.0; $lng = 0.0;
    if (!empty($row['ubicacion']) && strpos($row['ubicacion'], ',') !== false) {
        $parts = explode(',', $row['ubicacion']);
        if (count($parts) >= 2 && is_numeric(trim($parts[0])) && is_numeric(trim($parts[1]))) {
            $lat = floatval($parts[0]);
            $lng = floatval($parts[1]);
        } else {
            list($lat, $lng) = extraer_coordenadas($row['ubicacion']);
        }
    } else {
        list($lat, $lng) = extraer_coordenadas($row['ubicacion']);
    }

    $row['lat'] = $lat;
    $row['lng'] = $lng;

    $data[] = $row;
}

echo json_encode([
    'ok' => true,
    'data' => $data,
    'total' => $total
], JSON_UNESCAPED_UNICODE);
