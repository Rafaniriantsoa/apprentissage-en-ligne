<?php
// inscrireEtudiant.php

// ===================================================
// 1. CONFIGURATION DE L'API
// ===================================================

header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS"); 
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); 
    exit(); 
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Méthode non autorisée. Seul POST est accepté."]);
    exit();
}

require '../database.php'; 

// Lecture des données POST (JSON)
$data = json_decode(file_get_contents("php://input"));

if (empty($data->id_utilisateur) || empty($data->id_cours)) {
    http_response_code(400); 
    echo json_encode(["success" => false, "message" => "ID utilisateur et ID cours sont requis."]);
    exit();
}

$id_utilisateur = htmlspecialchars(strip_tags($data->id_utilisateur));
$id_cours = htmlspecialchars(strip_tags($data->id_cours));

// ===============================================
// 2. INSCRIPTION À LA TABLE 'inscription'
// ===============================================

// ON DUPLICATE KEY UPDATE permet de ne pas échouer si la contrainte UNIQUE (id_utilisateur, id_cours) existe déjà.
// Assurez-vous d'avoir une clé unique composite sur (id_utilisateur, id_cours) dans la table INSCRIPTION.
$query = "INSERT INTO INSCRIPTION (id_utilisateur, id_cours, statut) 
          VALUES (:id_utilisateur, :id_cours, 'En cours') 
          ON DUPLICATE KEY UPDATE date_inscription=date_inscription"; 

$stmt = $conn->prepare($query);
$stmt->bindParam(':id_utilisateur', $id_utilisateur, PDO::PARAM_INT);
$stmt->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);

try {
    $stmt->execute();
    
    // Si l'insertion a réussi (nouvelle ligne) ou qu'elle a simplement mis à jour
    if ($stmt->rowCount() >= 0) {
        // rowCount() peut retourner 1 pour un nouvel insert, ou 2 pour un update (si ON DUPLICATE KEY UPDATE est exécuté)
        http_response_code(201); 
        echo json_encode(["success" => true, "message" => "Inscription au cours réussie."]);
    } else {
         http_response_code(500);
         echo json_encode(["success" => false, "message" => "Une erreur inattendue est survenue lors de l'inscription."]);
    }
} catch (PDOException $e) {
    http_response_code(500); 
    echo json_encode(["success" => false, "message" => "Erreur de base de données: " . $e->getMessage()]);
}
?>