<?php
session_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once __DIR__ . '/../db.php';

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
$role = $_SESSION['role'];
$user_id = $_SESSION['user_id'];

switch ($method) {
    case 'GET':
        // Base query to get subscription details
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
        if ($role !== 'manager') {
            http_response_code(403);
            exit(json_encode(['success' => false, 'message' => 'Forbidden']));
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        // Basic validation
        if (empty($data['childId']) || empty($data['trainingsTotal']) || empty($data['purchaseDate'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Child ID, total trainings, and purchase date are required.']);
            exit();
        }

        $child_id = $data['childId'];
        $trainings_total = $data['trainingsTotal'];
        $trainings_remaining = $data['trainingsTotal']; // Initially, remaining is same as total
        $purchase_date = $data['purchaseDate'];
        $expiry_date = $data['expiryDate'] ?? null;
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

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
        break;
}

$conn->close();
