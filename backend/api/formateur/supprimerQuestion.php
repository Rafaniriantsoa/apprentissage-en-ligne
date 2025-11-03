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
if (empty($data->id_question)) {
    http_response_code(400); 
    echo json_encode(["message" => "ID de la question manquant."]); 
    exit();
}

$id_question = filter_var($data->id_question, FILTER_VALIDATE_INT);

// 1. Suppression de la Question
// Les clauses ON DELETE CASCADE des tables PROPOSITION et REPONSE_UTILISATEUR gèrent la suppression des dépendances.
$query = "DELETE FROM QUESTION WHERE id_question = :id_question";
$stmt = $conn->prepare($query);
$stmt->bindParam(':id_question', $id_question);

try {
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode(["message" => "Question et dépendances associées supprimées avec succès."]);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Question non trouvée."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Échec de la suppression de la question. " . $e->getMessage()]);
}

?>