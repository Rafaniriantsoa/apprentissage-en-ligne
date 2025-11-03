<?php
// ===================================================
// 1. CONFIGURATION ET CONNEXION
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

// --- Connexion à la base de données ---
require '../database.php';

// ===============================================
// 2. RÉCUPÉRATION ET VALIDATION DES DONNÉES (POST & FILES)
// ===============================================

$id_cours = $_POST['id_cours'] ?? null;
$id_formateur = $_POST['id_formateur'] ?? null;
$titre = $_POST['titre'] ?? null; // Correspond à titre_lecon
$ordre = $_POST['ordre'] ?? null;

if (empty($id_cours) || empty($id_formateur) || empty($titre) || !isset($ordre)) {
    http_response_code(400);
    echo json_encode(["message" => "Données incomplètes. L'ID du cours, du formateur, le titre et l'ordre sont requis."]);
    exit();
}

if (!filter_var($id_cours, FILTER_VALIDATE_INT) || !filter_var($id_formateur, FILTER_VALIDATE_INT) || !filter_var($ordre, FILTER_VALIDATE_INT)) {
    http_response_code(400);
    echo json_encode(["message" => "ID(s) ou ordre invalide(s)."]);
    exit();
}

$titre = htmlspecialchars(strip_tags(trim($titre)));

// ===============================================
// 3. VÉRIFICATION DES DROITS (Sécurité)
// ===============================================

// Vérifier que le cours existe et appartient au formateur
$verif_query = "SELECT id_cours FROM COURS WHERE id_cours = :id_cours AND id_formateur = :id_formateur";
$verif_stmt = $conn->prepare($verif_query);
$verif_stmt->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);
$verif_stmt->bindParam(':id_formateur', $id_formateur, PDO::PARAM_INT);
$verif_stmt->execute();

if ($verif_stmt->rowCount() == 0) {
    http_response_code(403);
    echo json_encode(["message" => "Action non autorisée. Le cours n'existe pas ou ne vous appartient pas."]);
    exit();
}

// ===============================================
// 4. GESTION DE L'UPLOAD DE FICHIER (contenu)
// ===============================================

$chemin_fichier = null;
$upload_dir = 'uploads/lecons/';

if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

if (isset($_FILES['fichier']) && $_FILES['fichier']['error'] === UPLOAD_ERR_OK) {
    $file_tmp_name = $_FILES['fichier']['tmp_name'];
    $file_extension = strtolower(pathinfo($_FILES['fichier']['name'], PATHINFO_EXTENSION));

    $allowed_types = ['pdf', 'mp4', 'mov', 'avi', 'wmv'];
    if (!in_array($file_extension, $allowed_types)) {
        http_response_code(400);
        echo json_encode(["message" => "Format de fichier non supporté. Seuls PDF et formats vidéo sont permis."]);
        exit();
    }

    $new_file_name = time() . "-" . $id_cours . "-" . $ordre . "." . $file_extension;
    $target_file = $upload_dir . $new_file_name;

    if (move_uploaded_file($file_tmp_name, $target_file)) {
        $chemin_fichier = $upload_dir . $new_file_name;
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Erreur lors du déplacement du fichier."]);
        exit();
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Aucun fichier de leçon n'a été fourni ou une erreur d'upload s'est produite."]);
    exit();
}

// ===============================================
// 5. INSÉRER LA LEÇON
// ===============================================

$query = "INSERT INTO LECON 
          SET id_cours = :id_cours, 
              id_formateur = :id_formateur, 
              titre_lecon = :titre, 
              contenu = :contenu, 
              ordre = :ordre";

$stmt = $conn->prepare($query);

$stmt->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);
$stmt->bindParam(':id_formateur', $id_formateur, PDO::PARAM_INT);
$stmt->bindParam(':titre', $titre);
$stmt->bindParam(':contenu', $chemin_fichier);
$stmt->bindParam(':ordre', $ordre, PDO::PARAM_INT);

try {
    if ($stmt->execute()) {
        $id_lecon = $conn->lastInsertId();
        http_response_code(201); // Created
        echo json_encode([
            "message" => "La leçon a été créée avec succès.",
            "id_lecon" => $id_lecon,
            "titre" => $titre,
            "contenu" => $chemin_fichier
        ]);
    } else {
        // Supprimer le fichier en cas d'erreur BDD
        if ($chemin_fichier && file_exists($target_file)) {
            unlink($target_file);
        }
        http_response_code(503);
        echo json_encode(["message" => "Impossible de créer la leçon. Erreur BDD."]);
    }
} catch (PDOException $e) {
    if ($chemin_fichier && file_exists($target_file)) {
        unlink($target_file);
    }
    http_response_code(500);
    echo json_encode(["message" => "Erreur de base de données : " . $e->getMessage()]);
}
