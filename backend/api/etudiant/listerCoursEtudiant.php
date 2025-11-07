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
// Assurez-vous que ce chemin est correct pour votre fichier de connexion à la BDD
require '../database.php'; 

// ===============================================
// 2. RÉCUPÉRATION ET VALIDATION DES PARAMÈTRES
// ===============================================

if (empty($_GET['id_utilisateur'])) {
    http_response_code(400); 
    echo json_encode(["message" => "Veuillez fournir l'ID de l'utilisateur."]);
    exit();
}

$id_utilisateur = htmlspecialchars(strip_tags($_GET['id_utilisateur']));

// ===============================================
// 3. REQUÊTE SQL AVEC CALCUL DE PROGRESSION
// ===============================================

$query = "
    SELECT
        c.id_cours,
        c.titre,
        c.description,
        c.photo,
        u.nom_complet AS formateur,
        i.date_inscription,
        (CASE WHEN i.id_utilisateur IS NOT NULL THEN TRUE ELSE FALSE END) AS est_inscrit,
        
        -- Calcul du pourcentage de progression
        (CASE
            -- 1. Si l'utilisateur a un résultat dans resultat_quiz pour ce cours, la progression est 100%
            WHEN EXISTS (
                SELECT 1
                FROM resultat_quiz rq
                JOIN quiz q ON rq.id_quiz = q.id_quiz
                WHERE q.id_cours = c.id_cours AND rq.id_utilisateur = :id_utilisateur_quiz
            ) THEN 100
            
            -- 2. Sinon, on utilise le calcul basé sur les leçons vues (PROGRESSION)
            ELSE
                CAST(
                    (
                        (SELECT COUNT(p.id_lecon)
                         FROM PROGRESSION p JOIN LECON l ON p.id_lecon = l.id_lecon
                         WHERE l.id_cours = c.id_cours AND p.id_utilisateur = :id_utilisateur_lecon AND p.etat_lecon = 'Terminée'
                        )
                        * 100
                    ) /
                    NULLIF((SELECT COUNT(id_lecon) FROM LECON WHERE id_cours = c.id_cours), 0)
                    AS DECIMAL(5, 0) -- On arrondit à l'entier pour l'affichage (ex: 33.33 devient 33)
                )
        END) AS progression_pourcentage
        
    FROM
        cours c
    JOIN
        utilisateur u ON c.id_formateur = u.id_utilisateur
    LEFT JOIN
        inscription i ON c.id_cours = i.id_cours AND i.id_utilisateur = :id_utilisateur_inscription
    WHERE
        c.est_publie = 1
    ORDER BY
        i.date_inscription DESC, c.date_creation DESC
";

$stmt = $conn->prepare($query);

// Liaison des paramètres. :id_utilisateur doit être lié 3 fois.
$stmt->bindParam(':id_utilisateur_quiz', $id_utilisateur, PDO::PARAM_INT);
$stmt->bindParam(':id_utilisateur_lecon', $id_utilisateur, PDO::PARAM_INT);
$stmt->bindParam(':id_utilisateur_inscription', $id_utilisateur, PDO::PARAM_INT);

try {
    $stmt->execute();
    $num = $stmt->rowCount();

    if ($num > 0) {
        $cours_arr = array();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // Conversion de la progression en entier pour le JSON
            $row['progression_pourcentage'] = (int)$row['progression_pourcentage'];
            
            // On ne renvoie pas la colonne 'est_inscrit' directement dans le cours_item
            // car elle n'est utilisée que pour le filtre côté React.
            
            $cours_item = array(
                "id_cours" => $row['id_cours'],
                "titre" => $row['titre'],
                "description" => $row['description'],
                "photo" => $row['photo'],
                "formateur" => $row['formateur'],
                "date_inscription" => $row['date_inscription'],
                "progression_pourcentage" => $row['progression_pourcentage'], // Nouvelle donnée
                "est_inscrit" => (bool)$row['est_inscrit'] // Utilisé pour filtrer dans Accueil.jsx
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
        http_response_code(200);
        echo json_encode([
            "message" => "Aucun cours trouvé.",
            "nombre_cours" => 0,
            "cours" => []
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur de base de données : " . $e->getMessage()]);
}

// Fermeture de la connexion
$conn = null;
?>