<?php
// Total des étudiants uniques inscrits aux cours du formateur
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["message" => "Méthode non autorisée."]);
    exit();
}

require '../database.php';

if (empty($_GET['id_formateur'])) {
    http_response_code(400);
    echo json_encode(["message" => "ID du formateur manquant."]);
    exit();
}
$id_formateur = htmlspecialchars(strip_tags($_GET['id_formateur']));

$query = "
    SELECT 
        COUNT(DISTINCT i.id_utilisateur) AS total_etudiants_inscrits
    FROM 
        inscription i
    JOIN 
        cours c ON i.id_cours = c.id_cours
    WHERE 
        c.id_formateur = :id_formateur
";

$stmt = $conn->prepare($query);
$stmt->bindParam(':id_formateur', $id_formateur, PDO::PARAM_INT);

try {
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "total_etudiants_inscrits" => (int)$row['total_etudiants_inscrits']
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur de base de données : " . $e->getMessage()]);
}
$conn = null;
