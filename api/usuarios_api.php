<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "conexion.php"; // tu archivo de conexión

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
  case 'GET':
    $sql = "SELECT id, username, rol, activo, fecha_creacion FROM usuario ORDER BY id DESC";
    $result = $conn->query($sql);
    $usuarios = $result->fetch_all(MYSQLI_ASSOC);
    echo json_encode($usuarios);
    break;

  case 'POST':
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $conn->prepare("INSERT INTO usuario (username, password_hash, rol) VALUES (?, ?, ?)");
    $password = password_hash($data['password'], PASSWORD_DEFAULT);
    $stmt->bind_param("sss", $data['username'], $password, $data['rol']);
    echo json_encode(["success" => $stmt->execute()]);
    break;

  case 'PUT':
    $data = json_decode(file_get_contents("php://input"), true);
    if (isset($data['password']) && $data['password'] !== "") {
      $password = password_hash($data['password'], PASSWORD_DEFAULT);
      $stmt = $conn->prepare("UPDATE usuario SET username=?, password_hash=?, rol=?, activo=? WHERE id=?");
      $stmt->bind_param("sssii", $data['username'], $password, $data['rol'], $data['activo'], $data['id']);
    } else {
      $stmt = $conn->prepare("UPDATE usuario SET username=?, rol=?, activo=? WHERE id=?");
      $stmt->bind_param("ssii", $data['username'], $data['rol'], $data['activo'], $data['id']);
    }
    echo json_encode(["success" => $stmt->execute()]);
    break;

  case 'DELETE':
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $conn->prepare("DELETE FROM usuario WHERE id=?");
    $stmt->bind_param("i", $data['id']);
    echo json_encode(["success" => $stmt->execute()]);
    break;
}
