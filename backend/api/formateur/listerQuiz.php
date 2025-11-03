<?php
// Headers CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuration BDD
require '../database.php';

// Récupération de l'ID cours (via GET)
$id_cours = isset($_GET['id_cours']) ? filter_var($_GET['id_cours'], FILTER_VALIDATE_INT) : null;

if (!$id_cours) {
    http_response_code(400);
    echo json_encode(["message" => "ID cours manquant."]);
    exit();
}

// Jointure pour compter le nombre de questions, incluant la colonne 'ordre' et triant par celle-ci.
$query = " SELECT
        Q.id_quiz, 
        Q.titre_quiz,
        Q.ordre, -- 1. AJOUT DE LA COLONNE ORDRE DANS LA SÉLECTION
        COUNT(QS.id_question) AS nombre_questions
    FROM 
        QUIZ Q
    LEFT JOIN 
        QUESTION QS ON Q.id_quiz = QS.id_quiz
    WHERE 
        Q.id_cours = :id_cours
    GROUP BY
        Q.id_quiz, Q.titre_quiz, Q.ordre -- 2. AJOUT DE LA COLONNE ORDRE DANS GROUP BY (si nécessaire selon MySQL version)
    ORDER BY 
        Q.ordre ASC, Q.id_quiz DESC -- 3. MODIFICATION DU TRI POUR UTILISER L'ORDRE
";

$stmt = $conn->prepare($query);
$stmt->bindParam(':id_cours', $id_cours);

try {
    $stmt->execute();
    $quiz_list = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode(["quiz" => $quiz_list]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur BDD: " . $e->getMessage()]);
}