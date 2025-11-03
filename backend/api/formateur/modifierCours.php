<?php
// Fichier: backend/api/formateur/modifierCours.php (selon votre structure)

// ===================================================
// 1. CONFIGURATION ET CHEMINS CLÉS
// ===================================================

header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); 
    exit(); 
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Méthode non supportée. Seul POST est accepté."]);
    exit();
}

// Assurez-vous que ce chemin est correct pour la connexion DB
require '../database.php'; // Modifiez si le chemin vers database.php n'est pas '../database.php'

// Chemin RELATIF utilisé pour l'enregistrement en BDD et l'URL d'accès
// Il doit correspondre à 'uploads/cours/'
$UPLOAD_DIR_BDD = 'uploads/cours/'; 

// Chemin ABSOLU pour les opérations sur le système de fichiers (move_uploaded_file, unlink)
// __DIR__ est le chemin de 'backend/api/formateur'
$UPLOAD_DIR_ABSOLU = __DIR__ . DIRECTORY_SEPARATOR . $UPLOAD_DIR_BDD;


// ===============================================
// 2. RÉCUPÉRATION ET VALIDATION DES DONNÉES
// ===============================================

$id_cours = $_POST['id_cours'] ?? null;
$id_formateur = $_POST['id_formateur'] ?? null;
$titre = $_POST['titre'] ?? null;
$description = $_POST['description'] ?? null;

if (empty($id_cours) || empty($id_formateur) || empty($titre) || empty($description)) {
    http_response_code(400); 
    echo json_encode(["message" => "Veuillez fournir l'ID du cours, l'ID du formateur, le titre et la description."]);
    exit();
}

$titre = htmlspecialchars(strip_tags(trim($titre)));
$description = htmlspecialchars(strip_tags(trim($description)));

// ===============================================
// 3. VÉRIFICATION DE L'AUTORISATION
// ===============================================

$check_query = "SELECT photo FROM COURS WHERE id_cours = :id_cours AND id_formateur = :id_formateur LIMIT 1";
$check_stmt = $conn->prepare($check_query);
$check_stmt->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);
$check_stmt->bindParam(':id_formateur', $id_formateur, PDO::PARAM_INT);

try {
    $check_stmt->execute();
    if ($check_stmt->rowCount() == 0) {
        http_response_code(403);
        echo json_encode(["message" => "Vous n'êtes pas autorisé à modifier ce cours."]);
        exit();
    }
    $row = $check_stmt->fetch(PDO::FETCH_ASSOC);
    $old_photo_path_bdd = $row['photo']; // Chemin stocké en BDD (ex: 'uploads/cours/...')

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur de base de données lors de la vérification: " . $e->getMessage()]);
    exit();
}

// ===============================================
// 4. GESTION DE LA PHOTO (Upload si nouvelle photo)
// ===============================================

$new_photo_path_bdd = $old_photo_path_bdd; // Par défaut, on garde l'ancienne photo

if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
    
    // 1. Création du dossier d'upload (utilise le chemin ABSOLU)
    if (!is_dir($UPLOAD_DIR_ABSOLU)) {
        if (!mkdir($UPLOAD_DIR_ABSOLU, 0777, true)) {
            http_response_code(500);
            echo json_encode(["message" => "Erreur serveur : Impossible de créer le dossier d'upload. Vérifiez les permissions (777)."]);
            exit();
        }
    }
    
    // 2. Vérification des extensions
    $file_info = pathinfo($_FILES['photo']['name']);
    $file_extension = strtolower($file_info['extension']);
    $allowed_extensions = ['jpg', 'jpeg', 'png', 'gif'];

    if (in_array($file_extension, $allowed_extensions)) {
        // 3. Création du chemin de destination
        $file_name = time() . "-" . $id_formateur . "." . $file_extension;
        // La destination pour move_uploaded_file DOIT être ABSOLUE
        $destination_ABSOLUE = $UPLOAD_DIR_ABSOLU . $file_name;

        // 4. Déplacement du fichier
        if (move_uploaded_file($_FILES['photo']['tmp_name'], $destination_ABSOLUE)) {
            
            // Le chemin BDD est le chemin RELATIF
            $new_photo_path_bdd = $UPLOAD_DIR_BDD . $file_name;
            
            // 5. Suppression de l'ancienne photo (utilise le chemin ABSOLU)
            if (!empty($old_photo_path_bdd) && $old_photo_path_bdd != $new_photo_path_bdd) {
                
                // Reconstruit le chemin absolu de l'ancien fichier
                $old_file_path_ABSOLU = __DIR__ . DIRECTORY_SEPARATOR . $old_photo_path_bdd;
                
                if (file_exists($old_file_path_ABSOLU)) {
                    @unlink($old_file_path_ABSOLU); 
                }
            }
        } else {
             // Vérifiez les erreurs ici (ex: taille max dépassée ou permissions)
             http_response_code(500);
             echo json_encode(["message" => "Erreur lors du déplacement du fichier. Code d'erreur: " . $_FILES['photo']['error']]);
             exit();
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Type de fichier non autorisé. Seuls JPG, PNG, GIF sont acceptés."]);
        exit();
    }
} 

// ===============================================
// 5. MISE À JOUR DU COURS DANS LA BDD
// ===============================================

$update_query = "UPDATE COURS SET titre = :titre, description = :description, photo = :photo 
                 WHERE id_cours = :id_cours";

$update_stmt = $conn->prepare($update_query);

$update_stmt->bindParam(':titre', $titre);
$update_stmt->bindParam(':description', $description);
$update_stmt->bindParam(':photo', $new_photo_path_bdd); // Utilisation du chemin BDD
$update_stmt->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);

try {
    if ($update_stmt->execute()) {
        http_response_code(200);
        // Retourne le chemin BDD (relatif) pour l'affichage React
        echo json_encode(["message" => "Le cours a été modifié avec succès.", "photo_path" => $new_photo_path_bdd]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Impossible de modifier le cours."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur de base de données lors de la modification: " . $e->getMessage()]);
}
?>