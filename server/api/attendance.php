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
        $training_id = $_GET['training_id'] ?? null;
        $parent_user_id = $_GET['parent_user_id'] ?? null;

        if ($training_id) {
            // Logic to get attendees for a specific training (for trainers)
            $stmt_branch = $conn->prepare("SELECT branch_id FROM trainings WHERE id = ?");
            $stmt_branch->bind_param("i", $training_id);
            $stmt_branch->execute();
            $branch_id = $stmt_branch->get_result()->fetch_assoc()['branch_id'];
            $stmt_branch->close();

            if (!$branch_id) {
                http_response_code(404);
                exit(json_encode(['success' => false, 'message' => 'Training not found.']));
            }

            $sql = "SELECT c.id as child_id, CONCAT(c.first_name, ' ', c.last_name) as child_name, ta.status 
                    FROM children c
                    JOIN child_branch_assignments cba ON c.id = cba.child_id
                    LEFT JOIN training_attendance ta ON c.id = ta.child_id AND ta.training_id = ?
                    WHERE cba.branch_id = ?";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $training_id, $branch_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $attendees = $result->fetch_all(MYSQLI_ASSOC);
            $stmt->close();

            $formatted_attendees = array_map(function($attendee) {
                return [
                    'child_id' => $attendee['child_id'],
                    'child_name' => $attendee['child_name'],
                    'status' => $attendee['status'] ?? 'absent'
                ];
            }, $attendees);
            echo json_encode(['success' => true, 'attendees' => $formatted_attendees]);

        } else if ($parent_user_id) {
            // Logic to get all attendance records for a parent's children
            if ($parent_user_id != $user_id && $role !== 'manager') {
                http_response_code(403);
                exit(json_encode(['success' => false, 'message' => 'Forbidden']));
            }

            $sql = "SELECT 
                        ta.training_id, 
                        ta.child_id, 
                        ta.status,
                        t.title as training_title,
                        t.start_time,
                        c.first_name as child_first_name,
                        c.last_name as child_last_name
                    FROM training_attendance ta
                    JOIN children c ON ta.child_id = c.id
                    JOIN trainings t ON ta.training_id = t.id
                    WHERE c.parent_user_id = ?
                    ORDER BY t.start_time DESC";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $parent_user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $attendance_history = $result->fetch_all(MYSQLI_ASSOC);
            $stmt->close();

            echo json_encode(['success' => true, 'history' => $attendance_history]);

        } else {
            http_response_code(400);
            exit(json_encode(['success' => false, 'message' => 'Training ID or Parent User ID is required.']));
        }
        break;

    case 'POST':
        $training_id = $_GET['training_id'] ?? null;
        if (!$training_id) {
            http_response_code(400);
            exit(json_encode(['success' => false, 'message' => 'Training ID is required.']));
        }

        $data = json_decode(file_get_contents('php://input'), true);

        // PARENT ENROLLMENT LOGIC
        if ($role === 'parent') {
            $child_id = $data['child_id'] ?? null;
            if (!$child_id) {
                http_response_code(400);
                exit(json_encode(['success' => false, 'message' => 'Child ID is required.']));
            }

            // Check if child belongs to the parent
            $stmt_check = $conn->prepare("SELECT id FROM children WHERE id = ? AND parent_user_id = ?");
            $stmt_check->bind_param("ii", $child_id, $user_id);
            $stmt_check->execute();
            if ($stmt_check->get_result()->num_rows === 0) {
                http_response_code(403);
                exit(json_encode(['success' => false, 'message' => 'This child does not belong to you.']));
            }
            $stmt_check->close();

            // Insert with 'enrolled' status, ON DUPLICATE KEY UPDATE does nothing if already exists
            $stmt_enroll = $conn->prepare("INSERT INTO training_attendance (training_id, child_id, status) VALUES (?, ?, 'enrolled') ON DUPLICATE KEY UPDATE status = status");
            $stmt_enroll->bind_param("ii", $training_id, $child_id);
            
            if ($stmt_enroll->execute()) {
                echo json_encode(['success' => true, 'message' => 'Ребенок успешно записан на тренировку!']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Не удалось записать ребенка на тренировку.']);
            }
            $stmt_enroll->close();
            exit();
        }

        // TRAINER/MANAGER ATTENDANCE MARKING LOGIC
        if ($role === 'trainer' || $role === 'manager') {
            $attendees_data = $data['attendees'] ?? [];

            $conn->begin_transaction();
            try {
                foreach ($attendees_data as $attendee) {
                    $child_id = $attendee['child_id'];
                    $status = $attendee['status'];

                    // Check if attendance record already exists
                    $stmt_check = $conn->prepare("SELECT id, status FROM training_attendance WHERE training_id = ? AND child_id = ?");
                    $stmt_check->bind_param("ii", $training_id, $child_id);
                    $stmt_check->execute();
                    $existing_attendance = $stmt_check->get_result()->fetch_assoc();
                    $stmt_check->close();

                    $was_present = $existing_attendance && $existing_attendance['status'] === 'present';
                    $is_present = $status === 'present';

                    // Only deduct from subscription if status changes to 'present'
                    if ($is_present && !$was_present) {
                        $sub_stmt = $conn->prepare("SELECT id FROM subscriptions WHERE child_id = ? AND trainings_remaining > 0 AND (expiry_date IS NULL OR expiry_date >= CURDATE()) ORDER BY purchase_date ASC LIMIT 1");
                        $sub_stmt->bind_param("i", $child_id);
                        $sub_stmt->execute();
                        $subscription = $sub_stmt->get_result()->fetch_assoc();
                        $sub_stmt->close();

                        if (!$subscription) {
                            throw new Exception("У ребенка с ID {$child_id} нет активного абонемента.");
                        }

                        $update_stmt = $conn->prepare("UPDATE subscriptions SET trainings_remaining = trainings_remaining - 1 WHERE id = ?");
                        $update_stmt->bind_param("i", $subscription['id']);
                        $update_stmt->execute();
                        $update_stmt->close();
                    }

                    // Insert or update attendance record
                    $stmt_upsert = $conn->prepare("INSERT INTO training_attendance (training_id, child_id, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status)");
                    $stmt_upsert->bind_param("iis", $training_id, $child_id, $status);
                    $stmt_upsert->execute();
                    $stmt_upsert->close();
                }

                $conn->commit();
                echo json_encode(['success' => true, 'message' => 'Посещаемость успешно сохранена!']);

            } catch (Exception $e) {
                $conn->rollback();
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Ошибка: ' . $e->getMessage()]);
            }
            exit();
        }
        
        // If role is not parent, trainer, or manager
        http_response_code(403);
        exit(json_encode(['success' => false, 'message' => 'Forbidden']));
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
        break;
}

?>
