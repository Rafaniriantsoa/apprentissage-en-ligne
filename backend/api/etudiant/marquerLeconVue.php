<?php
// backend/api/etudiant/marquerLeconVue.php
// ===================================================
// API pour marquer une leçon comme terminée dans la table 'progression'
// ===================================================
header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS"); 
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(["message" => "Méthode non autorisée. Seul POST est accepté."]); exit(); }

require '../database.php'; 

$data = json_decode(file_get_contents("php://input"));

if (empty($data->id_utilisateur) || empty($data->id_lecon) || empty($data->id_cours)) { 
    http_response_code(400); 
    echo json_encode(["message" => "Les IDs utilisateur, leçon et cours sont requis."]); 
    exit(); 
}

$id_utilisateur = htmlspecialchars(strip_tags($data->id_utilisateur));
$id_lecon = htmlspecialchars(strip_tags($data->id_lecon));
$id_cours = htmlspecialchars(strip_tags($data->id_cours));


try {
    // 1. Marquer la leçon comme 'Terminée'
    $query_mark = "INSERT INTO progression (id_utilisateur, id_lecon, etat_lecon) 
                   VALUES (:idu, :idl, 'Terminée') 
                   ON DUPLICATE KEY UPDATE etat_lecon = 'Terminée'";
    
    $stmt_mark = $conn->prepare($query_mark);
    $stmt_mark->bindParam(':idu', $id_utilisateur, PDO::PARAM_INT);
    $stmt_mark->bindParam(':idl', $id_lecon, PDO::PARAM_INT);
    $stmt_mark->execute();
    
    
    // 2. Calculer la nouvelle progression
    
    // Total des leçons (pour ce cours)
    $query_total = "SELECT COUNT(id_lecon) FROM lecon WHERE id_cours = :idc";
    $stmt_total = $conn->prepare($query_total);
    $stmt_total->bindParam(':idc', $id_cours, PDO::PARAM_INT);
    $stmt_total->execute();
    $total_lecons = (int)$stmt_total->fetchColumn();

    // Leçons vues (CORRIGÉ : filtré sur l'id_cours)
    $query_vues = "SELECT COUNT(p.id_lecon) 
                   FROM progression p
                   JOIN lecon l ON p.id_lecon = l.id_lecon
                   WHERE p.id_utilisateur = :idu AND l.id_cours = :idc"; // <--- Filtre essentiel
    $stmt_vues = $conn->prepare($query_vues);
    $stmt_vues->bindParam(':idu', $id_utilisateur, PDO::PARAM_INT);
    $stmt_vues->bindParam(':idc', $id_cours, PDO::PARAM_INT);
    $stmt_vues->execute();
    $lecons_vues_count = (int)$stmt_vues->fetchColumn();

    $progression_pourcentage = ($total_lecons > 0) 
        ? round(($lecons_vues_count / $total_lecons) * 100) 
        : 0;
        
    // 3. Mettre à jour le statut d'inscription si 100%
    if ($progression_pourcentage >= 100) {
        $query_update_statut = "UPDATE INSCRIPTION SET statut = 'Terminé' 
                                WHERE id_utilisateur = :idu AND id_cours = :idc AND statut != 'Abandonné'";
        $stmt_update = $conn->prepare($query_update_statut);
        $stmt_update->bindParam(':idu', $id_utilisateur, PDO::PARAM_INT);
        $stmt_update->bindParam(':idc', $id_cours, PDO::PARAM_INT);
        $stmt_update->execute();
    }


    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Leçon marquée comme vue.",
        "progression_pourcentage" => $progression_pourcentage,
        "lecons_vues_count" => $lecons_vues_count,
        "total_lecons" => $total_lecons
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erreur de base de données: " . $e->getMessage()]);
}
$conn = null;
?>