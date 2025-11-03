<?php
// back/api/detailCours.php

// Configuration des headers
header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS"); // Ajoutez toutes les méthodes utilisées
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Gérer les requêtes OPTIONS (pré-vol) qui sont faites par le navigateur
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); 
    exit(); 
}
// Connexion BDD (à insérer ici)
require '../database.php';


if (empty($_GET['id_cours'])) {
    http_response_code(400); echo json_encode(["message" => "Veuillez fournir l'ID du cours."]); exit();
}

$id_cours = filter_var($_GET['id_cours'], FILTER_VALIDATE_INT);

$query = "SELECT *
          FROM COURS
          WHERE id_cours = :id_cours
          LIMIT 0,1";

$stmt = $conn->prepare($query);
$stmt->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);

try {
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $cours_detail = [
            "id_cours" => $row['id_cours'],
            "id_formateur" => $row['id_formateur'], 
            "titre" => $row['titre'],
            "description" => $row['description'],
            "photo" => $row['photo'],
            "dateCreation" => $row['date_creation']
        ];
        
        http_response_code(200);
        echo json_encode($cours_detail);
        
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Cours non trouvé."]);
    }

} catch (PDOException $e) {
    http_response_code(500); echo json_encode(["message" => "Erreur BDD: " . $e->getMessage()]);
}
?>