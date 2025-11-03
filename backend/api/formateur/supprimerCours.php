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

// --- Paramètres de connexion MySQL ---
require '../database.php';

// ===============================================
// 2. RÉCUPÉRATION ET VALIDATION DES DONNÉES (JSON)
// ===============================================

// Récupérer les données envoyées par React (JSON)
$data = json_decode(file_get_contents("php://input"));

$id_cours = $data->id_cours ?? null;
$id_formateur = $data->id_formateur ?? null;


if (empty($id_cours) || empty($id_formateur)) {
    http_response_code(400); // Bad Request
    echo json_encode(["message" => "Données incomplètes. L'ID du cours et l'ID du formateur sont requis."]);
    exit();
}

if (!filter_var($id_cours, FILTER_VALIDATE_INT) || !filter_var($id_formateur, FILTER_VALIDATE_INT)) {
    http_response_code(400); 
    echo json_encode(["message" => "ID(s) invalide(s)."]);
    exit();
}


// ===============================================
// 3. VÉRIFICATION D'APPARTENANCE ET SUPPRESSION DE LA PHOTO 🏞️
// ===============================================

// Vérifier que le cours existe et appartient bien à ce formateur
$query_check = "SELECT photo FROM cours WHERE id_cours = :id_cours AND id_formateur = :id_formateur LIMIT 0,1";
$stmt_check = $conn->prepare($query_check);
$stmt_check->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);
$stmt_check->bindParam(':id_formateur', $id_formateur, PDO::PARAM_INT);
$stmt_check->execute();

if ($stmt_check->rowCount() == 0) {
    http_response_code(401);
    echo json_encode(["message" => "Accès refusé. Ce cours n'existe pas ou ne vous appartient pas."]);
    exit();
}

$row = $stmt_check->fetch(PDO::FETCH_ASSOC);
$photo_path = $row['photo'];

// Supprimer la photo associée (si elle existe et n'est pas une image par défaut)
if (!empty($photo_path) ) {
    // Le chemin est relatif au dossier 'back', le script est dans 'api', donc on remonte d'un niveau
    $full_path = $photo_path; 
    if (file_exists($full_path) && is_file($full_path)) {
        unlink($full_path);
    }
}

// ===============================================
// 4. SUPPRESSION DU COURS ET DES DONNÉES ASSOCIÉES
// ===============================================

try {
    $conn->beginTransaction();

    // Suppression principale
    // NOTE: Pour que ceci supprime aussi les leçons et quiz associés, 
    // les clés étrangères dans les tables 'lecon' et 'quiz' DOIVENT avoir 
    // la clause ON DELETE CASCADE référençant 'cours'.
    $query_delete = "DELETE FROM cours WHERE id_cours = :id_cours";
    $stmt_delete = $conn->prepare($query_delete);
    $stmt_delete->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);

    if ($stmt_delete->execute()) {
        $conn->commit();
        http_response_code(200);
        echo json_encode(["message" => "Le cours a été supprimé avec succès."]);
    } else {
        $conn->rollBack();
        http_response_code(503);
        echo json_encode(["message" => "Impossible de supprimer le cours. Erreur BDD."]);
    }
} catch (PDOException $e) {
    $conn->rollBack();
    http_response_code(500);
    echo json_encode(["message" => "Erreur de base de données lors de la suppression du cours: " . $e->getMessage()]);
}
?>