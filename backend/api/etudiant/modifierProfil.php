<?php
// backend/api/etudiant/modifierProfil.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Méthode non autorisée. Seul POST est accepté."]);
    exit();
}

require '../database.php';

// Les données sont dans $_POST
$id_etudiant = $_POST['id_etudiant'] ?? null;
$nom_complet = $_POST['nom_complet'] ?? null;
$email = $_POST['email'] ?? null;
$mot_de_passe = $_POST['mot_de_passe'] ?? null;

// Le champ 'specialite' est ignoré pour les étudiants

// ===============================================
// GESTION DU FICHIER IMAGE (Nommage unique + Suppression ancienne)
// ===============================================
$photo_filename = null; 
$old_photo_path_physical = null; 

$upload_dir_physical = '../visiteur/uploads/photos/'; 
$upload_dir_logical = 'uploads/photos/'; 

$photo_file = $_FILES['photo_file'] ?? null;

if ($photo_file && $photo_file['error'] === UPLOAD_ERR_OK) {
    
    // 1. Récupérer l'ancienne photo pour la suppression
    if ($id_etudiant) {
        $stmt_old = $conn->prepare("SELECT photo FROM UTILISATEUR WHERE id_utilisateur = :id_etudiant");
        $stmt_old->bindParam(':id_etudiant', $id_etudiant);
        $stmt_old->execute();
        $current_photo_logical = $stmt_old->fetchColumn();

        if ($current_photo_logical) {
            $old_photo_path_physical = '../visiteur/' . $current_photo_logical; 
        }
    }
    
    // 2. Vérification/Création du dossier
    if (!is_dir($upload_dir_physical)) {
        if (!mkdir($upload_dir_physical, 0777, true)) {
             http_response_code(500);
             echo json_encode(["success" => false, "message" => "Erreur serveur: Le dossier de destination n'existe pas et ne peut être créé."]);
             exit();
        }
    }
    
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($photo_file['type'], $allowed_types)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Type de fichier non autorisé. Seulement JPG, PNG, GIF."]);
        exit();
    }

    // Nom de fichier unique basé sur uniqid() et md5(email)
    $extension = pathinfo($photo_file['name'], PATHINFO_EXTENSION);
    $file_name_unique = uniqid() . '-' . md5($email) . '.' . strtolower($extension);
    
    $photo_filename = $upload_dir_logical . $file_name_unique;
    $target_file = $upload_dir_physical . $file_name_unique;
    
    // 3. Tentative de déplacement du fichier
    if (!move_uploaded_file($photo_file['tmp_name'], $target_file)) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Erreur lors de l'enregistrement de l'image sur le serveur. Vérifiez les permissions du dossier: " . $upload_dir_physical]);
        exit();
    }
}

// ===============================================
// VALIDATION DES DONNÉES MINIMALES
// ===============================================

if (empty($id_etudiant) || empty($nom_complet) || empty($email)) {
    http_response_code(400); 
    echo json_encode(["success" => false, "message" => "Données incomplètes (ID, nom et email sont requis)."]);
    exit();
}

try {
    $sql_parts = [
        "nom_complet = :nom_complet", 
        "email = :email"
        // 'specialite' est ignoré
    ];
    $params = [
        ':id_etudiant' => $id_etudiant,
        ':nom_complet' => $nom_complet,
        ':email' => $email
    ];

    // Ajout du nom du fichier de PHOTO si un upload a eu lieu
    if ($photo_filename !== null) {
        $sql_parts[] = "photo = :photo";
        $params[':photo'] = $photo_filename;
    }
    
    // Ajout du MOT DE PASSE si fourni
    if (!empty($mot_de_passe)) {
        $mot_de_passe_hache = password_hash($mot_de_passe, PASSWORD_DEFAULT);
        $sql_parts[] = "mot_de_passe = :mot_de_passe";
        $params[':mot_de_passe'] = $mot_de_passe_hache;
    }

    $query = "UPDATE UTILISATEUR 
              SET " . implode(', ', $sql_parts) . "
              WHERE id_utilisateur = :id_etudiant";

    $stmt = $conn->prepare($query);

    // Bind des paramètres
    foreach ($params as $key => &$value) {
        $stmt->bindParam($key, $value);
    }
    
    if ($stmt->execute()) {
        
        // 4. Suppression de l'ancienne photo après succès de la DB
        if ($photo_filename !== null && $old_photo_path_physical && is_file($old_photo_path_physical)) {
             if (basename($old_photo_path_physical) !== basename($photo_filename)) {
                @unlink($old_photo_path_physical); // Utilisation de @ pour éviter une erreur fatale si la suppression échoue
             }
        }
        
        http_response_code(200);
        echo json_encode(["success" => true, "message" => "Profil mis à jour avec succès.", "new_photo" => $photo_filename]);
    } else {
        http_response_code(503);
        echo json_encode(["success" => false, "message" => "Erreur lors de la mise à jour du profil."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    if ($e->getCode() === '23000') { 
        echo json_encode(["success" => false, "message" => "Cet email est déjà utilisé par un autre compte."]);
    } else {
        echo json_encode(["success" => false, "message" => "Erreur de base de données: " . $e->getMessage()]);
    }
}
$conn = null;
?>