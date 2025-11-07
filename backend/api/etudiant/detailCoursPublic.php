<?php
// detailCoursPublic.php - Fournit les détails d'un cours publié (utilisé pour la modal de sommaire)

// ===================================================
// 1. CONFIGURATION DE L'API
// ===================================================

header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS"); 
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); 
    exit(); 
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Méthode non autorisée. Seul GET est accepté."]);
    exit();
}

// --- Paramètres de connexion MySQL ---
require '../database.php'; // Assurez-vous que le chemin est correct

// ===============================================
// 2. RÉCUPÉRATION ET VALIDATION DES PARAMÈTRES
// ===============================================

if (empty($_GET['id_cours'])) {
    http_response_code(400); 
    echo json_encode(["success" => false, "message" => "Veuillez fournir l'ID du cours."]);
    exit();
}

$id_cours = htmlspecialchars(strip_tags($_GET['id_cours']));

// ===============================================
// 3. EXÉCUTION DES REQUÊTES
// ===============================================

try {
    // 3.1 Détails du cours et formateur
    $query_cours = "SELECT 
                        c.id_cours, c.titre, c.description, c.photo, c.date_creation,
                        u.nom_complet AS formateur 
                    FROM COURS c
                    JOIN UTILISATEUR u ON c.id_formateur = u.id_utilisateur
                    WHERE c.id_cours = :id_cours AND c.est_publie = 1
                    LIMIT 1";

    $stmt_cours = $conn->prepare($query_cours);
    $stmt_cours->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);
    $stmt_cours->execute();
    $row_cours = $stmt_cours->fetch(PDO::FETCH_ASSOC);

    if (!$row_cours) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Cours non trouvé ou non publié."]);
        exit();
    }
    
    // 3.2 Récupération des leçons (Sommaire)
    $query_lecons = "SELECT id_lecon, titre_lecon, ordre 
                     FROM LECON 
                     WHERE id_cours = :id_cours 
                     ORDER BY ordre ASC";
                     
    $stmt_lecons = $conn->prepare($query_lecons);
    $stmt_lecons->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);
    $stmt_lecons->execute();
    $lecons_arr = $stmt_lecons->fetchAll(PDO::FETCH_ASSOC);

    // 3.3 Récupération du quiz (Titre uniquement)
    $query_quiz = "SELECT id_quiz, titre_quiz AS titre 
                   FROM QUIZ 
                   WHERE id_cours = :id_cours 
                   LIMIT 1";
                   
    $stmt_quiz = $conn->prepare($query_quiz);
    $stmt_quiz->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);
    $stmt_quiz->execute();
    $quiz_data = $stmt_quiz->fetch(PDO::FETCH_ASSOC);

    // ===============================================
    // 4. RÉPONSE FINALE
    // ===============================================

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Détails du cours et sommaire récupérés.",
        "cours" => $row_cours,
        "lecons" => $lecons_arr,
        // Retourne le quiz ou null si non trouvé
        "quiz" => $quiz_data ? $quiz_data : null 
    ]);

} catch (PDOException $e) {
    http_response_code(500); 
    echo json_encode(["success" => false, "message" => "Erreur de base de données: " . $e->getMessage()]);
}
?>