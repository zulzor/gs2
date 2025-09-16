<?php
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT u.id, up.first_name, up.last_name, u.email, up.phone_number, up.branch_id, b.name as branch_name FROM users u JOIN user_profiles up ON u.id = up.user_id LEFT JOIN branches b ON up.branch_id = b.id WHERE u.role = 'trainer' ORDER BY up.last_name, up.first_name";
    $result = $conn->query($sql);
    $trainers = [];
    if ($result) {
        while($row = $result->fetch_assoc()) {
            $trainers[] = $row;
        }
    }
    echo json_encode(['success' => true, 'trainers' => $trainers]);
    exit();
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data['email']) || empty($data['password']) || empty($data['first_name']) || empty($data['last_name'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email, password, first name, and last name are required.']);
        exit();
    }
    $password_hash = 'hashed_password';
    $role = 'trainer';

    $conn->begin_transaction();
    try {
        $stmt_user = $conn->prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)");
        $stmt_user->bind_param("sss", $data['email'], $password_hash, $role);
        $stmt_user->execute();
        $user_id = $stmt_user->insert_id;
        $stmt_user->close();

        $stmt_profile = $conn->prepare("INSERT INTO user_profiles (user_id, first_name, last_name, phone_number, branch_id) VALUES (?, ?, ?, ?, ?)");
        $stmt_profile->bind_param("isssi", $user_id, $data['first_name'], $data['last_name'], $data['phone_number'], $data['branch_id']);
        $stmt_profile->execute();
        $stmt_profile->close();

        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Trainer created successfully', 'user_id' => $user_id]);
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        if ($conn->errno === 1062) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Error: Email already exists.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to create trainer. Error: ' . $e->getMessage()]);
        }
    }
    exit();
}

if ($method === 'PUT') {
    $id = $_GET['id'] ?? null;
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$id || empty($data['first_name']) || empty($data['last_name']) || empty($data['email'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Trainer ID, name, and email are required for update.']);
        exit();
    }

    $conn->begin_transaction();
    try {
        $stmt_user = $conn->prepare("UPDATE users SET email = ? WHERE id = ?");
        $stmt_user->bind_param("si", $data['email'], $id);
        $stmt_user->execute();
        $stmt_user->close();

        $stmt_profile = $conn->prepare("UPDATE user_profiles SET first_name = ?, last_name = ?, phone_number = ?, branch_id = ? WHERE user_id = ?");
        $stmt_profile->bind_param("sssii", $data['first_name'], $data['last_name'], $data['phone_number'], $data['branch_id'], $id);
        $stmt_profile->execute();
        $stmt_profile->close();

        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Trainer updated successfully']);
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update trainer. Error: ' . $e->getMessage()]);
    }
    exit();
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Trainer ID is required.']);
        exit();
    }
    $stmt = $conn->prepare("DELETE FROM users WHERE id = ? AND role = 'trainer'");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            http_response_code(204);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Trainer not found or user is not a trainer.']);
        }
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete parent.']);
    }
    $stmt->close();
    exit();
}

$conn->close();
?>