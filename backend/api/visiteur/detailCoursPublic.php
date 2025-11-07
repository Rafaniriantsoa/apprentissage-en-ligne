<?php
// detailCoursPublic.php

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

// Vérifier la méthode et l'ID
if ($_SERVER['REQUEST_METHOD'] !== 'GET' || !isset($_GET['id_cours'])) {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Méthode non autorisée ou ID manquant."]);
    exit();
}

$id_cours = htmlspecialchars(strip_tags($_GET['id_cours']));

// --- Paramètres de connexion MySQL ---
require '../database.php'; 

// ===============================================
// 2. RÉCUPÉRATION DES DÉTAILS DU COURS ET DU FORMATEUR
// ===============================================

// Requête principale: Cours + Formateur
$query_cours = "SELECT 
                    c.id_cours, 
                    c.titre, 
                    c.description, 
                    c.photo, 
                    c.date_creation,
                    u.nom_complet AS formateur,
                    u.photo AS photo_formateur 
                FROM COURS c
                JOIN UTILISATEUR u ON c.id_formateur = u.id_utilisateur
                WHERE c.id_cours = :id_cours AND c.est_publie = 1
                LIMIT 0,1";

$stmt_cours = $conn->prepare($query_cours);
$stmt_cours->bindParam(":id_cours", $id_cours, PDO::PARAM_INT);

$course_item = null;

try {
    $stmt_cours->execute();
    
    if ($stmt_cours->rowCount() > 0) {
        $row = $stmt_cours->fetch(PDO::FETCH_ASSOC);
        
        $course_item = array(
            "id_cours"        => $row['id_cours'],
            "titre"           => $row['titre'],
            "description"     => $row['description'],
            "photo"           => $row['photo'],
            "dateCreation"    => $row['date_creation'],
            "formateur"       => $row['formateur'],
            "photo_formateur" => $row['photo_formateur']
        );
        
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Cours introuvable ou non publié."]);
        exit();
    }
} catch (PDOException $e) {
    http_response_code(500); 
    echo json_encode(["success" => false, "message" => "Erreur de base de données (Cours): " . $e->getMessage()]);
    exit();
}

// ===============================================
// 3. RÉCUPÉRATION DES LEÇONS ASSOCIÉES
// ===============================================

$lecons_arr = array();
$query_lecons = "SELECT id_lecon, titre_lecon, `ordre` 
                 FROM LECON 
                 WHERE id_cours = :id_cours
                 ORDER BY `ordre` ASC"; 

$stmt_lecons = $conn->prepare($query_lecons);
$stmt_lecons->bindParam(":id_cours", $id_cours, PDO::PARAM_INT);

try {
    $stmt_lecons->execute();
    while ($row_lecon = $stmt_lecons->fetch(PDO::FETCH_ASSOC)) {
        array_push($lecons_arr, $row_lecon);
    }
} catch (PDOException $e) {
    // Note: On ne quitte pas immédiatement, car l'erreur de leçon n'empêche pas l'affichage du cours.
    error_log("Erreur de base de données (Leçons): " . $e->getMessage());
}

// ===============================================
// 4. RÉCUPÉRATION DU QUIZ ASSOCIÉ (S'il existe)
// ===============================================

$quiz_item = null;
$query_quiz = "SELECT id_quiz, titre_quiz 
               FROM QUIZ 
               WHERE id_cours = :id_cours
               LIMIT 0,1"; 

$stmt_quiz = $conn->prepare($query_quiz);
$stmt_quiz->bindParam(":id_cours", $id_cours, PDO::PARAM_INT);

try {
    $stmt_quiz->execute();
    if ($stmt_quiz->rowCount() > 0) {
        $row_quiz = $stmt_quiz->fetch(PDO::FETCH_ASSOC);
        $quiz_item = array(
            "id_quiz" => $row_quiz['id_quiz'],
            "titre"   => $row_quiz['titre_quiz'] // Le front-end utilise 'titre'
        );
    }
} catch (PDOException $e) {
    error_log("Erreur de base de données (Quiz): " . $e->getMessage());
}

// ===============================================
// 5. ENVOI DE LA RÉPONSE FINALE
// ===============================================

http_response_code(200);
echo json_encode([
    "success" => true,
    "message" => "Détails du cours et structure récupérés avec succès.",
    "cours"   => $course_item,
    "lecons"  => $lecons_arr,
    "quiz"    => $quiz_item
]);
?>