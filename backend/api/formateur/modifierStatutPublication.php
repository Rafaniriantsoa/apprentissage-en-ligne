<?php
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

// ===============================================
// 2. RÉCUPÉRATION ET VALIDATION DES PARAMÈTRES
// ===============================================

$data = json_decode(file_get_contents("php://input"));

if (empty($data->id_cours) || !isset($data->nouvel_etat)) {
    http_response_code(400); 
    echo json_encode(["message" => "Données incomplètes. ID cours et nouvel état sont requis."]);
    exit();
}

$id_cours = filter_var($data->id_cours, FILTER_VALIDATE_INT);
$nouvel_etat = filter_var($data->nouvel_etat, FILTER_VALIDATE_INT, array('options' => array('min_range' => 0, 'max_range' => 1)));


if ($id_cours === false || $nouvel_etat === false) {
    http_response_code(400); 
    echo json_encode(["message" => "ID cours ou nouvel état invalide."]);
    exit();
}

// ===============================================
// 3. MISE À JOUR DU STATUT
// ===============================================

try {
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $query = "UPDATE cours SET est_publie = :nouvel_etat WHERE id_cours = :id_cours";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':nouvel_etat', $nouvel_etat, PDO::PARAM_INT);
    $stmt->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);

    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $action = $nouvel_etat == 1 ? "publié" : "annulé la publication de";
        http_response_code(200);
        echo json_encode(["message" => "Statut de publication du cours $action avec succès.", "est_publie" => $nouvel_etat]);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Cours non trouvé ou statut déjà défini."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur de base de données : " . $e->getMessage()]);
}
?>