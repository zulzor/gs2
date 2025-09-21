<?php

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle pre-flight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
require_once __DIR__ . '/../db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST': // Login
        $data = json_decode(file_get_contents('php://input'), true);
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';

        if (empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
            exit();
        }

        $stmt = $conn->prepare("SELECT u.id, u.email, u.password_hash, u.role, up.first_name, up.last_name FROM users u JOIN user_profiles up ON u.id = up.user_id WHERE u.email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['first_name'] = $user['first_name'];
            $_SESSION['last_name'] = $user['last_name'];

            echo json_encode(['success' => true, 'message' => 'Login successful', 'user' => ['id' => $user['id'], 'email' => $user['email'], 'role' => $user['role'], 'firstName' => $user['first_name'], 'lastName' => $user['last_name'] ]]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        }
        $stmt->close();
        break;

    case 'GET': // Check session status or logout
        if (isset($_GET['logout']) && $_GET['logout'] === 'true') {
            session_unset();
            session_destroy();
            echo json_encode(['success' => true, 'loggedIn' => false, 'message' => 'Logged out successfully']);
        } else if (isset($_SESSION['user_id'])) {
            $userId = $_SESSION['user_id'];
            $stmt = $conn->prepare("SELECT u.id, u.email, u.role, up.first_name, up.last_name FROM users u JOIN user_profiles up ON u.id = up.user_id WHERE u.id = ?");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($user = $result->fetch_assoc()) {
                echo json_encode([
                    'loggedIn' => true, // Align with frontend expectation
                    'user' => [
                        'id' => $user['id'],
                        'email' => $user['email'],
                        'role' => $user['role'],
                        'firstName' => $user['first_name'],
                        'lastName' => $user['last_name']
                    ]
                ]);
            } else {
                http_response_code(401);
                echo json_encode(['loggedIn' => false, 'message' => 'User not found in session.']);
            }
            $stmt->close();
        } else {
            http_response_code(401);
            echo json_encode(['loggedIn' => false, 'message' => 'Not logged in']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
        break;
}

?>