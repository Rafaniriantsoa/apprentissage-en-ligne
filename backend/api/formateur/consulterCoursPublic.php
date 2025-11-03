<?php
// Configuration des en-têtes CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Inclure la logique de connexion (à adapter)
function getDbConnection() {
    // REMPLACER avec vos identifiants réels
    $host = 'localhost';
    $db_name = 'projet';
    $username = 'root';
    $password = '';

    try {
        $conn = new PDO("mysql:host={$host};dbname={$db_name};charset=utf8", $username, $password);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $conn;
    } catch(PDOException $exception) {
        http_response_code(500);
        echo json_encode(["message" => "Erreur de connexion à la base de données: " . $exception->getMessage()]);
        exit();
    }
}
$database = getDbConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["message" => "Méthode non autorisée."]);
    exit();
}

// Récupération de l'ID du cours depuis l'URL
$id_cours = isset($_GET['id_cours']) ? (int)$_GET['id_cours'] : 0;

if (empty($id_cours)) {
    http_response_code(400);
    echo json_encode(["message" => "ID du cours manquant."]);
    exit();
}

try {
    // 1. Récupérer les détails du cours et du formateur (seulement si PUBLIÉ)
    $query_cours = "
        SELECT
            c.id_cours,
            c.titre,
            c.description,
            c.photo,
            c.date_creation,
            u.nom_complet AS nom_formateur
        FROM
            cours c
        INNER JOIN
            utilisateur u ON c.id_formateur = u.id_utilisateur
        WHERE
            c.id_cours = :id_cours AND c.est_publie = 1
        LIMIT 1
    ";
    $stmt_cours = $database->prepare($query_cours);
    $stmt_cours->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);
    $stmt_cours->execute();
    $cours_data = $stmt_cours->fetch(PDO::FETCH_ASSOC);

    if (!$cours_data) {
        http_response_code(404);
        echo json_encode(["message" => "Cours introuvable ou non publié."]);
        exit();
    }

    // 2. Récupérer la liste des leçons pour ce cours
    // Nous sélectionnons uniquement le titre et l'ordre pour le visiteur
    $query_lecons = "
        SELECT
            id_lecon,
            titre,
            ordre_affichage
        FROM
            lecon
        WHERE
            id_cours = :id_cours
        ORDER BY
            ordre_affichage ASC
    ";
    $stmt_lecons = $database->prepare($query_lecons);
    $stmt_lecons->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);
    $stmt_lecons->execute();
    $lecons_data = $stmt_lecons->fetchAll(PDO::FETCH_ASSOC);

    // 3. Combiner et retourner la réponse
    $response = $cours_data;
    $response['lecons'] = $lecons_data;

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Détails du cours public récupérés.",
        "cours_detail" => $response
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Erreur interne du serveur: " . $e->getMessage()
    ]);
}
?>