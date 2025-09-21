<?php

header("Access-Control-Allow-Origin: http://localhost:9000");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();
require_once __DIR__ . '/../db.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'manager') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $sql = "SELECT 
                    u.id, 
                    u.email, 
                    u.role, 
                    up.first_name, 
                    up.last_name, 
                    up.phone_number,
                    (SELECT GROUP_CONCAT(b.id) FROM user_branch_assignments uba JOIN branches b ON uba.branch_id = b.id WHERE uba.user_id = u.id) as branch_ids,
                    (SELECT GROUP_CONCAT(b.name) FROM user_branch_assignments uba JOIN branches b ON uba.branch_id = b.id WHERE uba.user_id = u.id) as branch_names
                FROM users u 
                LEFT JOIN user_profiles up ON u.id = up.user_id";
        
        if ($id) {
            $sql .= " WHERE u.id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            $user['branch_ids'] = $user['branch_ids'] ? explode(',', $user['branch_ids']) : [];
            $user['branch_names'] = $user['branch_names'] ? explode(',', $user['branch_names']) : [];
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            $result = $conn->query($sql);
            $users = [];
            while($row = $result->fetch_assoc()) {
                $row['branch_ids'] = $row['branch_ids'] ? explode(',', $row['branch_ids']) : [];
                $row['branch_names'] = $row['branch_names'] ? explode(',', $row['branch_names']) : [];
                $users[] = $row;
            }
            echo json_encode(['success' => true, 'users' => $users]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['email']) || empty($data['password']) || empty($data['role'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email, password, and role are required.']);
            exit();
        }

        $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
        $branch_ids = $data['branch_ids'] ?? [];

        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)");
            $stmt->bind_param("sss", $data['email'], $password_hash, $data['role']);
            $stmt->execute();
            $user_id = $conn->insert_id;

            $stmt_profile = $conn->prepare("INSERT INTO user_profiles (user_id, first_name, last_name, phone_number) VALUES (?, ?, ?, ?)");
            $stmt_profile->bind_param("isss", $user_id, $data['first_name'], $data['last_name'], $data['phone_number']);
            $stmt_profile->execute();

            if (!empty($branch_ids) && $data['role'] === 'trainer') {
                $stmt_assign = $conn->prepare("INSERT INTO user_branch_assignments (user_id, branch_id) VALUES (?, ?)");
                foreach ($branch_ids as $branch_id) {
                    $stmt_assign->bind_param("ii", $user_id, $branch_id);
                    $stmt_assign->execute();
                }
            }

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
        $branch_ids = $data['branch_ids'] ?? [];

        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare("UPDATE user_profiles SET first_name = ?, last_name = ?, phone_number = ? WHERE user_id = ?");
            $stmt->bind_param("sssi", $data['first_name'], $data['last_name'], $data['phone_number'], $id);
            $stmt->execute();

            // Only update branch assignments for trainers
            $user_role_stmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
            $user_role_stmt->bind_param("i", $id);
            $user_role_stmt->execute();
            $user_role = $user_role_stmt->get_result()->fetch_assoc()['role'];

            if ($user_role === 'trainer') {
                $stmt_delete = $conn->prepare("DELETE FROM user_branch_assignments WHERE user_id = ?");
                $stmt_delete->bind_param("i", $id);
                $stmt_delete->execute();

                if (!empty($branch_ids)) {
                    $stmt_assign = $conn->prepare("INSERT INTO user_branch_assignments (user_id, branch_id) VALUES (?, ?)");
                    foreach ($branch_ids as $branch_id) {
                        $stmt_assign->bind_param("ii", $id, $branch_id);
                        $stmt_assign->execute();
                    }
                }
            }

            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'User updated successfully']);
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update user: ' . $e->getMessage()]);
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

?>