<?php
// ===================================================
// 1. CONFIGURATION DE L'API ET DE LA BASE DE DONNÉES
// ===================================================

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// GESTION DE LA REQUÊTE PRÉLIMINAIRE (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// CONNEXION A LA BDD
require '../database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Méthode non autorisée. Seul POST est accepté."]);
    exit();
}

// Les données JSON ou POST
$data = json_decode(file_get_contents("php://input"), true);

// Si la requête n'est pas du JSON (ex: FormData avec fichier), on utilise $_POST et $_FILES
if (!$data) {
    $data = $_POST;
}

// Vérification des champs obligatoires
if (empty($data['nomComplet']) || empty($data['email']) || empty($data['motDePasse']) || empty($data['role'])) {
    http_response_code(400);
    echo json_encode(["message" => "Veuillez fournir un nom complet, email, mot de passe et rôle."]);
    exit();
}

// Nettoyage et hachage
$nomComplet = trim($data['nomComplet']);
$email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
$role = $data['role'];

// GESTION SÉCURISÉE DE LA SPÉCIALITÉ (Pour éviter les erreurs si la clé n'est pas envoyée)
$specialite = $data['specialite'] ?? '';

$mot_de_passe_hache = password_hash($data['motDePasse'], PASSWORD_BCRYPT);
$photo_path = null;


// RESAKA PHOTO I

if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
    $upload_dir = 'uploads/photos/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    $file_tmp = $_FILES['photo']['tmp_name'];
    $file_ext = strtolower(pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION));
    $allowed_extensions = ['jpg', 'jpeg', 'png', 'gif'];

    if (in_array($file_ext, $allowed_extensions)) {
        // Nom unique basé sur l'email (pour éviter les doublons)
        $file_name = uniqid() . '-' . md5($email) . '.' . $file_ext;
        $photo_path = $upload_dir . $file_name;

        if (!move_uploaded_file($file_tmp, $photo_path)) {
            http_response_code(500);
            echo json_encode(["message" => "Erreur lors du déplacement du fichier photo."]);
            exit();
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Format de fichier non autorisé. Utilisez JPG, PNG ou GIF."]);
        exit();
    }
}


// ===============================================
// 4. INSERTION DANS LA BASE DE DONNÉES
// ===============================================

$query = "INSERT INTO  UTILISATEUR  
          SET nom_complet = :nomComplet,
              email = :email, 
              mot_de_passe = :mot_de_passe,
              photo = :photo,
              role = :role,
              specialite = :specialite";

$stmt = $conn->prepare($query);

// Liaison des paramètres (Binding)
$stmt->bindParam(':nomComplet', $nomComplet);
$stmt->bindParam(':email', $email);
$stmt->bindParam(':mot_de_passe', $mot_de_passe_hache);
$stmt->bindParam(':photo', $photo_path);
$stmt->bindParam(':role', $role);
$stmt->bindParam(':specialite', $specialite);

try {
    if ($stmt->execute()) {
        
        // 🌟 CORRECTION 1 : Récupérer l'ID du dernier enregistrement inséré
        $last_id = $conn->lastInsertId();
        
        // --- Requête de sélection pour récupérer les données complètes ---
        $select_query = "SELECT id_utilisateur, nom_complet, email, role, photo, specialite 
                         FROM UTILISATEUR 
                         WHERE id_utilisateur = :id_utilisateur LIMIT 0,1";

        $stmtSelect = $conn->prepare($select_query);
        $stmtSelect->bindParam(':id_utilisateur', $last_id);
        $stmtSelect->execute();
        
        $row = $stmtSelect->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            http_response_code(201); // Created
            
            // 🌟 Assurez-vous que les clés correspondent aux noms des colonnes SQL
            $utilisateur = [
                "id_utilisateur" => $row['id_utilisateur'], // Renommer pour être simple côté React
                "nomComplet" => $row['nom_complet'],
                "email" => $row['email'],
                "role" => $row['role'],
                "photo" => $row['photo'],
                "specialite" => $row['specialite'] // Sera null si non défini
            ];
            
            echo json_encode([
                "message" => "Inscription réussie et utilisateur créé !",
                "utilisateur" => $utilisateur
            ]);
            
        } else {
             // Cas improbable où l'insertion a réussi mais la sélection échoue
            http_response_code(500);
            echo json_encode(["message" => "Inscription réussie, mais impossible de récupérer les détails de l'utilisateur."]);
        }

    } else {
        // Échec de l'exécution de la requête INSERT (ex: erreur de syntaxe SQL)
        http_response_code(500);
        echo json_encode(["message" => "Échec de l'inscription."]);
    }
} catch (PDOException $e) {
    // GESTION EXPLICITE DU DOUBLON D'EMAIL (CONTRAINTE UNIQUE)
    if ($e->getCode() == '23000') {
        http_response_code(409); // Conflict
        echo json_encode(["message" => "L'adresse email est déjà utilisée."]);
    } else {
        // Afficher l'erreur pour le débogage, mais masquer en production
        http_response_code(500);
        echo json_encode(["message" => "Erreur base de données: " . $e->getMessage()]);
    }
}
// Fin du script PHP
?>