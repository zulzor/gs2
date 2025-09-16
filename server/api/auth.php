<?php
session_start();

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once __DIR__ . '/../db.php';

// Handle pre-flight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Handle user login
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
        exit();
    }

    $stmt = $conn->prepare("SELECT u.id, u.role, up.first_name, up.last_name FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($user = $result->fetch_assoc()) {
        // For demo, we skip password verification
        $_SESSION['user_id'] = $user['id'];

        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'id' => $user['id'],
                'role' => $user['role'],
                'firstName' => $user['first_name'],
                'lastName' => $user['last_name']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    }

    $stmt->close();
    $conn->close();
    exit();
}

// Check session status
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_SESSION['user_id'])) {
        $userId = $_SESSION['user_id'];
        $stmt = $conn->prepare("SELECT u.id, u.role, up.first_name, up.last_name FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($user = $result->fetch_assoc()) {
            echo json_encode([
                'loggedIn' => true,
                'user' => [
                    'id' => $user['id'],
                    'role' => $user['role'],
                    'firstName' => $user['first_name'],
                    'lastName' => $user['last_name']
                ]
            ]);
        } else {
            echo json_encode(['loggedIn' => false]);
        }
        $stmt->close();
        $conn->close();
    } else {
        echo json_encode(['loggedIn' => false]);
    }
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method Not Allowed']);