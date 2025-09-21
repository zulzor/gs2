<?php
$servername = "127.0.0.1";
$username = "user";
$password = "admin";
$dbname = "arsenal_db";
$port = 3306;

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname, $port);

// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

// Set charset
$conn->set_charset('utf8mb4');

$sql = file_get_contents(__DIR__ . '/init.sql');

if ($conn->multi_query($sql)) {
    echo "Database initialized successfully.";
    // Clear results from multi_query
    while ($conn->next_result()) {
        if ($result = $conn->store_result()) {
            $result->free();
        }
    }
} else {
    echo "Error initializing database: " . $conn->error;
}

$conn->close();
?>