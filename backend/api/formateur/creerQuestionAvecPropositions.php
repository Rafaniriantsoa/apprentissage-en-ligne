<?php
// Headers CORS
header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

// Configuration BDD
require '../database.php';

// Récupération des données JSON
$data = json_decode(file_get_contents("php://input"));

// Validation des données
if (empty($data->id_quiz) || empty($data->texte_question) || empty($data->propositions) || !is_array($data->propositions)) {
    http_response_code(400); 
    echo json_encode(["message" => "Données incomplètes. Assurez-vous d'avoir l'ID du quiz, le texte de la question, et au moins deux propositions."]); 
    exit();
}

$id_quiz = filter_var($data->id_quiz, FILTER_VALIDATE_INT);
$texte_question = trim(filter_var($data->texte_question, FILTER_SANITIZE_STRING));
$propositions = $data->propositions;

// Vérification qu'il y a au moins une réponse correcte
$correctCount = 0;
foreach ($propositions as $prop) {
    if (isset($prop->est_correct) && $prop->est_correct) {
        $correctCount++;
    }
}

if ($correctCount !== 1) {
    http_response_code(400); 
    echo json_encode(["message" => "Le QCM doit contenir exactement une et une seule bonne réponse."]); 
    exit();
}

// --- Début de la Transaction ---
$conn->beginTransaction();

try {
    // 1. Insertion de la Question
    $query_question = "INSERT INTO QUESTION (id_quiz, texte_question) VALUES (:id_quiz, :texte_question)";
    $stmt_question = $conn->prepare($query_question);
    $stmt_question->bindParam(':id_quiz', $id_quiz);
    $stmt_question->bindParam(':texte_question', $texte_question);
    $stmt_question->execute();
    
    // Récupération de l'ID de la nouvelle question
    $id_question = $conn->lastInsertId();

    // 2. Insertion des Propositions
    $query_proposition = "INSERT INTO PROPOSITION (id_question, texte_proposition, est_correct) VALUES (:id_question, :texte_proposition, :est_correct)";
    $stmt_proposition = $conn->prepare($query_proposition);
    
    foreach ($propositions as $prop) {
        if (!empty(trim($prop->texte_proposition))) {
            $texte_proposition = trim(filter_var($prop->texte_proposition, FILTER_SANITIZE_STRING));
            $est_correct = (isset($prop->est_correct) && $prop->est_correct) ? 1 : 0; // Convertir BOOLEAN en 1/0
            
            $stmt_proposition->bindParam(':id_question', $id_question);
            $stmt_proposition->bindParam(':texte_proposition', $texte_proposition);
            $stmt_proposition->bindParam(':est_correct', $est_correct);
            $stmt_proposition->execute();
        }
    }
    
    // Si tout va bien, on valide la transaction
    $conn->commit();
    
    http_response_code(201);
    echo json_encode(["message" => "Question QCM créée avec succès.", "id_question" => $id_question]);

} catch (PDOException $e) {
    // En cas d'erreur, annuler toutes les insertions
    $conn->rollBack();
    http_response_code(500);
    echo json_encode(["message" => "Échec de la création du QCM. " . $e->getMessage()]);
}

?>