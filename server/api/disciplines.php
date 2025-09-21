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

error_reporting(E_ALL);
ini_set('display_errors', 1);

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Unauthorized']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$role = $_SESSION['role'] ?? null;

// Authorization Check: Only managers can create, update, or delete disciplines.
if (in_array($method, ['POST', 'PUT', 'DELETE']) && $role !== 'manager') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden: Only managers can perform this action.']);
    exit();
}

switch ($method) {
    case 'GET':
        try {
            // Fetch all disciplines
            $sql = "SELECT * FROM disciplines";
            $result = $conn->query($sql);

            if ($result) {
                $disciplines = [];
                while ($row = $result->fetch_assoc()) {
                    $disciplines[] = $row;
                }
                echo json_encode(['success' => true, 'disciplines' => $disciplines]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to fetch disciplines', 'error' => $conn->error]);
            }
        } catch (mysqli_sql_exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
        }
        break;
    case 'POST':
        // Add a new discipline
        $data = json_decode(file_get_contents('php://input'), true);
        $name = $data['name'] ?? null;
        $measurement_type = $data['measurement_type'] ?? null;

        if (!$name || !$measurement_type) {
            http_response_code(400);
            echo json_encode(['message' => 'Name and measurement type are required.']);
            exit();
        }

        $stmt = $conn->prepare("INSERT INTO disciplines (name, measurement_type) VALUES (?, ?)");
        $stmt->bind_param("ss", $name, $measurement_type);

        if ($stmt->execute()) {
            echo json_encode(['message' => 'Discipline added successfully', 'id' => $conn->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to add discipline']);
        }
        $stmt->close();
        break;
    case 'PUT':
        // Update an existing discipline
        $data = json_decode(file_get_contents('php://input'), true);
        $name = $data['name'] ?? null;
        $measurement_type = $data['measurement_type'] ?? null;

        if (!$id || !$name || !$measurement_type) {
            http_response_code(400);
            echo json_encode(['message' => 'ID, name, and measurement type are required.']);
            exit();
        }

        $stmt = $conn->prepare("UPDATE disciplines SET name = ?, measurement_type = ? WHERE id = ?");
        $stmt->bind_param("ssi", $name, $measurement_type, $id);

        if ($stmt->execute()) {
            echo json_encode(['message' => 'Discipline updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update discipline']);
        }
        $stmt->close();
        break;
    case 'DELETE':
        // Delete a discipline
        if (!$id) {
            http_response_code(400);
            echo json_encode(['message' => 'Discipline ID is required.']);
            exit();
        }
        $stmt = $conn->prepare("DELETE FROM disciplines WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(['message' => 'Discipline deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete discipline']);
        }
        $stmt->close();
        break;
    default:
        http_response_code(405);
        echo json_encode(['message' => 'Method Not Allowed']);
        break;
}

?>