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

if (in_array($method, ['POST', 'PUT', 'DELETE']) && !in_array($role, ['manager'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit();
}

if ($method === 'GET') {
    $child_id = $_GET['child_id'] ?? null;
    $trainer_id = $_GET['trainer_id'] ?? null;

    $sql = "SELECT 
                t.id, 
                t.title,
                t.start_time, 
                t.end_time, 
                t.max_attendees,
                t.branch_id,
                b.name as branch_name,
                CONCAT(up.first_name, ' ', up.last_name) as trainer_name
            FROM trainings t
            JOIN branches b ON t.branch_id = b.id
            JOIN users u ON t.trainer_user_id = u.id
            JOIN user_profiles up ON u.id = up.user_id";

    $params = [];
    $types = '';

    if ($child_id) {
        $sql .= " JOIN training_attendance ta ON t.id = ta.training_id WHERE ta.child_id = ? AND ta.status = 'present'";
        $params[] = $child_id;
        $types .= 'i';
    } else if ($trainer_id) {
        $sql .= " WHERE t.trainer_user_id = ?";
        $params[] = $trainer_id;
        $types .= 'i';
    }

    $sql .= " ORDER BY t.start_time DESC";

    $stmt = $conn->prepare($sql);

    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $trainings = $result->fetch_all(MYSQLI_ASSOC);

    echo json_encode(['success' => true, 'trainings' => $trainings]);
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['title']) || empty($data['branch_id']) || empty($data['trainer_user_id']) || empty($data['start_time']) || empty($data['end_time'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Title, Branch, Trainer, and Start/End Times are required.']);
        exit();
    }

    $stmt = $conn->prepare("INSERT INTO trainings (title, branch_id, trainer_user_id, start_time, end_time, max_attendees) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("siissi", $data['title'], $data['branch_id'], $data['trainer_user_id'], $data['start_time'], $data['end_time'], $data['max_attendees']);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Training created successfully', 'id' => $conn->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create training.']);
    }
}

if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$id || empty($data['title']) || empty($data['branch_id']) || empty($data['trainer_user_id']) || empty($data['start_time']) || empty($data['end_time'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'All fields are required for update.']);
        exit();
    }

    $stmt = $conn->prepare("UPDATE trainings SET title = ?, branch_id = ?, trainer_user_id = ?, start_time = ?, end_time = ?, max_attendees = ? WHERE id = ?");
    $stmt->bind_param("siissii", $data['title'], $data['branch_id'], $data['trainer_user_id'], $data['start_time'], $data['end_time'], $data['max_attendees'], $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Training updated successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update training.']);
    }
}

if ($method === 'DELETE') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Training ID is required.']);
        exit();
    }

    $stmt = $conn->prepare("DELETE FROM trainings WHERE id = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        http_response_code(204);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete training.']);
    }
}

?>