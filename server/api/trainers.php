<?php

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT 
                u.id, 
                up.first_name, 
                up.last_name, 
                u.email, 
                up.phone_number, 
                (SELECT GROUP_CONCAT(b.id) FROM user_branch_assignments uba JOIN branches b ON uba.branch_id = b.id WHERE uba.user_id = u.id) as branch_ids,
                (SELECT GROUP_CONCAT(b.name) FROM user_branch_assignments uba JOIN branches b ON uba.branch_id = b.id WHERE uba.user_id = u.id) as branch_names
            FROM users u 
            JOIN user_profiles up ON u.id = up.user_id 
            WHERE u.role = 'trainer' 
            ORDER BY up.last_name, up.first_name";
    
    $result = $conn->query($sql);
    $trainers = [];
    if ($result) {
        while($row = $result->fetch_assoc()) {
            $row['branch_ids'] = $row['branch_ids'] ? explode(',', $row['branch_ids']) : [];
            $row['branch_names'] = $row['branch_names'] ? explode(',', $row['branch_names']) : [];
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
    
    $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
    $role = 'trainer';
    $branch_ids = $data['branch_ids'] ?? [];

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

        if (!empty($branch_ids)) {
            $stmt_assign = $conn->prepare("INSERT INTO user_branch_assignments (user_id, branch_id) VALUES (?, ?)");
            foreach ($branch_ids as $branch_id) {
                $stmt_assign->bind_param("ii", $user_id, $branch_id);
                $stmt_assign->execute();
            }
        }

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
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$id || empty($data['first_name']) || empty($data['last_name']) || empty($data['email'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Trainer ID, name, and email are required for update.']);
        exit();
    }

    $branch_ids = $data['branch_ids'] ?? [];

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

        // Delete old assignments
        $stmt_delete = $conn->prepare("DELETE FROM user_branch_assignments WHERE user_id = ?");
        $stmt_delete->bind_param("i", $id);
        $stmt_delete->execute();

        // Add new assignments
        if (!empty($branch_ids)) {
            $stmt_assign = $conn->prepare("INSERT INTO user_branch_assignments (user_id, branch_id) VALUES (?, ?)");
            foreach ($branch_ids as $branch_id) {
                $stmt_assign->bind_param("ii", $id, $branch_id);
                $stmt_assign->execute();
            }
        }

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

?>