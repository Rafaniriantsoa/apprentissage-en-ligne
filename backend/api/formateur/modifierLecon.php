<?php
// Headers CORS
header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS"); 
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require '../database.php';

$upload_dir = 'uploads/lecons/';

// Données du formulaire
$id_lecon = filter_input(INPUT_POST, 'id_lecon', FILTER_VALIDATE_INT);
$id_formateur_client = filter_input(INPUT_POST, 'id_formateur', FILTER_VALIDATE_INT);
$titre = filter_input(INPUT_POST, 'titre', FILTER_SANITIZE_STRING);
$ordre = filter_input(INPUT_POST, 'ordre', FILTER_VALIDATE_INT);

if (!$id_lecon || !$id_formateur_client || !$titre || !$ordre) {
    http_response_code(400); echo json_encode(["message" => "Données de formulaire incomplètes ou invalides."]); exit();
}

// Vérification de l'existence et de l'autorisation
$check_query = "SELECT id_formateur, contenu FROM LECON WHERE id_lecon = :id_lecon LIMIT 1";
$stmt_check = $conn->prepare($check_query);
$stmt_check->bindParam(':id_lecon', $id_lecon);
$stmt_check->execute();
$lecon_existante = $stmt_check->fetch(PDO::FETCH_ASSOC);

if (!$lecon_existante || intval($lecon_existante['id_formateur']) !== $id_formateur_client) {
    http_response_code(403); echo json_encode(["message" => "Action non autorisée ou Leçon non trouvée."]); exit();
}

$nouveau_contenu_path = $lecon_existante['contenu']; 

// Gestion de l'upload du nouveau fichier
if (isset($_FILES['fichier']) && $_FILES['fichier']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['fichier'];
    $filename = basename($file['name']);
    $unique_filename = time() . '_' . $filename;
    $target_file = $upload_dir . $unique_filename;
    
    if (!is_dir($upload_dir)) { mkdir($upload_dir, 0777, true); }

    if (move_uploaded_file($file['tmp_name'], $target_file)) {
        $nouveau_contenu_path = $target_file; 
        
        // Suppression de l'ancien fichier
        $ancien_chemin = $lecon_existante['contenu'];
        if (!empty($ancien_chemin) && file_exists($ancien_chemin)) { 
            unlink($ancien_chemin); 
        }
    } else {
        http_response_code(500); echo json_encode(["message" => "Erreur lors du déplacement du nouveau fichier."]); exit();
    }
}

// Mise à jour de la leçon dans la BDD
$update_query = "UPDATE LECON SET titre_lecon = :titre, ordre = :ordre, contenu = :contenu WHERE id_lecon = :id_lecon";
$stmt_update = $conn->prepare($update_query);
$stmt_update->bindParam(':titre', $titre);
$stmt_update->bindParam(':ordre', $ordre);
$stmt_update->bindParam(':contenu', $nouveau_contenu_path); 
$stmt_update->bindParam(':id_lecon', $id_lecon);

try {
    $stmt_update->execute();
    http_response_code(200);
    echo json_encode(["message" => "Leçon modifiée avec succès."]);
} catch (PDOException $e) {
    http_response_code(500); echo json_encode(["message" => "Erreur BDD lors de la modification : " . $e->getMessage()]);
}
?>