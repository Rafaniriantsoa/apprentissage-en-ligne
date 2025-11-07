<?php
// backend/api/etudiant/lireProfil.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS"); 
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Méthode non autorisée. Seul GET est accepté."]);
    exit();
}

require '../database.php'; 

if (empty($_GET['id_etudiant'])) {
    http_response_code(400); 
    echo json_encode(["success" => false, "message" => "L'ID de l'étudiant est requis."]);
    exit();
}

$id_etudiant = htmlspecialchars(strip_tags($_GET['id_etudiant']));

try {
    // Sélectionne uniquement les champs pertinents pour un étudiant (ignore specialite)
    $query = "SELECT id_utilisateur, nom_complet, email, photo, role
              FROM UTILISATEUR
              WHERE id_utilisateur = :id_etudiant
                AND role = 'etudiant' 
              LIMIT 0,1";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':id_etudiant', $id_etudiant, PDO::PARAM_INT);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Profil de l'étudiant récupéré avec succès.",
            // Utilise 'etudiant' comme clé pour la cohérence React
            "etudiant" => $row 
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Étudiant non trouvé."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erreur de base de données: " . $e->getMessage()]);
}
$conn = null;
?>