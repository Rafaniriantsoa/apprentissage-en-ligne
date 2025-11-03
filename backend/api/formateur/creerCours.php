<?php

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


// require '../config/database.php';
require '../database.php';

$id_formateur = $_POST['id_formateur'] ?? null;
$titre = $_POST['titre'] ?? null;
$description = $_POST['description'] ?? null;

// Vérification des champs requis
if (empty($id_formateur) || empty($titre) || !isset($description)) {
    http_response_code(400); // Bad Request
    echo json_encode(["message" => "Veuillez fournir l'ID du formateur, le titre et la description."]);
    exit();
}

if (!filter_var($id_formateur, FILTER_VALIDATE_INT)) {
    http_response_code(400); 
    echo json_encode(["message" => "ID formateur invalide."]);
    exit();
}

$titre = htmlspecialchars(strip_tags(trim($titre)));


// ===============================================
// 3. GESTION DE L'UPLOAD DE FICHIER PHOTO 
// ===============================================

$photo_path = null; // Initialisation du chemin de la photo
$upload_dir = 'uploads/cours/'; // Définir le répertoire de destination

// Créer le dossier s'il n'existe pas
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

// Vérifier si un fichier a été soumis
if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
    $file_tmp_name = $_FILES['photo']['tmp_name'];
    $file_name = basename($_FILES['photo']['name']);
    $file_extension = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));

    // Validation du type de fichier
    $allowed_types = ['jpg', 'jpeg', 'png', 'gif'];
    if (!in_array($file_extension, $allowed_types)) {
        http_response_code(400);
        echo json_encode(["message" => "Format de fichier non supporté. Seuls JPG, JPEG, PNG, GIF sont permis."]);
        exit();
    }

    // Créer un nom de fichier unique (pour éviter les conflits)
    $new_file_name = time() . "-" . $id_formateur . "." . $file_extension;
    $target_file = $upload_dir . $new_file_name;

    // Déplacer le fichier téléchargé
    if (move_uploaded_file($file_tmp_name, $target_file)) {
        // Enregistrer le chemin relatif à l'API pour la BDD
        $photo_path = $upload_dir . $new_file_name; 
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Erreur lors du déplacement du fichier."]);
        exit();
    }
}

// ===============================================
// 4. VÉRIFICATION DU RÔLE (inchangée)
// ===============================================

$verif_query = "SELECT role FROM UTILISATEUR WHERE id_utilisateur = :id_formateur AND role = 'formateur'";
$verif_stmt = $conn->prepare($verif_query);
$verif_stmt->bindParam(':id_formateur', $id_formateur, PDO::PARAM_INT);
$verif_stmt->execute();

if ($verif_stmt->rowCount() == 0) {
    // Supprimer le fichier si l'utilisateur n'est pas autorisé
    if ($photo_path && file_exists($target_file)) {
        unlink($target_file);
    }
    http_response_code(403); 
    echo json_encode(["message" => "Action non autorisée. Seuls les formateurs peuvent créer des cours."]);
    exit();
}


// ===============================================
// 5. INSÉRER LE COURS
// ===============================================

$query = "INSERT INTO COURS 
          SET id_formateur = :id_formateur, 
              titre = :titre, 
              description = :description,
              photo = :photo_path"; 

$stmt = $conn->prepare($query);

// Liaison des paramètres
$stmt->bindParam(':id_formateur', $id_formateur);
$stmt->bindParam(':titre', $titre);
$stmt->bindParam(':description', $description);
$stmt->bindParam(':photo_path', $photo_path); // Utilisation du chemin du fichier

try {
    if ($stmt->execute()) {
        $id_cours = $conn->lastInsertId();
        http_response_code(201); // Created
        echo json_encode([
            "message" => "Le cours a été créé avec succès.",
            "id_cours" => $id_cours,
            "titre" => $titre,
            "photo" => $photo_path
        ]);
    } else {
        http_response_code(503); 
        echo json_encode(["message" => "Impossible de créer le cours."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur de base de données lors de la création du cours: " . $e->getMessage()]);
}
?>