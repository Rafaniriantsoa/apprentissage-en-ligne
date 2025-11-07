<?php
// Liste détaillée des cours publiés par le formateur avec le nombre d'inscrits
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
        c.id_cours,
        c.titre,
        c.description,
        c.date_creation,
        c.photo, -- 🌟 AJOUT DU CHAMP PHOTO 🌟
        COUNT(i.id_utilisateur) AS nombre_inscrits
    FROM 
        cours c
    LEFT JOIN 
        inscription i ON c.id_cours = i.id_cours
    WHERE 
        c.id_formateur = :id_formateur
        AND c.est_publie = 1
    GROUP BY
        c.id_cours, c.titre, c.description, c.date_creation, c.photo -- 🌟 AJOUT DU CHAMP PHOTO AU GROUP BY 🌟
    ORDER BY
        c.date_creation DESC
";

$stmt = $conn->prepare($query);
$stmt->bindParam(':id_formateur', $id_formateur, PDO::PARAM_INT);

try {
    $stmt->execute();
    $cours_arr = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $cours_final = array_map(function($c) {
        $c['nombre_inscrits'] = (int)$c['nombre_inscrits'];
        return $c;
    }, $cours_arr);

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "cours" => $cours_final
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur de base de données : " . $e->getMessage()]);
}
$conn = null;
?>