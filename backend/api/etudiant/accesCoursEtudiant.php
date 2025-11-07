<?php
// backend/api/etudiant/accesCoursEtudiant.php
// ===================================================
// 1. CONFIGURATION DE L'API
// ===================================================

header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS"); 
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["message" => "Méthode non autorisée. Seul GET est accepté."]);
    exit();
}

require '../database.php';

// ===============================================
// 2. RÉCUPÉRATION ET VALIDATION DES PARAMÈTRES
// ===============================================

if (empty($_GET['id_cours']) || empty($_GET['id_utilisateur'])) {
    http_response_code(400); 
    echo json_encode(["message" => "Veuillez fournir l'ID du cours et de l'utilisateur."]);
    exit();
}

$id_cours = htmlspecialchars(strip_tags($_GET['id_cours']));
$id_utilisateur = htmlspecialchars(strip_tags($_GET['id_utilisateur']));

// ===============================================
// 3. LOGIQUE DE RÉCUPÉRATION DU CONTENU
// ===============================================

try {
    // 3.1 Vérification de l'inscription (Non modifié)
    $query_inscription = "SELECT statut FROM INSCRIPTION WHERE id_utilisateur = :idu AND id_cours = :idc LIMIT 1";
    $stmt_inscription = $conn->prepare($query_inscription);
    $stmt_inscription->bindParam(':idu', $id_utilisateur, PDO::PARAM_INT);
    $stmt_inscription->bindParam(':idc', $id_cours, PDO::PARAM_INT);
    $stmt_inscription->execute();

    if ($stmt_inscription->rowCount() === 0) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Accès refusé. Vous n'êtes pas inscrit à ce cours."]);
        exit();
    }
    
    // 3.2 Récupération des données du cours (Non modifié)
    $query_cours = "SELECT c.id_cours, c.titre, u.nom_complet AS nom_formateur 
                    FROM COURS c
                    JOIN UTILISATEUR u ON c.id_formateur = u.id_utilisateur
                    WHERE c.id_cours = :id_cours";
    $stmt_cours = $conn->prepare($query_cours);
    $stmt_cours->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);
    $stmt_cours->execute();
    $course_data = $stmt_cours->fetch(PDO::FETCH_ASSOC);

    // 3.3 Récupération des leçons (Non modifié)
    $query_lecons = "SELECT id_lecon, titre_lecon, contenu, ordre 
                     FROM LECON 
                     WHERE id_cours = :id_cours 
                     ORDER BY ordre ASC";
    $stmt_lecons = $conn->prepare($query_lecons);
    $stmt_lecons->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);
    $stmt_lecons->execute();
    $lecons_arr = $stmt_lecons->fetchAll(PDO::FETCH_ASSOC);

    // 3.3.1 CORRECTION : Récupération des leçons vues par l'utilisateur ET qui appartiennent à CE cours
    $query_vues_cours = "SELECT p.id_lecon 
                         FROM PROGRESSION p
                         JOIN LECON l ON p.id_lecon = l.id_lecon
                         WHERE p.id_utilisateur = :idu 
                           AND l.id_cours = :idc"; // <-- CORRECTION CRITIQUE
    $stmt_vues = $conn->prepare($query_vues_cours);
    $stmt_vues->bindParam(':idu', $id_utilisateur, PDO::PARAM_INT);
    $stmt_vues->bindParam(':idc', $id_cours, PDO::PARAM_INT);
    $stmt_vues->execute();
    $lecons_vues_ids = $stmt_vues->fetchAll(PDO::FETCH_COLUMN, 0); 

    // 3.3.2 Fusion des données et calcul de progression
    $total_lecons = count($lecons_arr);
    $lecons_vues_count = count($lecons_vues_ids); 

    $lecons_final_arr = array_map(function($lecon) use ($lecons_vues_ids) {
        // Ajout du drapeau 'vue' à chaque leçon (booléen)
        $lecon['vue'] = in_array($lecon['id_lecon'], $lecons_vues_ids);
        return $lecon;
    }, $lecons_arr);

    $progression_pourcentage = ($total_lecons > 0) 
        ? round(($lecons_vues_count / $total_lecons) * 100) 
        : 0;

    // 3.4 Récupération de TOUS les quiz (Non modifié)
    $query_quizzes = "SELECT id_quiz, titre_quiz, ordre 
                      FROM QUIZ 
                      WHERE id_cours = :id_cours 
                      ORDER BY ordre ASC";
    $stmt_quizzes = $conn->prepare($query_quizzes);
    $stmt_quizzes->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);
    $stmt_quizzes->execute();
    $quizzes_data = $stmt_quizzes->fetchAll(PDO::FETCH_ASSOC);

    $quizzes_list = [];
    $is_previous_quiz_passed = true; 
    
    foreach ($quizzes_data as $quiz) {
        $quiz_id = $quiz['id_quiz'];
        
        $query_resultat = "SELECT score_obtenu 
                           FROM RESULTAT_QUIZ 
                           WHERE id_utilisateur = :id_utilisateur 
                           AND id_quiz = :id_quiz 
                           ORDER BY date_passage DESC 
                           LIMIT 1";
        $stmt_resultat = $conn->prepare($query_resultat);
        $stmt_resultat->bindParam(':id_utilisateur', $id_utilisateur, PDO::PARAM_INT);
        $stmt_resultat->bindParam(':id_quiz', $quiz_id, PDO::PARAM_INT);
        $stmt_resultat->execute();
        $resultat = $stmt_resultat->fetch(PDO::FETCH_ASSOC);

        // Logique de réussite : score > 0 ou un seuil défini
        $passed = $resultat && ($resultat['score_obtenu'] > 0); 
        $locked = !$is_previous_quiz_passed; 

        $quiz_item = [
            "id_quiz" => $quiz_id,
            "titre_quiz" => $quiz['titre_quiz'],
            "ordre" => $quiz['ordre'],
            "passed" => $passed, 
            "locked" => $locked 
        ];
        
        $quizzes_list[] = $quiz_item;
        
        if (!$passed) {
            $is_previous_quiz_passed = false;
        }
    }

    // ===============================================
    // 4. RÉPONSE FINALE
    // ===============================================

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "cours" => $course_data,
        "lecons" => $lecons_final_arr, 
        "quizzes" => $quizzes_list, 
        "progression_pourcentage" => $progression_pourcentage, 
        "total_lecons" => $total_lecons,
        "lecons_vues_count" => $lecons_vues_count
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erreur de base de données: " . $e->getMessage()]);
}
$conn = null;
?>