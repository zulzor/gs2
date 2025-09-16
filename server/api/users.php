<?php
session_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'manager') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

switch ($method) {
    case 'GET':
        $sql = "SELECT u.id, u.email, u.role, up.first_name, up.last_name, up.phone_number, up.branch_id, b.name as branch_name 
                FROM users u 
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN branches b ON up.branch_id = b.id";
        if ($id) {
            $sql .= " WHERE u.id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            $result = $conn->query($sql);
            $users = $result->fetch_all(MYSQLI_ASSOC);
            echo json_encode(['success' => true, 'users' => $users]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Basic validation
        if (empty($data['email']) || empty($data['password']) || empty($data['role'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email, password, and role are required.']);
            exit();
        }

        $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);

        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)");
            $stmt->bind_param("sss", $data['email'], $password_hash, $data['role']);
            $stmt->execute();
            $user_id = $conn->insert_id;

            $stmt = $conn->prepare("INSERT INTO user_profiles (user_id, first_name, last_name, phone_number, branch_id) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("isssi", $user_id, $data['firstName'], $data['lastName'], $data['phone'], $data['branchId']);
            $stmt->execute();

            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'User created successfully', 'id' => $user_id]);
        } catch (mysqli_sql_exception $exception) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to create user: ' . $exception->getMessage()]);
        }
        break;

    case 'PUT':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User ID is required']);
            exit();
        }
        $data = json_decode(file_get_contents('php://input'), true);

        // Logic to update user and user_profile tables
        // For simplicity, only updating profile data for now
        $stmt = $conn->prepare("UPDATE user_profiles SET first_name = ?, last_name = ?, phone_number = ?, branch_id = ? WHERE user_id = ?");
        $stmt->bind_param("sssii", $data['firstName'], $data['lastName'], $data['phone'], $data['branchId'], $id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'User updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update user']);
        }
        break;

    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User ID is required']);
            exit();
        }

        $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete user']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
        break;
}

$conn->close();
