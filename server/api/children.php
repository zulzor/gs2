<?php
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT c.id, c.first_name, c.last_name, c.date_of_birth, c.parent_user_id, c.branch_id, p.email as parent_email, b.name as branch_name FROM children c JOIN users p ON c.parent_user_id = p.id JOIN branches b ON c.branch_id = b.id ORDER BY c.last_name, c.first_name";
    $result = $conn->query($sql);
    $children = [];
    while($row = $result->fetch_assoc()) {
        $children[] = $row;
    }
    echo json_encode(['success' => true, 'children' => $children]);
    exit();
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data['first_name']) || empty($data['last_name']) || empty($data['date_of_birth']) || empty($data['parent_user_id']) || empty($data['branch_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'All fields are required.']);
        exit();
    }
    $stmt = $conn->prepare("INSERT INTO children (first_name, last_name, date_of_birth, parent_user_id, branch_id) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssii", $data['first_name'], $data['last_name'], $data['date_of_birth'], $data['parent_user_id'], $data['branch_id']);
    if ($stmt->execute()) {
        $new_child_id = $stmt->insert_id;
        echo json_encode(['success' => true, 'message' => 'Child created successfully', 'new_child_id' => $new_child_id]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create child.']);
    }
    $stmt->close();
    exit();
}

if ($method === 'PUT') {
    $id = $_GET['id'] ?? null;
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$id || empty($data['first_name']) || empty($data['last_name']) || empty($data['date_of_birth']) || empty($data['parent_user_id']) || empty($data['branch_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'All fields are required for update.']);
        exit();
    }
    $stmt = $conn->prepare("UPDATE children SET first_name = ?, last_name = ?, date_of_birth = ?, parent_user_id = ?, branch_id = ? WHERE id = ?");
    $stmt->bind_param("sssiii", $data['first_name'], $data['last_name'], $data['date_of_birth'], $data['parent_user_id'], $data['branch_id'], $id);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Child updated successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update child.']);
    }
    $stmt->close();
    exit();
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Child ID is required.']);
        exit();
    }
    $stmt = $conn->prepare("DELETE FROM children WHERE id = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            http_response_code(204);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Child not found.']);
        }
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete child.']);
    }
    $stmt->close();
    exit();
}

$conn->close();
?>