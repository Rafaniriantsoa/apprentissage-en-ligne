<?php
// Liste détaillée des étudiants inscrits et nombre de cours suivis
header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS"); 
header("Access-Control-Max-Age: 3600");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') { http_response_code(405); echo json_encode(["message" => "Méthode non autorisée."]); exit(); }

require '../database.php'; 

if (empty($_GET['id_formateur'])) { http_response_code(400); echo json_encode(["message" => "ID du formateur manquant."]); exit(); }
$id_formateur = htmlspecialchars(strip_tags($_GET['id_formateur']));

$query = "
    SELECT 
        u.id_utilisateur,
        u.nom_complet,
        u.email,
        COUNT(i.id_cours) AS nombre_cours_suivis
    FROM 
        utilisateur u
    JOIN 
        inscription i ON u.id_utilisateur = i.id_utilisateur
    JOIN 
        cours c ON i.id_cours = c.id_cours
    WHERE 
        c.id_formateur = :id_formateur
    GROUP BY
        u.id_utilisateur, u.nom_complet, u.email
    ORDER BY
        u.nom_complet ASC
";

$stmt = $conn->prepare($query);
$stmt->bindParam(':id_formateur', $id_formateur, PDO::PARAM_INT);

try {
    $stmt->execute();
    $etudiants_arr = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $etudiants_final = array_map(function($e) {
        $e['nombre_cours_suivis'] = (int)$e['nombre_cours_suivis'];
        return $e;
    }, $etudiants_arr);
    
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "etudiants" => $etudiants_final
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur de base de données : " . $e->getMessage()]);
}
$conn = null;
?>