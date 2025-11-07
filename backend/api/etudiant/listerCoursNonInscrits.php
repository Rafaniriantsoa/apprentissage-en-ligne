<?php
// backend/api/etudiant/listerCoursNonInscrits.php
// ===================================================
// API pour lister tous les cours publiés SAUF ceux auxquels l'étudiant est inscrit.
// ===================================================
header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS"); 
header("Access-Control-Max-Age: 3600");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Méthode non autorisée. Seul GET est accepté."]);
    exit();
}

require '../database.php'; // Assurez-vous que le chemin vers votre fichier de connexion est correct

// ===============================================
// 2. RÉCUPÉRATION ET VALIDATION DES PARAMÈTRES
// ===============================================

if (empty($_GET['id_utilisateur'])) {
    http_response_code(400); 
    echo json_encode(["success" => false, "message" => "L'ID utilisateur est requis."]);
    exit();
}

$id_utilisateur = htmlspecialchars(strip_tags($_GET['id_utilisateur']));

// ===============================================
// 3. LOGIQUE DE FILTRAGE PAR COURS NON INSCRITS
// ===============================================

$query = "
    SELECT 
        c.id_cours, 
        c.titre, 
        c.description, 
        c.photo, 
        c.date_creation,
        u.nom_complet AS formateur
    FROM 
        COURS c
    JOIN 
        UTILISATEUR u ON c.id_formateur = u.id_utilisateur
    WHERE 
        c.est_publie = 1
        AND c.id_cours NOT IN (
            SELECT id_cours 
            FROM INSCRIPTION 
            WHERE id_utilisateur = :id_utilisateur
        )
    ORDER BY 
        c.date_creation DESC";

$stmt = $conn->prepare($query);
$stmt->bindParam(':id_utilisateur', $id_utilisateur, PDO::PARAM_INT);

try {
    $stmt->execute();
    $num = $stmt->rowCount();
    $cours_arr = [];

    if ($num > 0) {
        $cours_arr = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Cours non inscrits récupérés avec succès.",
            "nombre_cours" => $num,
            "cours" => $cours_arr
        ]);
        
    } else {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Vous êtes inscrit(e) à tous les cours disponibles, ou aucun autre cours n'est publié.",
            "nombre_cours" => 0,
            "cours" => []
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erreur de base de données: " . $e->getMessage()]);
}
$conn = null;
?>