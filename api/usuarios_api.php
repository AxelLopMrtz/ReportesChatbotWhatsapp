<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Obtener datos del cuerpo JSON
$input = json_decode(file_get_contents("php://input"), true);
$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Faltan campos.']);
    exit();
}

// Conexión a la base de datos Railway
$mysqli = new mysqli("crossover.proxy.rlwy.net", "root", "TWLhLEUhjeLmtKQgkHkBKxfBYbXIkXLK", "railway", 32613);
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Conexión fallida: ' . $mysqli->connect_error]);
    exit();
}

// Buscar usuario por username y contraseña
$stmt = $mysqli->prepare("SELECT id, username, rol FROM usuario WHERE username = ? AND password_hash = ? AND activo = 1");
$stmt->bind_param("ss", $username, $password);
$stmt->execute();
$result = $stmt->get_result();

if ($user = $result->fetch_assoc()) {
    echo json_encode([
        "success" => true,
        "id" => $user["id"],
        "username" => $user["username"],
        "rol" => $user["rol"]
    ]);
} else {
    http_response_code(401);
    echo json_encode(["error" => "Usuario o contraseña incorrecta."]);
}

$stmt->close();
$mysqli->close();
?>
