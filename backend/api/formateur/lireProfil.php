<?php
// backend/api/formateur/lireProfil.php

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

// NOTE IMPORTANTE : Le chemin est relatif à lireProfil.php
require '../database.php'; 

if (empty($_GET['id_formateur'])) {
    http_response_code(400); 
    echo json_encode(["success" => false, "message" => "L'ID du formateur est requis."]);
    exit();
}

$id_formateur = htmlspecialchars(strip_tags($_GET['id_formateur']));

try {
    // Requête pour récupérer toutes les informations de l'utilisateur (incluant photo et specialite)
    $query = "SELECT id_utilisateur, nom_complet, email, photo, role, specialite
              FROM UTILISATEUR
              WHERE id_utilisateur = :id_formateur
                AND role = 'formateur' 
              LIMIT 0,1";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':id_formateur', $id_formateur, PDO::PARAM_INT);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Profil du formateur récupéré avec succès.",
            "formateur" => $row
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Formateur non trouvé."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erreur de base de données: " . $e->getMessage()]);
}
$conn = null;
?>