<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$reporte_id = $input['reporte_id'] ?? $input['id'] ?? null;   // acepta ambos
$estado     = $input['estado'] ?? $input['nuevo_estado'] ?? null;

$permitidos = ['Sin revisar', 'Esperando recepción', 'Completado', 'Rechazado'];
if (!$reporte_id || !$estado || !in_array($estado, $permitidos, true)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Parámetros inválidos']);
  exit;
}

require_once('/etc/chatbot-api/config.php');

$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
if ($mysqli->connect_error) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'DB connect: '.$mysqli->connect_error]);
  exit;
}

/* 1) Verifica que el reporte exista */
$st = $mysqli->prepare("SELECT 1 FROM reporte WHERE id = ?");
$st->bind_param("s", $reporte_id);
$st->execute(); $st->store_result();
if ($st->num_rows === 0) {
  http_response_code(404);
  echo json_encode(['ok' => false, 'error' => 'Reporte no encontrado']);
  exit;
}
$st->close();

/* 2) Intenta ACTUALIZAR el estado existente (una sola fila por reporte) */
$upd = $mysqli->prepare("
  UPDATE estadoreporte
  SET estado = ?, fecha_estado = NOW()
  WHERE reporte_id = ?
");
$upd->bind_param("ss", $estado, $reporte_id);
$upd->execute();
$filas = $upd->affected_rows;
$upd->close();

/* 3) Si no existía, INSERTA por primera vez */
$modo = 'updated';
if ($filas === 0) {
  $ins = $mysqli->prepare("
    INSERT INTO estadoreporte (reporte_id, estado, fecha_estado)
    VALUES (?, ?, NOW())
  ");
  $ins->bind_param("ss", $reporte_id, $estado);
  if (!$ins->execute()) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'No se pudo guardar el estado']);
    exit;
  }
  $ins->close();
  $modo = 'inserted';
}

echo json_encode(['ok' => true, 'reporte_id' => $reporte_id, 'estado' => $estado, 'mode' => $modo]);
