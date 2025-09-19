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
$user_id = $_SESSION['user_id'];

// Only managers can create, update, or delete subscriptions
if (in_array($method, ['POST', 'PUT', 'DELETE']) && $role !== 'manager') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit();
}

switch ($method) {
    case 'GET':
        $sql = "SELECT s.id, s.child_id, CONCAT(c.first_name, ' ', c.last_name) as child_name, s.trainings_total, s.trainings_remaining, s.purchase_date, s.expiry_date 
                FROM subscriptions s
                JOIN children c ON s.child_id = c.id";

        if ($role === 'parent') {
            $sql .= " WHERE c.parent_user_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $user_id);
        } else if ($role === 'trainer') {
            $profile_stmt = $conn->prepare("SELECT branch_id FROM user_profiles WHERE user_id = ?");
            $profile_stmt->bind_param("i", $user_id);
            $profile_stmt->execute();
            $branch_id = $profile_stmt->get_result()->fetch_assoc()['branch_id'];
            $sql .= " WHERE c.branch_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $branch_id);
        } else { // Manager gets all
            $stmt = $conn->prepare($sql);
        }

        $stmt->execute();
        $result = $stmt->get_result();
        $subscriptions = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode(['success' => true, 'subscriptions' => $subscriptions]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['child_id']) || !isset($data['trainings_total']) || empty($data['purchase_date'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Child ID, total trainings, and purchase date are required.']);
            exit();
        }

        $child_id = $data['child_id'];
        $trainings_total = $data['trainings_total'];
        $trainings_remaining = $data['trainings_total']; // Initially, remaining is same as total
        $purchase_date = $data['purchase_date'];
        $expiry_date = $data['expiry_date'] ?? null;
        $manager_id = $_SESSION['user_id'];

        $stmt = $conn->prepare("INSERT INTO subscriptions (child_id, manager_id, trainings_total, trainings_remaining, purchase_date, expiry_date) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("iiiiss", $child_id, $manager_id, $trainings_total, $trainings_remaining, $purchase_date, $expiry_date);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Subscription created successfully', 'id' => $conn->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to create subscription']);
        }
        break;

    case 'PUT':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Subscription ID is required.']);
            exit();
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['trainings_total']) || !isset($data['trainings_remaining']) || empty($data['purchase_date'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Total trainings, remaining trainings, and purchase date are required.']);
            exit();
        }

        $trainings_total = $data['trainings_total'];
        $trainings_remaining = $data['trainings_remaining'];
        $purchase_date = $data['purchase_date'];
        $expiry_date = $data['expiry_date'] ?? null;

        $stmt = $conn->prepare("UPDATE subscriptions SET trainings_total = ?, trainings_remaining = ?, purchase_date = ?, expiry_date = ? WHERE id = ?");
        $stmt->bind_param("iissi", $trainings_total, $trainings_remaining, $purchase_date, $expiry_date, $id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Subscription updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update subscription']);
        }
        break;

    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Subscription ID is required.']);
            exit();
        }

        $stmt = $conn->prepare("DELETE FROM subscriptions WHERE id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                http_response_code(204); // No Content
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Subscription not found.']);
            }
        }
        else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete subscription.']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
        break;
}

?>