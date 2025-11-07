<?php
// listerCoursPublics.php

// ===================================================
// 1. CONFIGURATION DE L'API
// ===================================================

header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS"); 
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); 
    exit(); 
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["message" => "Méthode non autorisée. Seul GET est accepté."]);
    exit();
}

// --- Paramètres de connexion MySQL ---
require '../database.php'; 

// ===============================================
// 2. RÉCUPÉRATION DES COURS PUBLIÉS
// ===============================================

$query = "SELECT 
            c.id_cours, 
            c.titre, 
            c.description, 
            c.photo, 
            c.date_creation,
            u.nom_complet AS formateur,      /* Nom du Formateur */
            u.photo AS photo_formateur       /* CORRIGÉ : utilise 'photo' de la table utilisateur */
          FROM COURS c
          JOIN UTILISATEUR u ON c.id_formateur = u.id_utilisateur
          WHERE c.est_publie = 1
          ORDER BY c.date_creation DESC";

$stmt = $conn->prepare($query);

try {
    $stmt->execute();
    $num = $stmt->rowCount();

    if ($num > 0) {
        $cours_arr = array();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            
            $cours_item = array(
                "id_cours"        => $row['id_cours'],
                "titre"           => $row['titre'],
                "description"     => $row['description'],
                "photo"           => $row['photo'],
                "dateCreation"    => $row['date_creation'],
                // REMARQUE: 'categorie' a été retiré car il n'existe pas dans la table COURS
                "formateur"       => $row['formateur'] ,
                "photo_formateur" => $row['photo_formateur'] // 'photo_formateur' est l'alias de 'u.photo'
            );
            array_push($cours_arr, $cours_item);
        }

        http_response_code(200);
        echo json_encode([
            "message" => "Cours publics récupérés avec succès.",
            "nombre_cours" => $num,
            "cours" => $cours_arr
        ]);
        
    } else {
        http_response_code(404); 
        echo json_encode(["message" => "Aucun cours publié pour le moment."]);
    }

} catch (PDOException $e) {
    http_response_code(500); 
    echo json_encode(["message" => "Erreur de base de données: " . $e->getMessage()]);
}
?>