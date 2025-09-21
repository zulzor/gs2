<?php
// server/.router.php

// Get the requested URI path, ignoring query strings
$request_path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Define the API prefix
$api_prefix = '/api/';

// Check if the request is for our API
if (strpos($request_path, $api_prefix) === 0) {
    // Get the path part after /api/
    $api_path = substr($request_path, strlen($api_prefix));

    // Prevent directory traversal
    if (strpos($api_path, '..') !== false) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid API path']);
        exit;
    }

    // Explode the path to find resource and potential ID
    $path_parts = explode('/', rtrim($api_path, '/'));
    $resource = $path_parts[0];
    
    // The ID is the second part of the path, if it exists and is numeric
    $id = null;
    if (isset($path_parts[1]) && is_numeric($path_parts[1])) {
        $id = (int)$path_parts[1];
    }

    // Build the path to the corresponding PHP file
    $file_path = __DIR__ . '/api/' . $resource . '.php';

    if (file_exists($file_path)) {
        // The ID is now available to the included script via the $id variable
        require_once $file_path;
    } else {
        // The requested API endpoint file does not exist
        http_response_code(404);
        echo json_encode(['error' => 'API endpoint not found: ' . $resource]);
    }
    exit;
}

// For non-API requests, let the PHP built-in server handle them.
return false;