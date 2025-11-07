<?php
// ===================================================
// API pour lister les cours suivis par un étudiant
// ===================================================
header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS"); 
header("Access-Control-Max-Age: 3600");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') { http_response_code(405); echo json_encode(["message" => "Méthode non autorisée."]); exit(); }

require '../database.php'; 

// Vérification des deux IDs nécessaires
if (empty($_GET['id_formateur']) || empty($_GET['id_etudiant'])) { 
    http_response_code(400); 
    echo json_encode(["message" => "Les IDs du formateur et de l'étudiant sont requis."]); 
    exit(); 
}

$id_formateur = htmlspecialchars(strip_tags($_GET['id_formateur']));
$id_etudiant = htmlspecialchars(strip_tags($_GET['id_etudiant']));

$query = "
    SELECT 
        c.titre,
        i.statut,
        i.date_inscription
    FROM 
        inscription i
    JOIN 
        cours c ON i.id_cours = c.id_cours
    WHERE 
        c.id_formateur = :id_formateur
        AND i.id_utilisateur = :id_etudiant
    ORDER BY
        i.date_inscription DESC
";

$stmt = $conn->prepare($query);
$stmt->bindParam(':id_formateur', $id_formateur, PDO::PARAM_INT);
$stmt->bindParam(':id_etudiant', $id_etudiant, PDO::PARAM_INT);

try {
    $stmt->execute();
    $cours_arr = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "cours_suivis" => $cours_arr,
        "nombre_cours" => count($cours_arr)
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur de base de données : " . $e->getMessage()]);
}
$conn = null;
?>