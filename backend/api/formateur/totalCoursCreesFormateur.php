<?php
// ===================================================
// API pour compter TOUS les cours créés par le formateur
// ===================================================

header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS"); 
header("Access-Control-Max-Age: 3600");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') { http_response_code(405); echo json_encode(["message" => "Méthode non autorisée."]); exit(); }

require '../database.php'; // Assurez-vous que le chemin est correct


if (empty($_GET['id_formateur'])) { http_response_code(400); echo json_encode(["message" => "ID du formateur manquant."]); exit(); }
$id_formateur = htmlspecialchars(strip_tags($_GET['id_formateur']));

// Requête pour compter tous les cours, sans condition de publication
$query = "
    SELECT 
        COUNT(id_cours) AS total_cours_crees
    FROM 
        cours
    WHERE 
        id_formateur = :id_formateur
";

$stmt = $conn->prepare($query);
$stmt->bindParam(':id_formateur', $id_formateur, PDO::PARAM_INT);

try {
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "total_cours_crees" => (int)$row['total_cours_crees'] 
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur de base de données : " . $e->getMessage()]);
}
$conn = null;
?>