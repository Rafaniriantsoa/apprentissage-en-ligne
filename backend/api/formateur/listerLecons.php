<?php
// ===================================================
// 1. GESTION DES HEADERS CORS (DOIT ÊTRE EN PREMIER)
// ===================================================

// Autorise tout domaine (ou remplacer * par http://localhost:5173 pour plus de sécurité)
header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS"); // GET pour la lecture
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Gérer la requête OPTIONS (pré-vol) envoyée par le navigateur avant la requête réelle
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); 
    exit(); 
}

// ===================================================
// 2. LOGIQUE DE CONNEXION ET RÉCUPÉRATION DES DONNÉES
// ===================================================

require '../database.php';

// Récupération de l'ID du cours depuis les paramètres GET de l'URL
$id_cours = $_GET['id_cours'] ?? null;

if (empty($id_cours)) {
    http_response_code(400); 
    echo json_encode(["message" => "L'ID du cours est requis."]);
    exit();
}

// Récupération des leçons pour ce cours, triées par ordre
$query = "SELECT id_lecon, id_formateur, titre_lecon, contenu, ordre, date_creation 
          FROM LECON 
          WHERE id_cours = :id_cours
          ORDER BY ordre ASC"; 
          
$stmt = $conn->prepare($query);
$stmt->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);

try {
    $stmt->execute();
    $lecons = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        "message" => "Leçons récupérées avec succès.",
        "lecons" => $lecons
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur de base de données lors de la récupération des leçons : " . $e->getMessage()]);
}
?>