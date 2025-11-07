<?php
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
    echo json_encode(["message" => "Méthode non autorisée. Seul GET est accepté."]);
    exit();
}

require '../database.php';

// ===============================================
// 2. RÉCUPÉRATION ET VALIDATION DES PARAMÈTRES
// ===============================================

if (empty($_GET['id_cours'])) {
    http_response_code(400); 
    echo json_encode(["message" => "Veuillez fournir l'ID du cours."]);
    exit();
}

$id_cours = filter_var($_GET['id_cours'], FILTER_VALIDATE_INT);

if (!$id_cours) {
    http_response_code(400); 
    echo json_encode(["message" => "ID cours invalide."]);
    exit();
}

// ===============================================
// 3. RÉCUPÉRATION DES DONNÉES STRUCTURÉES
// ===============================================

try {
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 3.1. Récupération des détails du Cours
    $query_cours = "SELECT c.*, u.nom_complet as nom_formateur 
                    FROM cours c 
                    JOIN utilisateur u ON c.id_formateur = u.id_utilisateur 
                    WHERE c.id_cours = :id_cours";
    $stmt_cours = $conn->prepare($query_cours);
    $stmt_cours->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);
    $stmt_cours->execute();
    $cours = $stmt_cours->fetch(PDO::FETCH_ASSOC);

    if (!$cours) {
        http_response_code(404);
        echo json_encode(["message" => "Cours non trouvé."]);
        exit();
    }

    // 3.2. Récupération des Leçons
    $query_lecons = "SELECT * FROM lecon 
                     WHERE id_cours = :id_cours 
                     ORDER BY ordre ASC";
    $stmt_lecons = $conn->prepare($query_lecons);
    $stmt_lecons->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);
    $stmt_lecons->execute();
    $lecons = $stmt_lecons->fetchAll(PDO::FETCH_ASSOC);
    
    // 3.3. Récupération des Quiz, Questions et Propositions
    $query_quiz = "SELECT qz.id_quiz, qz.titre_quiz, qz.ordre, 
                          qs.id_question, qs.texte_question, 
                          p.id_proposition, p.texte_proposition, p.est_correct
                   FROM quiz qz
                   LEFT JOIN question qs ON qz.id_quiz = qs.id_quiz
                   LEFT JOIN proposition p ON qs.id_question = p.id_question
                   WHERE qz.id_cours = :id_cours 
                   ORDER BY qz.ordre ASC, qs.id_question ASC, p.id_proposition ASC";
    
    $stmt_quiz = $conn->prepare($query_quiz);
    $stmt_quiz->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);
    $stmt_quiz->execute();
    $quiz_results = $stmt_quiz->fetchAll(PDO::FETCH_ASSOC);

    $quiz_structured = [];
    foreach ($quiz_results as $row) {
        $quiz_id = $row['id_quiz'];
        $question_id = $row['id_question'];
        
        if (!isset($quiz_structured[$quiz_id])) {
            $quiz_structured[$quiz_id] = [
                'id_quiz' => $quiz_id,
                'titre_quiz' => $row['titre_quiz'],
                'ordre' => $row['ordre'],
                'questions' => []
            ];
        }

        if ($question_id && !isset($quiz_structured[$quiz_id]['questions'][$question_id])) {
            $quiz_structured[$quiz_id]['questions'][$question_id] = [
                'id_question' => $question_id,
                'texte_question' => $row['texte_question'],
                'propositions' => []
            ];
        }

        if ($row['id_proposition']) {
            $quiz_structured[$quiz_id]['questions'][$question_id]['propositions'][] = [
                'id_proposition' => $row['id_proposition'],
                'texte_proposition' => $row['texte_proposition'],
                'est_correct' => (int)$row['est_correct'] 
            ];
        }
    }

    foreach ($quiz_structured as $id => $quiz_item) {
        $quiz_structured[$id]['questions'] = array_values($quiz_item['questions']);
    }

    $cours['lecons'] = $lecons;
    $cours['quiz'] = array_values($quiz_structured);
    
    http_response_code(200);
    echo json_encode([
        "message" => "Contenu du cours récupéré avec succès.",
        "cours" => $cours
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur de base de données : " . $e->getMessage()]);
}

?>