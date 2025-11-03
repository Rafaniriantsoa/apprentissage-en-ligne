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

$id_cours = filter_var($data->id_cours, FILTER_VALIDATE_INT);
$titre_quiz = filter_var($data->titre_quiz, FILTER_SANITIZE_STRING);

if (!$id_cours || empty($titre_quiz)) {
    http_response_code(400); 
    echo json_encode(["message" => "Données incomplètes (ID cours ou titre du quiz manquant)."]);
    exit();
}

// Insertion dans la BDD
$query = "INSERT INTO QUIZ (id_cours, titre_quiz) VALUES (:id_cours, :titre_quiz)";
$stmt = $conn->prepare($query);
$stmt->bindParam(':id_cours', $id_cours);
$stmt->bindParam(':titre_quiz', $titre_quiz);

try {
    $stmt->execute();
    $last_id = $conn->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "message" => "Quiz créé avec succès.",
        "id_quiz" => $last_id
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur BDD lors de la création du quiz: " . $e->getMessage()]);
}
?>