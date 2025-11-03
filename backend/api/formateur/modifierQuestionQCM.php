<?php
// Headers CORS
header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

// Configuration BDD
// $host = "localhost"; $db_name = "projet"; $username = "root"; $password = "";
// try {
//     $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
//     $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
// } catch (PDOException $exception) {
//     http_response_code(500); 
//     echo json_encode(["message" => "Erreur de connexion à la base de données: " . $exception->getMessage()]); 
//     exit();
// }

require '../database.php';

// Récupération des données JSON
$data = json_decode(file_get_contents("php://input"));

// Validation des données
if (empty($data->id_question) || empty($data->texte_question) || empty($data->propositions) || !is_array($data->propositions)) {
    http_response_code(400); 
    echo json_encode(["message" => "Données incomplètes. ID de question, texte, ou propositions manquants."]); 
    exit();
}

$id_question = filter_var($data->id_question, FILTER_VALIDATE_INT);
$texte_question = trim(filter_var($data->texte_question, FILTER_SANITIZE_STRING));
$propositions = $data->propositions;

// Vérification qu'il y a exactement une réponse correcte
$correctCount = 0;
foreach ($propositions as $prop) {
    if (isset($prop->est_correct) && $prop->est_correct) {
        $correctCount++;
    }
}

if ($correctCount !== 1) {
    http_response_code(400); 
    echo json_encode(["message" => "Le QCM doit contenir exactement une et une seule bonne réponse."]); 
    exit();
}

// --- Début de la Transaction ---
// La transaction garantit que si une partie échoue (même l'ajout d'une proposition),
// toutes les modifications précédentes sont annulées.
$conn->beginTransaction();

try {
    // 1. Mise à jour du texte de la Question
    $query_update_q = "UPDATE QUESTION SET texte_question = :texte_question WHERE id_question = :id_question";
    $stmt_update_q = $conn->prepare($query_update_q);
    $stmt_update_q->bindParam(':texte_question', $texte_question);
    $stmt_update_q->bindParam(':id_question', $id_question);
    $stmt_update_q->execute();

    // 2. Suppression de toutes les anciennes Propositions
    // NOTE: Cela ne supprime PAS les REPONSE_UTILISATEUR, car elles sont liées à QUESTION (et non PROPOSITION)
    $query_delete_p = "DELETE FROM PROPOSITION WHERE id_question = :id_question";
    $stmt_delete_p = $conn->prepare($query_delete_p);
    $stmt_delete_p->bindParam(':id_question', $id_question);
    $stmt_delete_p->execute();

    // 3. Insertion des nouvelles/mises à jour Propositions
    $query_insert_p = "INSERT INTO PROPOSITION (id_question, texte_proposition, est_correct) VALUES (:id_question, :texte_proposition, :est_correct)";
    $stmt_insert_p = $conn->prepare($query_insert_p);
    
    foreach ($propositions as $prop) {
        if (!empty(trim($prop->texte_proposition))) {
            $texte_proposition = trim(filter_var($prop->texte_proposition, FILTER_SANITIZE_STRING));
            $est_correct = (isset($prop->est_correct) && $prop->est_correct) ? 1 : 0; // Convertir BOOLEAN en 1/0
            
            $stmt_insert_p->bindParam(':id_question', $id_question);
            $stmt_insert_p->bindParam(':texte_proposition', $texte_proposition);
            $stmt_insert_p->bindParam(':est_correct', $est_correct);
            $stmt_insert_p->execute();
        }
    }
    
    // Si tout est OK, valider la transaction
    $conn->commit();
    
    http_response_code(200);
    echo json_encode(["message" => "Question QCM modifiée avec succès.", "id_question" => $id_question]);

} catch (PDOException $e) {
    // En cas d'erreur, annuler toutes les insertions/suppressions/mises à jour
    $conn->rollBack();
    http_response_code(500);
    echo json_encode(["message" => "Échec de la modification du QCM. " . $e->getMessage()]);
}

?>