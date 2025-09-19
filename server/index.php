<?php
session_start();

require_once __DIR__ . '/db.php'; // db.php is in the parent directory of /api
global $conn; // Make $conn explicitly global after db.php is included

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove /api/ from the beginning of the URI
$request = preg_replace('/^\/api\//', '', $requestUri);
// Remove query string
$request = strtok($request, '?');
// Remove .php extension
$request = str_replace('.php', '', $request);

$requestParts = explode('/', $request);
$resource = $requestParts[0];
$id = $requestParts[1] ?? $_GET['id'] ?? null; // Get id from path or query parameters

$apiDir = __DIR__ . '/api/';

switch ($resource) {
    case 'auth':
        require_once $apiDir . 'auth.php';
        break;
    case 'users':
        require_once $apiDir . 'users.php';
        break;
    case 'families':
        require_once $apiDir . 'families.php';
        break;
    case 'children':
        require_once $apiDir . 'children.php';
        break;
    case 'branches':
        require_once $apiDir . 'branches.php';
        break;
    case 'trainers':
        require_once $apiDir . 'trainers.php';
        break;
    case 'trainings':
        require_once $apiDir . 'trainings.php';
        break;
    case 'parents':
        require_once $apiDir . 'parents.php';
        break;
    case 'progress':
        require_once $apiDir . 'progress.php';
        break;
    case 'attendance':
        require_once $apiDir . 'attendance.php';
        break;
    case 'subscriptions':
        require_once $apiDir . 'subscriptions.php';
        break;
    case 'disciplines':
        require_once $apiDir . 'disciplines.php';
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Resource not found']);
        break;
}

$conn->close();
?>