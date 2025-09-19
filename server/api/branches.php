<?php

// Check if user is authenticated
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$role = $_SESSION['role'] ?? null;
error_log("Branches: Request method " . $method . ", User ID: " . $_SESSION['user_id'] . ", Role: " . $role);

switch ($method) {
    case 'GET':
        // All authenticated users can view branches
        $sql = "SELECT * FROM branches";
        $result = $conn->query($sql);
        $branches = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode(['success' => true, 'branches' => $branches]);
        break;

    case 'POST':
        // Only managers can create branches
        if ($role !== 'manager') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden']);
            exit();
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $name = $data['name'] ?? '';
        $address = $data['address'] ?? '';

        if (!empty($name)) {
            $stmt = $conn->prepare("INSERT INTO branches (name, address) VALUES (?, ?)");
            $stmt->bind_param("ss", $name, $address);
            if ($stmt->execute()) {
                $new_branch_id = $conn->insert_id;
                echo json_encode(['success' => true, 'message' => 'Branch created', 'id' => $new_branch_id]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to create branch']);
            }
            $stmt->close();
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Name is required']);
        }
        break;

    case 'PUT':
        // Only managers can update branches
        if ($role !== 'manager' || !$id) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden or ID is missing']);
            exit();
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $name = $data['name'] ?? '';
        $address = $data['address'] ?? '';

        if (!empty($name)) {
            $stmt = $conn->prepare("UPDATE branches SET name = ?, address = ? WHERE id = ?");
            $stmt->bind_param("ssi", $name, $address, $id);
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Branch updated']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to update branch']);
            }
            $stmt->close();
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Name is required']);
        }
        break;

    case 'DELETE':
        // Only managers can delete branches
        if ($role !== 'manager' || !$id) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden or ID is missing']);
            exit();
        }

        $stmt = $conn->prepare("DELETE FROM branches WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Branch deleted']);
        } else {
            http_response_code(500);
            // Check for foreign key constraint violation
            if ($conn->errno == 1451) {
                 echo json_encode(['success' => false, 'message' => 'Cannot delete branch. It is being used by users, children, or trainings.']);
            } else {
                 echo json_encode(['success' => false, 'message' => 'Failed to delete branch']);
            }
        }
        $stmt->close();
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
        break;
}
