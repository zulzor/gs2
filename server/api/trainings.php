<?php
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT 
                t.id, 
                t.start_time, 
                t.end_time, 
                t.max_attendees,
                b.name as branch_name,
                d.name as discipline_name,
                CONCAT(up.first_name, ' ', up.last_name) as trainer_name
            FROM trainings t
            JOIN branches b ON t.branch_id = b.id
            JOIN disciplines d ON t.discipline_id = d.id
            JOIN users u ON t.trainer_user_id = u.id
            JOIN user_profiles up ON u.id = up.user_id
            ORDER BY t.start_time DESC";

    $result = $conn->query($sql);
    $trainings = [];
    if ($result) {
        while($row = $result->fetch_assoc()) {
            $trainings[] = $row;
        }
    }

    echo json_encode(['success' => true, 'trainings' => $trainings]);
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Validation
    if (empty($data['branch_id']) || empty($data['discipline_id']) || empty($data['trainer_user_id']) || empty($data['start_time']) || empty($data['end_time'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'All fields are required.']);
        exit();
    }

    $stmt = $conn->prepare("INSERT INTO trainings (branch_id, discipline_id, trainer_user_id, start_time, end_time, max_attendees) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("iiissi", 
        $data['branch_id'], 
        $data['discipline_id'], 
        $data['trainer_user_id'],
        $data['start_time'],
        $data['end_time'],
        $data['max_attendees']
    );

    if ($stmt->execute()) {
        $new_training_id = $stmt->insert_id;
        echo json_encode(['success' => true, 'message' => 'Training created successfully', 'new_training_id' => $new_training_id]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create training.']);
    }
    $stmt->close();
}

if ($method === 'PUT') {
    $id = $_GET['id'] ?? null;
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$id || empty($data['branch_id']) || empty($data['discipline_id']) || empty($data['trainer_user_id']) || empty($data['start_time']) || empty($data['end_time'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'All fields are required for update.']);
        exit();
    }

    $stmt = $conn->prepare("UPDATE trainings SET branch_id = ?, discipline_id = ?, trainer_user_id = ?, start_time = ?, end_time = ?, max_attendees = ? WHERE id = ?");
    $stmt->bind_param("iiissii", 
        $data['branch_id'], 
        $data['discipline_id'], 
        $data['trainer_user_id'],
        $data['start_time'],
        $data['end_time'],
        $data['max_attendees'],
        $id
    );

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Training updated successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update training.']);
    }
    $stmt->close();
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Training ID is required.']);
        exit();
    }

    $stmt = $conn->prepare("DELETE FROM trainings WHERE id = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            http_response_code(204); // Success, no content
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Training not found.']);
        }
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete training.']);
    }
    $stmt->close();
}

$conn->close();
?>
