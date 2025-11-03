<?php
// Headers CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

// Configuration BDD
require '../database.php';
// Récupération de l'ID du quiz depuis l'URL
$id_quiz = isset($_GET['id_quiz']) ? filter_var($_GET['id_quiz'], FILTER_VALIDATE_INT) : die();

if (!$id_quiz) {
    http_response_code(400);
    echo json_encode(["message" => "ID du quiz manquant ou invalide."]);
    exit();
}

// Requête SQL pour joindre les questions et les propositions
// On utilise LEFT JOIN pour inclure les questions qui n'auraient pas encore de propositions (bien que rare)
$query = "    SELECT 
        Q.id_question, 
        Q.texte_question, 
        P.id_proposition, 
        P.texte_proposition, 
        P.est_correct
    FROM 
        QUESTION Q
    LEFT JOIN 
        PROPOSITION P ON Q.id_question = P.id_question
    WHERE 
        Q.id_quiz = :id_quiz
    ORDER BY 
        Q.id_question, P.id_proposition
";

$stmt = $conn->prepare($query);
$stmt->bindParam(':id_quiz', $id_quiz);
$stmt->execute();

$questions_data = [];

// Traitement des résultats pour regrouper les propositions par question
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $id_question = $row['id_question'];

    // Initialiser la question si elle n'existe pas encore dans le tableau de données final
    if (!isset($questions_data[$id_question])) {
        $questions_data[$id_question] = [
            'id_question' => $row['id_question'],
            'texte_question' => $row['texte_question'],
            'propositions' => []
        ];
    }
    
    // Ajouter la proposition si elle existe (P.id_proposition n'est pas NULL)
    if ($row['id_proposition'] !== null) {
        $questions_data[$id_question]['propositions'][] = [
            'id_proposition' => $row['id_proposition'],
            'texte_proposition' => $row['texte_proposition'],
            // Le type BOOLEAN est souvent renvoyé comme 1 ou 0. On le cast en booléen ici.
            'est_correct' => (bool)$row['est_correct'] 
        ];
    }
}

// Conversion du tableau associatif en tableau indexé pour le JSON final
$questions_list = array_values($questions_data);

if (empty($questions_list)) {
    http_response_code(404);
    echo json_encode(["message" => "Aucune question trouvée pour ce quiz.", "questions" => []]);
} else {
    http_response_code(200);
    echo json_encode(["message" => "Questions QCM listées avec succès.", "questions" => $questions_list]);
}

?>