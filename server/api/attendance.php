<?php

header("Access-Control-Allow-Origin: http://localhost:9000");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();
require_once __DIR__ . '/../db.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    exit(json_encode(['success' => false, 'message' => 'Unauthorized']));
}

$method = $_SERVER['REQUEST_METHOD'];
$role = $_SESSION['role'];
$user_id = $_SESSION['user_id'];

switch ($method) {
    case 'GET':
        // Logic to view attendance records based on role
        // (Similar to other GET endpoints, can be implemented later)
        echo json_encode(['success' => true, 'message' => 'GET method for attendance to be implemented']);
        break;

    case 'POST':
        // Only trainers can mark attendance
        if ($role !== 'trainer') {
            http_response_code(403);
            exit(json_encode(['success' => false, 'message' => 'Forbidden']));
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $training_id = $data['trainingId'] ?? null;
        $child_id = $data['childId'] ?? null;
        $status = $data['status'] ?? 'present';

        if (!$training_id || !$child_id || $status !== 'present') {
            http_response_code(400);
            exit(json_encode(['success' => false, 'message' => 'Training ID, Child ID, and status must be 'present'']));
        }

        // --- TRANSACTION START ---
        $conn->begin_transaction();

        try {
            // 1. Find an active subscription for the child with remaining trainings
            $sub_stmt = $conn->prepare("SELECT id, trainings_remaining FROM subscriptions WHERE child_id = ? AND trainings_remaining > 0 AND (expiry_date IS NULL OR expiry_date >= CURDATE()) ORDER BY expiry_date ASC LIMIT 1");
            $sub_stmt->bind_param("i", $child_id);
            $sub_stmt->execute();
            $subscription = $sub_stmt->get_result()->fetch_assoc();
            $sub_stmt->close();

            if (!$subscription) {
                throw new Exception('No active subscription with remaining trainings found.');
            }

            // 2. Decrement trainings_remaining
            $update_stmt = $conn->prepare("UPDATE subscriptions SET trainings_remaining = trainings_remaining - 1 WHERE id = ?");
            $update_stmt->bind_param("i", $subscription['id']);
            $update_stmt->execute();
            $update_stmt->close();

            // 3. Insert attendance record
            $attend_stmt = $conn->prepare("INSERT INTO training_attendance (training_id, child_id, status) VALUES (?, ?, ?)");
            $attend_stmt->bind_param("iis", $training_id, $child_id, $status);
            $attend_stmt->execute();
            $attend_stmt->close();

            // If all queries were successful, commit the transaction
            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Attendance marked and training deducted successfully.']);

        } catch (Exception $e) {
            // If any query fails, roll back the transaction
            $conn->rollback();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to mark attendance: ' . $e->getMessage()]);
        }
        // --- TRANSACTION END ---
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
        break;
}

?>
