<?php
// server/.router.php

// Если запрос к статическому файлу (css, js, jpg), отдаем его как есть
if (is_file($_SERVER["DOCUMENT_ROOT"] . $_SERVER["REQUEST_URI"])) {
    return false;
}

// Все остальные запросы перенаправляем на index.php
$_SERVER["SCRIPT_NAME"] = "/index.php";
require_once __DIR__ . '/index.php';
