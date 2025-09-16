<?php
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT id, name, measurement_type FROM disciplines ORDER BY name";
    $result = $conn->query($sql);
    $disciplines = [];
    if ($result) {
        while($row = $result->fetch_assoc()) {
            $disciplines[] = $row;
        }
    }
    echo json_encode(['success' => true, 'disciplines' => $disciplines]);
    exit();
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data['name']) || empty($data['measurement_type'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Name and measurement type are required.']);
        exit();
    }

    try {
        $stmt = $conn->prepare("INSERT INTO disciplines (name, measurement_type) VALUES (?, ?)");
        $stmt->bind_param("ss", $data['name'], $data['measurement_type']);
        $stmt->execute();
        $new_id = $stmt->insert_id;
        $stmt->close();
        echo json_encode(['success' => true, 'message' => 'Discipline created successfully', 'id' => $new_id]);
    } catch (Exception $e) {
        http_response_code(500);
        if ($conn->errno === 1062) { // Duplicate entry
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Error: Discipline name already exists.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to create discipline. Error: ' . $e->getMessage()]);
        }
    }
    exit();
}

if ($method === 'PUT') {
    $id = $_GET['id'] ?? null;
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$id || empty($data['name']) || empty($data['measurement_type'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Discipline ID, name, and measurement type are required.']);
        exit();
    }

    try {
        $stmt = $conn->prepare("UPDATE disciplines SET name = ?, measurement_type = ? WHERE id = ?");
        $stmt->bind_param("ssi", $data['name'], $data['measurement_type'], $id);
        $stmt->execute();
        $stmt->close();
        echo json_encode(['success' => true, 'message' => 'Discipline updated successfully']);
    } catch (Exception $e) {
        http_response_code(500);
         if ($conn->errno === 1062) { // Duplicate entry
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Error: Discipline name already exists.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update discipline. Error: ' . $e->getMessage()]);
        }
    }
    exit();
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Discipline ID is required.']);
        exit();
    }
    $stmt = $conn->prepare("DELETE FROM disciplines WHERE id = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            http_response_code(204); // No Content
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Discipline not found.']);
        }
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete discipline.']);
    }
    $stmt->close();
    exit();
}

$conn->close();
?>