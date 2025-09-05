<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$reporte_id = $input['reporte_id'] ?? null;
$estado = $input['estado'] ?? null;

$permitidos = ['Sin revisar', 'Esperando recepción', 'Completado', 'Rechazado'];

if (!$reporte_id || !$estado || !in_array($estado, $permitidos, true)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Parámetros inválidos']);
  exit;
}
$mysqli = new mysqli("shinkansen.proxy.rlwy.net", "root", "vQQdHDWRSvdqLSasZEpzZaSsGcTqsAKW", "railway", 57912);
if ($mysqli->connect_error) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Conexión fallida: ' . $mysqli->connect_error]);
  exit;
}

// Verifica que el reporte exista
$st = $mysqli->prepare("SELECT 1 FROM reporte WHERE id = ?");
$st->bind_param("s", $reporte_id);
$st->execute();
$st->store_result();
if ($st->num_rows === 0) {
  http_response_code(404);
  echo json_encode(['ok' => false, 'error' => 'Reporte no encontrado']);
  exit;
}
$st->close();

// Inserta NUEVO estado (histórico)
$st2 = $mysqli->prepare("INSERT INTO estadoreporte (reporte_id, estado, fecha_estado) VALUES (?, ?, NOW())");
$st2->bind_param("ss", $reporte_id, $estado);
$ok = $st2->execute();
$st2->close();

if (!$ok) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'No se pudo guardar el estado']);
  exit;
}

echo json_encode(['ok' => true, 'reporte_id' => $reporte_id, 'estado' => $estado]);
