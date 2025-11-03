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
// Récupération des données POST
$data = json_decode(file_get_contents("php://input"));

$id_quiz = filter_var($data->id_quiz, FILTER_VALIDATE_INT);
$titre_quiz = filter_var($data->titre_quiz, FILTER_SANITIZE_STRING);
$ordre_quiz = filter_var($data->ordre, FILTER_SANITIZE_STRING);
if (!$id_quiz || empty($titre_quiz)) {
    http_response_code(400); 
    echo json_encode(["message" => "ID quiz ou titre manquant."]);
    exit();
}

// Mise à jour dans la BDD
$query = "UPDATE QUIZ SET titre_quiz = :titre_quiz, ordre = :ordre WHERE id_quiz = :id_quiz";
$stmt = $conn->prepare($query);
$stmt->bindParam(':titre_quiz', $titre_quiz);
$stmt->bindParam(':id_quiz', $id_quiz);
$stmt->bindParam(':ordre', $ordre_quiz);

try {
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode(["message" => "Quiz modifié avec succès."]);
    } else {
        // Cela peut arriver si l'ID est valide mais le titre n'a pas changé
        http_response_code(200);
        echo json_encode(["message" => "Aucune modification nécessaire ou quiz non trouvé."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur BDD lors de la modification du quiz: " . $e->getMessage()]);
}
?>