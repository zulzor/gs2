<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$role = $_SESSION['role'] ?? null;

if (in_array($method, ['POST', 'PUT', 'DELETE']) && !in_array($role, ['manager', 'trainer'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit();
}

if ($method === 'GET') {
    $user_id = $_SESSION['user_id'];
    $base_sql = "SELECT 
                    c.id, 
                    c.first_name, 
                    c.last_name, 
                    c.date_of_birth, 
                    c.parent_user_id, 
                    p.email as parent_email,
                    (SELECT GROUP_CONCAT(b.id) FROM child_branch_assignments cba JOIN branches b ON cba.branch_id = b.id WHERE cba.child_id = c.id) as branch_ids,
                    (SELECT GROUP_CONCAT(b.name) FROM child_branch_assignments cba JOIN branches b ON cba.branch_id = b.id WHERE cba.child_id = c.id) as branch_names
                FROM children c 
                LEFT JOIN users p ON c.parent_user_id = p.id";

    if ($role === 'parent') {
        $base_sql .= " WHERE c.parent_user_id = ?";
        $stmt = $conn->prepare($base_sql);
        $stmt->bind_param("i", $user_id);
    } else {
        $stmt = $conn->prepare($base_sql);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $children = [];
    while($row = $result->fetch_assoc()) {
        // Convert comma-separated strings to arrays
        $row['branch_ids'] = $row['branch_ids'] ? explode(',', $row['branch_ids']) : [];
        $row['branch_names'] = $row['branch_names'] ? explode(',', $row['branch_names']) : [];
        $children[] = $row;
    }
    echo json_encode(['success' => true, 'children' => $children]);
    exit();
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data['first_name']) || empty($data['last_name']) || empty($data['date_of_birth'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'First name, last name, and date of birth are required.']);
        exit();
    }

    $parent_user_id = $data['parent_user_id'] ?? null;
    $branch_ids = $data['branch_ids'] ?? [];

    $conn->begin_transaction();

    try {
        $stmt = $conn->prepare("INSERT INTO children (first_name, last_name, date_of_birth, parent_user_id) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("sssi", $data['first_name'], $data['last_name'], $data['date_of_birth'], $parent_user_id);
        $stmt->execute();
        $new_child_id = $stmt->insert_id;

        if (!empty($branch_ids)) {
            $stmt_assign = $conn->prepare("INSERT INTO child_branch_assignments (child_id, branch_id) VALUES (?, ?)");
            foreach ($branch_ids as $branch_id) {
                $stmt_assign->bind_param("ii", $new_child_id, $branch_id);
                $stmt_assign->execute();
            }
        }

        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Child created successfully', 'new_child_id' => $new_child_id]);
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create child.', 'error' => $e->getMessage()]);
    }
    exit();
}

if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$id || empty($data['first_name']) || empty($data['last_name']) || empty($data['date_of_birth'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Child ID and all required fields are necessary for update.']);
        exit();
    }

    $parent_user_id = $data['parent_user_id'] ?? null;
    $branch_ids = $data['branch_ids'] ?? [];

    $conn->begin_transaction();

    try {
        $stmt = $conn->prepare("UPDATE children SET first_name = ?, last_name = ?, date_of_birth = ?, parent_user_id = ? WHERE id = ?");
        $stmt->bind_param("sssii", $data['first_name'], $data['last_name'], $data['date_of_birth'], $parent_user_id, $id);
        $stmt->execute();

        // Delete old assignments
        $stmt_delete = $conn->prepare("DELETE FROM child_branch_assignments WHERE child_id = ?");
        $stmt_delete->bind_param("i", $id);
        $stmt_delete->execute();

        // Add new assignments
        if (!empty($branch_ids)) {
            $stmt_assign = $conn->prepare("INSERT INTO child_branch_assignments (child_id, branch_id) VALUES (?, ?)");
            foreach ($branch_ids as $branch_id) {
                $stmt_assign->bind_param("ii", $id, $branch_id);
                $stmt_assign->execute();
            }
        }

        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Child updated successfully']);
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update child.', 'error' => $e->getMessage()]);
    }
    exit();
}

if ($method === 'DELETE') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Child ID is required.']);
        exit();
    }
    $stmt = $conn->prepare("DELETE FROM children WHERE id = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        // The ON DELETE CASCADE will handle related assignments
        if ($stmt->affected_rows > 0) {
            http_response_code(204);
        }
        else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Child not found.']);
        }
    }
    else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete child.']);
    }
    $stmt->close();
    exit();
}

?>