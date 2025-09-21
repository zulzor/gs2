<?php

// Set comprehensive error reporting
error_reporting(E_ALL);

// Prevent errors from being displayed in the output, which breaks JSON
ini_set('display_errors', 0);

// Log errors to the server's error log
ini_set('log_errors', 1);

// Set a custom error handler to catch all errors and format them as JSON
set_error_handler(function ($severity, $message, $file, $line) {
    // Don't respond to silenced errors
    if (error_reporting() === 0) {
        return false;
    }

    http_response_code(500);
    header('Content-Type: application/json'); // Ensure header is set
    echo json_encode([
        'success' => false,
        'error' => [
            'message' => $message,
            'file' => $file,
            'line' => $line,
            'severity' => $severity
        ]
    ]);
    exit(); // Stop script execution after a caught error
});

// Set a custom exception handler for uncaught exceptions
set_exception_handler(function ($exception) {
    http_response_code(500);
    header('Content-Type: application/json'); // Ensure header is set
    echo json_encode([
        'success' => false,
        'error' => [
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString()
        ]
    ]);
    exit();
});

?>