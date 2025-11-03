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
require '../database.php';

// ===============================================
// 2. RÉCUPÉRATION ET VALIDATION DES PARAMÈTRES
// ===============================================

// ID du formateur est passé dans l'URL: ?id_formateur=1
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
// 3. RÉCUPÉRATION DES COURS
// ===============================================

$query = "SELECT * 
          FROM COURS 
          WHERE id_formateur = :id_formateur 
          ORDER BY date_creation DESC";

$stmt = $conn->prepare($query);
$stmt->bindParam(':id_formateur', $id_formateur, PDO::PARAM_INT);

try {
    $stmt->execute();
    $num = $stmt->rowCount();

    if ($num > 0) {
        $cours_arr = array();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            extract($row);
            
            $cours_item = array(
                "id_cours" => $id_cours,
                "titre" => $titre,
                "description" => $description,
                "photo" => $photo,
                "dateCreation" => $date_creation,
                "est_publie" => $est_publie
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
        http_response_code(404); // Not Found
        echo json_encode(["message" => "Aucun cours trouvé pour ce formateur."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur de base de données lors de la récupération des cours: " . $e->getMessage()]);
}
?>