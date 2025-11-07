<?php
// backend/api/etudiant/passerQuiz.php

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

if (empty($_GET['id_quiz'])) {
    http_response_code(400); 
    echo json_encode(["message" => "Veuillez fournir l'ID du quiz."]);
    exit();
}

$id_quiz = htmlspecialchars(strip_tags($_GET['id_quiz']));

try {
    // Récupérer le titre du quiz
    $query_quiz = "SELECT titre_quiz FROM QUIZ WHERE id_quiz = :id_quiz LIMIT 1";
    $stmt_quiz = $conn->prepare($query_quiz);
    $stmt_quiz->bindParam(':id_quiz', $id_quiz, PDO::PARAM_INT);
    $stmt_quiz->execute();
    $quiz_info = $stmt_quiz->fetch(PDO::FETCH_ASSOC);

    if (!$quiz_info) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Quiz introuvable."]);
        exit();
    }
    
    // Récupérer toutes les questions pour ce quiz
    $query_questions = "SELECT id_question, texte_question 
                        FROM QUESTION 
                        WHERE id_quiz = :id_quiz 
                        ORDER BY id_question ASC"; 
    $stmt_questions = $conn->prepare($query_questions);
    $stmt_questions->bindParam(':id_quiz', $id_quiz, PDO::PARAM_INT);
    $stmt_questions->execute();
    $questions = $stmt_questions->fetchAll(PDO::FETCH_ASSOC);

    $quiz_complet = [
        "id_quiz" => (int)$id_quiz,
        "titre_quiz" => $quiz_info['titre_quiz'],
        "questions" => []
    ];

    // Pour chaque question, récupérer ses propositions
    foreach ($questions as $q) {
        $query_propositions = "SELECT id_proposition, texte_proposition 
                               FROM PROPOSITION 
                               WHERE id_question = :id_question";
        $stmt_propositions = $conn->prepare($query_propositions);
        $stmt_propositions->bindParam(':id_question', $q['id_question'], PDO::PARAM_INT);
        $stmt_propositions->execute();
        $propositions = $stmt_propositions->fetchAll(PDO::FETCH_ASSOC);

        $q['propositions'] = $propositions;
        $quiz_complet['questions'][] = $q;
    }

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "quiz" => $quiz_complet
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erreur de base de données: " . $e->getMessage()]);
}
?>