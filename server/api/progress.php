<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle pre-flight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if user is authenticated
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$role = $_SESSION['role'] ?? null;
$user_id = $_SESSION['user_id'];

// Authorization for POST, PUT, DELETE: only managers and trainers
if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
    if (!in_array($role, ['manager', 'trainer'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden']);
        exit();
    }
}

switch ($method) {
    case 'GET':
        $sql = "SELECT 
                    pr.id, 
                    pr.child_id, 
                    c.first_name as child_first_name, 
                    c.last_name as child_last_name, 
                    pr.discipline_id, 
                    d.name as discipline_name, 
                    d.measurement_type, 
                    pr.training_id, 
                    pr.date, 
                    pr.value, 
                    pr.notes
                FROM progress pr
                JOIN children c ON pr.child_id = c.id
                JOIN disciplines d ON pr.discipline_id = d.id";
        
        $params = [];
        $types = "";

        if ($role === 'manager') {
            // Manager sees all, no filter needed
        } else if ($role === 'trainer') {
            // Trainers can only see progress for children in their branch
            $stmt_branch = $conn->prepare("SELECT branch_id FROM user_profiles WHERE user_id = ?");
            $stmt_branch->bind_param("i", $user_id);
            $stmt_branch->execute();
            $trainer_branch_id = $stmt_branch->get_result()->fetch_assoc()['branch_id'];
            $stmt_branch->close();

            $sql .= " WHERE c.branch_id = ?";
            $params[] = $trainer_branch_id;
            $types .= "i";
        } else if ($role === 'parent') {
            // Parents can only see progress for their own children
            $sql .= " WHERE c.parent_user_id = ?";
            $params[] = $user_id;
            $types .= "i";
        } else if ($role === 'child') {
            // Children can only see their own progress records
            // Assuming a direct link between user_id and child_id for child role
            $stmt_child_id = $conn->prepare("SELECT id FROM children WHERE user_id = ?");
            $stmt_child_id->bind_param("i", $user_id);
            $result_child_id = $stmt_child_id->get_result();
            $child_data = $result_child_id->fetch_assoc();
            $child_id = $child_data['id'] ?? null; // Use null coalescing operator to safely get 'id'
            $stmt_child_id->close();

            if ($child_id) {
                $sql .= " WHERE pr.child_id = ?";
                $params[] = $child_id;
                $types .= "i";
            } else {
                 // If a child user has no corresponding entry in the children table
                echo json_encode(['success' => true, 'progress' => []]); // Return empty array
                exit();
            }
        } else {
            // If the role is not one of the above, return an empty result as a fallback.
            echo json_encode(['success' => true, 'progress' => []]);
            exit();
        }

        $sql .= " ORDER BY pr.date DESC";

        $stmt = $conn->prepare($sql);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to execute query: ' . $conn->error]);
            exit();
        }
        $result = $stmt->get_result();
        $progress_records = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode(['success' => true, 'progress' => $progress_records]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $child_id = $data['child_id'] ?? null;
        $discipline_id = $data['discipline_id'] ?? null;
        $training_id = $data['training_id'] ?? null;
        $date = $data['date'] ?? null;
        $value = $data['value'] ?? null;
        $notes = $data['notes'] ?? null;

        if (!$child_id || !$discipline_id || !$training_id || !$date || $value === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Child ID, Discipline ID, Training ID, Date, and Value are required.']);
            exit();
        }

        $stmt = $conn->prepare("INSERT INTO progress (child_id, discipline_id, training_id, date, value, notes) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("iiisds", $child_id, $discipline_id, $training_id, $date, $value, $notes);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Progress record created successfully', 'id' => $conn->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to create progress record.']);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $child_id = $data['child_id'] ?? null;
        $discipline_id = $data['discipline_id'] ?? null;
        $date = $data['date'] ?? null;
        $value = $data['value'] ?? null;
        $notes = $data['notes'] ?? null;

        if (!$id || !$child_id || !$discipline_id || !$date || $value === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Progress ID, Child ID, Discipline ID, Date, and Value are required for update.']);
            exit();
        }

        $stmt = $conn->prepare("UPDATE progress SET child_id = ?, discipline_id = ?, date = ?, value = ?, notes = ? WHERE id = ?");
        $stmt->bind_param("iisdsi", $child_id, $discipline_id, $date, $value, $notes, $id);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Progress record updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update progress record.']);
        }
        break;

    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Progress ID is required.']);
            exit();
        }

        $stmt = $conn->prepare("DELETE FROM progress WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                http_response_code(204); // No Content
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Progress record not found.']);
            }
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete progress record.']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
        break;
}

?>