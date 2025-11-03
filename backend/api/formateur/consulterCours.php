<?php
// Fichier: consulterCours.php (Version Finale Corrigée)

// Headers CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Configuration BDD
require '../config/database.php';


// Validation de l'ID du cours
if (!isset($_GET['id_cours']) || !is_numeric($_GET['id_cours'])) {
    http_response_code(400);
    echo json_encode(["message" => "ID de cours manquant ou invalide."]);
    exit();
}

$id_cours = (int)$_GET['id_cours'];
$course_data = [];

try {
    // 1. Récupérer les informations du Cours
    $query_cours = "SELECT * FROM cours WHERE id_cours = :id_cours";
    $stmt_cours = $conn->prepare($query_cours);
    $stmt_cours->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);
    $stmt_cours->execute();
    $course_data = $stmt_cours->fetch(PDO::FETCH_ASSOC);

    if (!$course_data) {
        http_response_code(404);
        echo json_encode(["message" => "Cours non trouvé."]);
        exit();
    }
    
    $course_data['lecons'] = [];
    $course_data['quiz'] = [];

    // 2. Récupérer les Leçons (Triées par ordre)
    $query_lecons = "SELECT id_lecon, titre_lecon, contenu, ordre 
        FROM lecon 
        WHERE id_cours = :id_cours 
        ORDER BY ordre ASC
    ";
    $stmt_lecons = $conn->prepare($query_lecons);
    $stmt_lecons->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);
    $stmt_lecons->execute();
    $course_data['lecons'] = $stmt_lecons->fetchAll(PDO::FETCH_ASSOC);
    
    // 3. Récupérer les Quiz
    $query_quiz = "SELECT id_quiz, titre_quiz FROM quiz WHERE id_cours = :id_cours ORDER BY ordre ASC";
    $stmt_quiz = $conn->prepare($query_quiz);
    $stmt_quiz->bindParam(':id_cours', $id_cours, PDO::PARAM_INT);
    $stmt_quiz->execute();
    $quiz_list = $stmt_quiz->fetchAll(PDO::FETCH_ASSOC);

    // 4. Récupérer les Questions et leurs Propositions
    foreach ($quiz_list as $index => $quiz) {
        $id_quiz = $quiz['id_quiz'];
        $quiz_list[$index]['questions'] = [];
        
        // 🛑 Utilisation des tables 'question' et 'proposition'
        $query_questions = "
            SELECT 
                Q.id_question, Q.texte_question,
                P.id_proposition, P.texte_proposition, P.est_correct
            FROM question Q
            LEFT JOIN proposition P ON Q.id_question = P.id_question
            WHERE Q.id_quiz = :id_quiz
        ";
        $stmt_questions = $conn->prepare($query_questions);
        $stmt_questions->bindParam(':id_quiz', $id_quiz, PDO::PARAM_INT);
        $stmt_questions->execute();
        $results = $stmt_questions->fetchAll(PDO::FETCH_ASSOC);
        
        $questions = [];
        foreach ($results as $row) {
            $qid = $row['id_question'];
            
            // Initialiser la question si elle n'existe pas encore
            if (!isset($questions[$qid])) {
                $questions[$qid] = [
                    'id_question' => $qid,
                    'question_texte' => $row['texte_question'], // Renommée pour le front
                    'propositions' => [] // Liste pour les options de réponse
                ];
            }
            
            // Ajouter la proposition si elle existe
            if ($row['id_proposition']) {
                $questions[$qid]['propositions'][] = [
                    'id_proposition' => $row['id_proposition'],
                    'texte_proposition' => $row['texte_proposition'],
                    'est_correct' => (bool)$row['est_correct'] // Convertir en booléen
                ];
            }
        }
        $quiz_list[$index]['questions'] = array_values($questions); // Réindexer et assigner
    }
    
    $course_data['quiz'] = $quiz_list;

    // Réponse finale
    http_response_code(200);
    echo json_encode(["message" => "Détails du cours chargés.", "cours" => $course_data]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur BDD lors du chargement des détails : " . $e->getMessage()]);
}
?>