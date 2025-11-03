<?php

// --- Paramètres de connexion MySQL ---
$host = "localhost";
$db_name = "projet";
$username = "root";
$password = "";

// Connexion à la base de données
try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $exception) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur de connexion à la base de données: " . $exception->getMessage()]);
    exit();
}
