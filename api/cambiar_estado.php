<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

// Conexión a la base de datos
require_once('/etc/chatbot-api/config.php');

$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($mysqli->connect_error) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Conexión fallida: ' . $mysqli->connect_error]);
  exit;
}

// Obtener datos desde el cuerpo del POST
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["id"]) || !isset($data["nuevo_estado"])) {
    echo json_encode(["error" => "Datos incompletos"]);
    exit;
}

$id = intval($data["id"]);
$nuevo_estado = $mysqli->real_escape_string($data["nuevo_estado"]);

// Insertar nuevo estado en la tabla estadoreporte
$stmt = $mysqli->prepare("INSERT INTO estadoreporte (reporte_id, estado, fecha_estado) VALUES (?, ?, NOW())");
$stmt->bind_param("is", $id, $nuevo_estado);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Estado actualizado correctamente"]);
} else {
    echo json_encode(["error" => "Error al insertar estado: " . $stmt->error]);
}

$stmt->close();
$mysqli->close();
