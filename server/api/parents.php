<?php

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT u.id, up.first_name, up.last_name, u.email, up.phone_number FROM users u JOIN user_profiles up ON u.id = up.user_id WHERE u.role = 'parent' ORDER BY up.last_name, up.first_name";
    $result = $conn->query($sql);
    $parents = [];
    if ($result) {
        while($row = $result->fetch_assoc()) {
            $parents[] = $row;
        }
    }
    echo json_encode(['success' => true, 'parents' => $parents]);
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data['email']) || empty($data['password']) || empty($data['first_name']) || empty($data['last_name'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email, password, first name, and last name are required.']);
        exit();
    }
    $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
    $role = 'parent';

    $conn->begin_transaction();
    try {
        $stmt_user = $conn->prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)");
        $stmt_user->bind_param("sss", $data['email'], $password_hash, $role);
        $stmt_user->execute();
        $user_id = $stmt_user->insert_id;
        $stmt_user->close();

        $stmt_profile = $conn->prepare("INSERT INTO user_profiles (user_id, first_name, last_name, phone_number) VALUES (?, ?, ?, ?)");
        $stmt_profile->bind_param("isss", $user_id, $data['first_name'], $data['last_name'], $data['phone_number']);
        $stmt_profile->execute();
        $stmt_profile->close();

        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Parent created successfully', 'user_id' => $user_id]);
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        if ($conn->errno === 1062) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Error: Email already exists.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to create parent. Error: ' . $e->getMessage()]);
        }
    }
}

if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$id || empty($data['first_name']) || empty($data['last_name']) || empty($data['email'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Parent ID, name, and email are required for update.']);
        exit();
    }

    $conn->begin_transaction();
    try {
        $stmt_user = $conn->prepare("UPDATE users SET email = ? WHERE id = ?");
        $stmt_user->bind_param("si", $data['email'], $id);
        $stmt_user->execute();
        $stmt_user->close();

        $stmt_profile = $conn->prepare("UPDATE user_profiles SET first_name = ?, last_name = ?, phone_number = ? WHERE user_id = ?");
        $stmt_profile->bind_param("sssi", $data['first_name'], $data['last_name'], $data['phone_number'], $id);
        $stmt_profile->execute();
        $stmt_profile->close();

        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Parent updated successfully']);
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update parent. Error: ' . $e->getMessage()]);
    }
}

if ($method === 'DELETE') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Parent ID is required.']);
        exit();
    }
    $stmt = $conn->prepare("DELETE FROM users WHERE id = ? AND role = 'parent'");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            http_response_code(204);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Parent not found or user is not a parent.']);
        }
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete parent.']);
    }
    $stmt->close();
}

?>