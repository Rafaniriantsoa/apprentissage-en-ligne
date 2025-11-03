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

if (!$id_quiz) {
    http_response_code(400); 
    echo json_encode(["message" => "ID quiz manquant."]);
    exit();
}

// Suppression dans la BDD (les QUESTIONS associées seront supprimées en cascade)
$query = "DELETE FROM QUIZ WHERE id_quiz = :id_quiz";
$stmt = $conn->prepare($query);
$stmt->bindParam(':id_quiz', $id_quiz);

try {
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode(["message" => "Quiz supprimé avec succès (Questions et réponses utilisateurs associées également supprimées)."]);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Aucun quiz trouvé avec cet ID."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur BDD lors de la suppression du quiz: " . $e->getMessage()]);
}
?>