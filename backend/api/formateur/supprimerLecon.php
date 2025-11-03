<?php
// Headers CORS
header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require '../database.php';
$id_lecon = filter_input(INPUT_POST, 'id_lecon', FILTER_VALIDATE_INT);
$id_formateur_client = filter_input(INPUT_POST, 'id_formateur', FILTER_VALIDATE_INT);

if (!$id_lecon || !$id_formateur_client) {
    http_response_code(400); echo json_encode(["message" => "ID de leçon ou de formateur manquant."]); exit();
}

// Vérification de l'existence et de l'autorisation + récupération du chemin du fichier
$check_query = "SELECT id_formateur, contenu FROM LECON WHERE id_lecon = :id_lecon LIMIT 1";
$stmt_check = $conn->prepare($check_query);
$stmt_check->bindParam(':id_lecon', $id_lecon);
$stmt_check->execute();
$lecon_existante = $stmt_check->fetch(PDO::FETCH_ASSOC);

if (!$lecon_existante || intval($lecon_existante['id_formateur']) !== $id_formateur_client) {
    http_response_code(403); echo json_encode(["message" => "Action non autorisée ou Leçon non trouvée."]); exit();
}

// Suppression du fichier physique
$chemin_fichier = $lecon_existante['contenu'];
if (!empty($chemin_fichier) && file_exists($chemin_fichier)) {
    unlink($chemin_fichier);
}

// Suppression dans la BDD
$delete_query = "DELETE FROM LECON WHERE id_lecon = :id_lecon";
$stmt_delete = $conn->prepare($delete_query);
$stmt_delete->bindParam(':id_lecon', $id_lecon);

try {
    $stmt_delete->execute();
    http_response_code(200);
    echo json_encode(["message" => "Leçon et fichier associé supprimés avec succès."]);
} catch (PDOException $e) {
    http_response_code(500); echo json_encode(["message" => "Erreur BDD lors de la suppression : " . $e->getMessage()]);
}
?>