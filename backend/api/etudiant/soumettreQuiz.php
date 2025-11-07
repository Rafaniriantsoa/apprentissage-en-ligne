<?php
// backend/api/etudiant/soumettreQuiz.php
// ===================================================
// 1. CONFIGURATION DE L'API
// ===================================================

header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS"); 
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); 
    exit(); 
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Méthode non autorisée. Seul POST est accepté."]);
    exit();
}

// --- Paramètres de connexion MySQL ---
require '../database.php';

// ===============================================
// 2. RÉCUPÉRATION ET VALIDATION DES DONNÉES
// ===============================================

$data = json_decode(file_get_contents("php://input"));

if (empty($data->id_utilisateur) || empty($data->id_quiz) || empty($data->reponses)) {
    http_response_code(400); 
    echo json_encode(["success" => false, "message" => "Données manquantes (utilisateur, quiz ou réponses)."]);
    exit();
}

$id_utilisateur = (int) $data->id_utilisateur;
$id_quiz = (int) $data->id_quiz;
$reponses_utilisateur = $data->reponses;

$SEUIL_REUSSITE = 0.7; // 70% pour réussir

// ===============================================
// 3. LOGIQUE DE NOTATION ET ENREGISTREMENT
// ===============================================

$conn->beginTransaction();
$score = 0;
$total_questions = 0;

try {
    // 3.1 Récupérer les informations clés du quiz
    $query_quiz_info = "SELECT q.titre_quiz, q.id_cours
                        FROM QUIZ q
                        WHERE q.id_quiz = :id_quiz";
    $stmt_quiz_info = $conn->prepare($query_quiz_info);
    $stmt_quiz_info->bindParam(':id_quiz', $id_quiz, PDO::PARAM_INT);
    $stmt_quiz_info->execute();
    $quiz_info = $stmt_quiz_info->fetch(PDO::FETCH_ASSOC);

    if (!$quiz_info) {
        throw new Exception("Quiz introuvable.");
    }
    $titre_quiz = $quiz_info['titre_quiz'];
    $id_cours = $quiz_info['id_cours'];
    
    // 3.2 Supprimer les anciennes tentatives (pour ne garder que la dernière)
    $query_delete_reponses = "DELETE FROM reponse_utilisateur 
                              WHERE id_utilisateur = :id_utilisateur 
                              AND id_question IN (SELECT id_question FROM question WHERE id_quiz = :id_quiz)";
    $stmt_delete_reponses = $conn->prepare($query_delete_reponses);
    $stmt_delete_reponses->bindParam(':id_utilisateur', $id_utilisateur, PDO::PARAM_INT);
    $stmt_delete_reponses->bindParam(':id_quiz', $id_quiz, PDO::PARAM_INT);
    $stmt_delete_reponses->execute();

    $query_delete_resultat = "DELETE FROM resultat_quiz WHERE id_utilisateur = :id_utilisateur AND id_quiz = :id_quiz";
    $stmt_delete_resultat = $conn->prepare($query_delete_resultat);
    $stmt_delete_resultat->bindParam(':id_utilisateur', $id_utilisateur, PDO::PARAM_INT);
    $stmt_delete_resultat->bindParam(':id_quiz', $id_quiz, PDO::PARAM_INT);
    $stmt_delete_resultat->execute();


    // 3.3 Parcourir les réponses de l'utilisateur pour notation
    foreach ($reponses_utilisateur as $reponse) {
        $id_question = (int) $reponse->id_question;
        $id_proposition_choisie = (int) $reponse->id_proposition_choisie;
        $total_questions++;

        // Récupérer la proposition correcte pour cette question
        $query_correcte = "SELECT id_proposition 
                           FROM PROPOSITION 
                           WHERE id_question = :id_question 
                           AND est_correct = 1  /* ✅ CORRECTION : 'est_correct' au lieu de 'est_correcte' */
                           LIMIT 1";
        $stmt_correcte = $conn->prepare($query_correcte);
        $stmt_correcte->bindParam(':id_question', $id_question, PDO::PARAM_INT);
        $stmt_correcte->execute();
        $proposition_correcte = $stmt_correcte->fetch(PDO::FETCH_ASSOC);
        
        $est_correct = 0;
        if ($proposition_correcte && $proposition_correcte['id_proposition'] == $id_proposition_choisie) {
            $score++;
            $est_correct = 1;
        }

        // Enregistrer la réponse de l'utilisateur
        $query_insert_reponse = "INSERT INTO reponse_utilisateur 
                                 (id_utilisateur, id_question, id_proposition_choisie, est_correct) 
                                 VALUES (:idu, :idq, :idpc, :estc)";
        $stmt_insert_reponse = $conn->prepare($query_insert_reponse);
        $stmt_insert_reponse->bindParam(':idu', $id_utilisateur, PDO::PARAM_INT);
        $stmt_insert_reponse->bindParam(':idq', $id_question, PDO::PARAM_INT);
        $stmt_insert_reponse->bindParam(':idpc', $id_proposition_choisie, PDO::PARAM_INT);
        $stmt_insert_reponse->bindParam(':estc', $est_correct, PDO::PARAM_INT);
        $stmt_insert_reponse->execute();
    }

    // 3.4 Calcul et enregistrement du résultat final
    $pourcentage_score = $total_questions > 0 ? $score / $total_questions : 0;
    $succes = $pourcentage_score >= $SEUIL_REUSSITE ? 1 : 0; // 1 si réussi, 0 sinon
    $note = $score; // Score brut (nombre de bonnes réponses)

    // ✅ Insertion du statut 'reussi' dans la table
    $query_insert_resultat = "INSERT INTO resultat_quiz 
                              (id_utilisateur, id_quiz, score_obtenu, reussi) 
                              VALUES (:idu, :idq, :score, :reussi)";
    $stmt_insert_resultat = $conn->prepare($query_insert_resultat);
    $stmt_insert_resultat->bindParam(':idu', $id_utilisateur, PDO::PARAM_INT);
    $stmt_insert_resultat->bindParam(':idq', $id_quiz, PDO::PARAM_INT);
    $stmt_insert_resultat->bindParam(':score', $note, PDO::PARAM_INT); 
    $stmt_insert_resultat->bindParam(':reussi', $succes, PDO::PARAM_INT); 
    $stmt_insert_resultat->execute();

    // 3.5 Mettre à jour le statut d'inscription si le cours est validé par le quiz
    if ($succes) {
        $query_update_inscription = "UPDATE INSCRIPTION 
                                     SET statut = 'Terminé' 
                                     WHERE id_utilisateur = :idu AND id_cours = :idc AND statut = 'En cours'";
        $stmt_update_inscription = $conn->prepare($query_update_inscription);
        $stmt_update_inscription->bindParam(':idu', $id_utilisateur, PDO::PARAM_INT);
        $stmt_update_inscription->bindParam(':idc', $id_cours, PDO::PARAM_INT);
        $stmt_update_inscription->execute();
    }

    $conn->commit();

    // ===============================================
    // 4. RÉPONSE FINALE
    // ===============================================
    
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Quiz soumis avec succès.",
        "resultat" => [
            "titre_quiz" => $titre_quiz,
            "id_cours" => $id_cours,
            "score_obtenu" => $note,
            "total_questions" => $total_questions,
            "pourcentage" => round($pourcentage_score * 100),
            "succes" => (bool)$succes
        ]
    ]);

} catch (Exception $e) {
    $conn->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erreur lors du traitement du quiz: " . $e->getMessage()]);
}
?>