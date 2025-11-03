<?php

header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");

header("Access-Control-Allow-Methods: POST, OPTIONS"); 

header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // Répondre immédiatement avec un statut OK (200)
    exit(); // Stopper l'exécution du reste du script
}

// --- Paramètres de connexion MySQL ---

require '../database.php';

// Vérification de la méthode POST (après la gestion OPTIONS)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Méthode non autorisée. Seul POST est accepté."]);
    exit();
}

// Récupération des données JSON envoyées par Axios
$data = json_decode(file_get_contents("php://input"), true);

// Vérification des champs requis
if (empty($data['email']) || empty($data['motDePasse'])) {
    http_response_code(400);
    echo json_encode(["message" => "Veuillez fournir l'email et le mot de passe."]);
    exit();
}

$email = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
$mot_de_passe_saisi = $data['motDePasse'];

// ===============================================
// 3. AUTHENTIFICATION DE L'UTILISATEUR
// ===============================================

// Préparation de la requête pour récupérer l'utilisateur par email
$query = "SELECT * FROM UTILISATEUR 
          WHERE email = :email 
          LIMIT 0,1";

$stmt = $conn->prepare($query);
$stmt->bindParam(':email', $email);

try {
    $stmt->execute();
    $num = $stmt->rowCount();

    // 3.1. Vérification de l'existence de l'utilisateur
    if ($num == 1) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $mot_de_passe_hache_db = $row['mot_de_passe'];

        // 3.2. Vérification du mot de passe (méthode sécurisée)
        if (password_verify($mot_de_passe_saisi, $mot_de_passe_hache_db)) {
            
            // Connexion réussie
            http_response_code(200);

            // Création de l'objet utilisateur à renvoyer (sans le mot de passe haché !)
            $utilisateur = [
                "id_utilisateur" => $row['id_utilisateur'],
                // Assurez-vous que les clés correspondent aux colonnes réelles de votre BD
                "nom_complet" => $row['nom_complet'], 
                "email" => $row['email'],
                "role" => $row['role'],
                "photo" =>$row['photo'],
                "specialite"=>$row['specialite'] ?? null // Ajout conditionnel si la colonne existe
            ];

            echo json_encode([
                "message" => "Connexion réussie !",
                "utilisateur" => $utilisateur
            ]);
            
        } else {
            // Mot de passe incorrect
            http_response_code(401); // Unauthorized
            echo json_encode(["message" => "Email ou mot de passe incorrect."]);
        }
    } else {
        // Utilisateur non trouvé
        http_response_code(401); // Unauthorized
        echo json_encode(["message" => "Email ou mot de passe incorrect."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur base de données lors de la connexion: " . $e->getMessage()]);
}

// Fin du script PHP
?>