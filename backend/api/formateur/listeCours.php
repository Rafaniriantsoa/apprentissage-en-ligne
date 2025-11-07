<?php
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
// Assurez-vous que le fichier 'database.php' contient la connexion $conn PDO.
require '../database.php';

// ===============================================
// 2. RÉCUPÉRATION ET VALIDATION DES PARAMÈTRES
// ===============================================

if (empty($_GET['id_formateur'])) {
    http_response_code(400); 
    echo json_encode(["message" => "Veuillez fournir l'ID du formateur."]);
    exit();
}

$id_formateur = filter_var($_GET['id_formateur'], FILTER_VALIDATE_INT);

if (!$id_formateur) {
    http_response_code(400); 
    echo json_encode(["message" => "ID formateur invalide."]);
    exit();
}


// ===============================================
// 3. RÉCUPÉRATION DES COURS ET STATISTIQUES
// ===============================================

$query = "
    SELECT 
        c.id_cours,
        c.titre,
        c.description,
        c.photo,
        c.est_publie,
        c.date_creation,
        
        -- Compte le nombre de leçons (en utilisant la table lecon)
        COUNT(DISTINCT l.id_lecon) AS nombre_lecons,
        
        -- Compte le nombre d'étudiants inscrits (en utilisant la table inscription)
        COUNT(DISTINCT i.id_utilisateur) AS nombre_etudiants,
        
        -- Calcule la note moyenne (en utilisant la table note)
        ROUND(AVG(n.valeur), 1) AS note_moyenne
        
    FROM 
        cours c
    LEFT JOIN 
        lecon l ON c.id_cours = l.id_cours
    LEFT JOIN 
        inscription i ON c.id_cours = i.id_cours
    LEFT JOIN
        note n ON c.id_cours = n.id_cours
    WHERE 
        c.id_formateur = :id_formateur 
    GROUP BY
        c.id_cours, c.titre, c.description, c.photo, c.est_publie, c.date_creation 
    ORDER BY 
        c.date_creation DESC
";

$stmt = $conn->prepare($query);
$stmt->bindParam(':id_formateur', $id_formateur, PDO::PARAM_INT);

try {
    $stmt->execute();
    $num = $stmt->rowCount();

    if ($num > 0) {
        $cours_arr = array();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // Assurez-vous que les nombres sont des entiers (pour leçons/étudiants) ou float (pour la moyenne)
            $nombre_lecons = (int) $row['nombre_lecons'];
            $nombre_etudiants = (int) $row['nombre_etudiants'];
            $note_moyenne = $row['note_moyenne'] !== null ? (float) $row['note_moyenne'] : 0.0;
            
            $cours_item = array(
                "id_cours" => (int) $row['id_cours'],
                "titre" => $row['titre'],
                "description" => $row['description'],
                "photo" => $row['photo'],
                "dateCreation" => $row['date_creation'],
                "est_publie" => (int) $row['est_publie'],
                
                // Nouveaux champs statistiques
                "nombre_lecons" => $nombre_lecons,
                "nombre_etudiants" => $nombre_etudiants,
                "note_moyenne" => $note_moyenne 
            );
            array_push($cours_arr, $cours_item);
        }

        http_response_code(200);
        echo json_encode([
            "message" => "Cours récupérés avec succès.",
            "nombre_cours" => $num,
            "cours" => $cours_arr
        ]);
        
    } else {
        // Retourne 200 OK avec un tableau vide si aucun cours n'est trouvé, car ce n'est pas une erreur côté serveur.
        http_response_code(200); 
        echo json_encode([
            "message" => "Aucun cours trouvé pour ce formateur.",
            "nombre_cours" => 0,
            "cours" => []
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    // Loggez l'erreur pour le débogage, mais n'exposez pas les détails à l'utilisateur final.
    error_log("Erreur BD listeCours: " . $e->getMessage()); 
    echo json_encode(["message" => "Erreur interne du serveur lors de la récupération des cours."]);
}
?>