import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const GestionQuestions = () => {
    // --- Configuration API ---
    const API_BASE_URL = 'http://localhost/projet-plateforme/backend/api/formateur/';
    const CREATE_QUESTION_API_URL = API_BASE_URL + 'creerQuestionAvecPropositions.php'; 
    const LIST_QUESTIONS_API_URL = API_BASE_URL + 'listerQuestionsQCM.php'; 
    const MODIFY_QUESTION_API_URL = API_BASE_URL + 'modifierQuestionQCM.php'; // CIBLE
    const DELETE_QUESTION_API_URL = API_BASE_URL + 'supprimerQuestion.php'; 

    // Récupération des infos du quiz et du cours via localStorage
    const cours = JSON.parse(localStorage.getItem('cours_selectionne') || '{}');
    const quiz = JSON.parse(localStorage.getItem('quiz_selectionne') || '{}');
    
    const idQuiz = quiz.id_quiz;
    const quizTitle = quiz.titre_quiz;
    const courseTitle = cours.titre;
    
    // Initialisation des propositions pour le formulaire de création
    const INITIAL_PROPOSITIONS = [
        { texte_proposition: '', est_correct: true },
        { texte_proposition: '', est_correct: false },
    ];

    // --- États principaux ---
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- États pour la Création ---
    const [newQuestionData, setNewQuestionData] = useState({
        texte_question: '',
        propositions: INITIAL_PROPOSITIONS,
    });
    
    // --- États pour la Modification (Modale) ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [questionToEdit, setQuestionToEdit] = useState(null);
    const [editFormData, setEditFormData] = useState({ texte_question: '', propositions: [] });
    
    // --- États pour la Suppression (Modale) ---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [questionToDelete, setQuestionToDelete] = useState(null);

    // ==========================================================
    // 1. CHARGEMENT DES QUESTIONS (QCM)
    // ==========================================================

    const fetchQuestions = async () => {
        setLoading(true);
        setError('');
        
        if (!idQuiz) {
            setError("ID de Quiz manquant. Veuillez sélectionner un quiz.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${LIST_QUESTIONS_API_URL}?id_quiz=${idQuiz}`);
            setQuestions(response.data.questions || []);
        } catch (err) {
            console.error("Erreur de chargement des questions:", err.response || err);
            setError(err.response?.data?.message || "Impossible de charger les questions du quiz.");
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, [idQuiz]);


    // ==========================================================
    // 2. GESTION DE LA CRÉATION (Logique inchangée)
    // ==========================================================
    
    const handleNewQuestionChange = (e) => {
        setNewQuestionData(prevData => ({ ...prevData, texte_question: e.target.value }));
    };

    const handlePropositionChange = (index, value) => {
        const updatedPropositions = newQuestionData.propositions.map((prop, i) => (
            i === index ? { ...prop, texte_proposition: value } : prop
        ));
        setNewQuestionData(prevData => ({ ...prevData, propositions: updatedPropositions }));
    };

    const handleCorrectToggle = (index) => {
        const updatedPropositions = newQuestionData.propositions.map((prop, i) => ({
            ...prop,
            est_correct: i === index,
        }));
        setNewQuestionData(prevData => ({ ...prevData, propositions: updatedPropositions }));
    };

    const addProposition = () => {
        if (newQuestionData.propositions.length < 5) {
            setNewQuestionData(prevData => ({
                ...prevData,
                propositions: [...prevData.propositions, { texte_proposition: '', est_correct: false }]
            }));
        } else {
            setError("Maximum 5 propositions.");
        }
    };

    const removeProposition = (index) => {
        if (newQuestionData.propositions.length > 2) {
            const updatedPropositions = newQuestionData.propositions.filter((_, i) => i !== index);
            if (!updatedPropositions.some(p => p.est_correct)) {
                updatedPropositions[0].est_correct = true; 
            }
            setNewQuestionData(prevData => ({ ...prevData, propositions: updatedPropositions }));
        }
    };

    const handleCreateQuestion = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        const { texte_question, propositions } = newQuestionData;
        const validPropositions = propositions.filter(p => p.texte_proposition.trim() !== '');

        if (!texte_question.trim() || validPropositions.length < 2 || !validPropositions.some(p => p.est_correct)) {
            setError("Veuillez entrer le texte de la question et au moins deux propositions dont une correcte.");
            return;
        }
        
        setIsSubmitting(true);

        try {
            const response = await axios.post(CREATE_QUESTION_API_URL, {
                id_quiz: idQuiz,
                texte_question: texte_question.trim(),
                propositions: validPropositions,
            });

            // setSuccessMessage(response.data.message || "Question ajoutée !");
            setNewQuestionData({ texte_question: '', propositions: INITIAL_PROPOSITIONS }); 
            fetchQuestions();

        } catch (err) {
            console.error("Erreur création question:", err.response || err);
            setError(err.response?.data?.message || "Échec de la création de la question.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==========================================================
    // 3. GESTION DE LA MODIFICATION (Modale QCM - Implémentée)
    // ==========================================================

    const openEditModal = (question) => {
        setQuestionToEdit(question);
        // Utiliser une copie profonde pour éviter de modifier l'état original directement
        setEditFormData({
            texte_question: question.texte_question,
            propositions: question.propositions ? JSON.parse(JSON.stringify(question.propositions)) : [],
        });
        setIsEditModalOpen(true);
    };

    const handleEditQuestionChange = (e) => {
        setEditFormData(prevData => ({ ...prevData, texte_question: e.target.value }));
    };

    const handleEditPropositionChange = (index, value) => {
        const updatedPropositions = editFormData.propositions.map((prop, i) => (
            i === index ? { ...prop, texte_proposition: value } : prop
        ));
        setEditFormData(prevData => ({ ...prevData, propositions: updatedPropositions }));
    };

    const handleEditCorrectToggle = (index) => {
        const updatedPropositions = editFormData.propositions.map((prop, i) => ({
            ...prop,
            est_correct: i === index,
        }));
        setEditFormData(prevData => ({ ...prevData, propositions: updatedPropositions }));
    };

    const addEditProposition = () => {
        if (editFormData.propositions.length < 5) {
            setEditFormData(prevData => ({
                ...prevData,
                propositions: [...prevData.propositions, { texte_proposition: '', est_correct: false }]
            }));
        }
    };

    const removeEditProposition = (index) => {
        if (editFormData.propositions.length > 2) {
            let updatedPropositions = editFormData.propositions.filter((_, i) => i !== index);
            // Si on supprime la seule correcte, rendre la première nouvelle correcte
            if (!updatedPropositions.some(p => p.est_correct)) {
                updatedPropositions[0].est_correct = true; 
            }
            setEditFormData(prevData => ({ ...prevData, propositions: updatedPropositions }));
        }
    };
    
    const handleUpdateQuestion = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        const { texte_question, propositions } = editFormData;
        const validPropositions = propositions.filter(p => p.texte_proposition.trim() !== '');

        if (!texte_question.trim() || validPropositions.length < 2 || !validPropositions.some(p => p.est_correct)) {
            setError("Veuillez entrer le texte de la question et au moins deux propositions dont une correcte.");
            return;
        }
        
        setIsSubmitting(true);

        try {
            const response = await axios.post(MODIFY_QUESTION_API_URL, {
                id_question: questionToEdit.id_question,
                texte_question: texte_question.trim(),
                propositions: validPropositions,
            });

            setSuccessMessage(response.data.message || "Question QCM modifiée !");
            setIsEditModalOpen(false);
            setQuestionToEdit(null);
            fetchQuestions(); // Recharger la liste

        } catch (err) {
            console.error("Erreur modification question:", err.response || err);
            setError(err.response?.data?.message || "Échec de la modification de la question.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==========================================================
    // 4. GESTION DE LA SUPPRESSION (Logique inchangée)
    // ==========================================================
    
    const openDeleteModal = (question) => {
        setQuestionToDelete(question);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteQuestion = async () => {
        setError('');
        setSuccessMessage('');
        setIsSubmitting(true);

        try {
            const response = await axios.post(DELETE_QUESTION_API_URL, {
                id_question: questionToDelete.id_question
            });

            setSuccessMessage(response.data.message || "Question supprimée avec succès.");
            setIsDeleteModalOpen(false);
            setQuestionToDelete(null);
            fetchQuestions();
        } catch (err) {
            console.error("Erreur suppression question:", err.response || err);
            setError(err.response?.data?.message || "Échec de la suppression de la question.");
        } finally {
            setIsSubmitting(false);
        }
    };


    // ==========================================================
    // 5. RENDU
    // ==========================================================
    
    if (loading) return <div className="text-center p-10">Chargement des questions...</div>;
    
    return (
        <div className="max-w-6xl mx-auto p-6 mt-10">
            <Link to="/gerer-quiz" className="text-indigo-600 hover:underline mb-4 block">
                ← Retour à la gestion des quiz
            </Link>

            <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Gestion des Questions QCM
            </h2>
            <h3 className="text-xl text-orange-700 mb-6 border-b pb-2">
                Quiz : **{quizTitle}** du cours : *{courseTitle}*
            </h3>
            
            {successMessage && <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">{successMessage}</div>}
            {/* {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>} */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Colonne de Création de Question QCM (Rendu simplifié) */}
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-xl border border-gray-100 h-fit">
                    <h4 className="text-2xl font-semibold mb-4 text-orange-700">
                        Ajouter une Question QCM
                    </h4>
                    <form onSubmit={handleCreateQuestion} className="space-y-4">
                        <div>
                            <label htmlFor="texte_question" className="block text-sm font-medium text-gray-700">Texte de la Question</label>
                            <textarea
                                name="texte_question"
                                id="texte_question"
                                value={newQuestionData.texte_question}
                                onChange={handleNewQuestionChange}
                                rows="3"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                required
                            />
                        </div>

                        {/* Zone des Propositions de Création */}
                        <div className="space-y-2 border p-3 rounded-md bg-gray-50">
                            <label className="block text-sm font-bold text-gray-700">Propositions (Cocher la Correcte)</label>
                            
                            {newQuestionData.propositions.map((prop, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="correct_answer"
                                        checked={prop.est_correct}
                                        onChange={() => handleCorrectToggle(index)}
                                        className="form-radio text-green-600 h-4 w-4"
                                    />
                                    <input
                                        type="text"
                                        placeholder={`Option ${index + 1}`}
                                        value={prop.texte_proposition}
                                        onChange={(e) => handlePropositionChange(index, e.target.value)}
                                        className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                                        required
                                    />
                                    {newQuestionData.propositions.length > 2 && (
                                        <button 
                                            type="button" 
                                            onClick={() => removeProposition(index)}
                                            className="text-red-500 hover:text-red-700 text-lg"
                                        >
                                            &times;
                                        </button>
                                    )}
                                </div>
                            ))}
                            
                            {newQuestionData.propositions.length < 5 && (
                                <button 
                                    type="button" 
                                    onClick={addProposition}
                                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-2"
                                >
                                    + Ajouter une option
                                </button>
                            )}
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isSubmitting || !newQuestionData.texte_question.trim() || newQuestionData.propositions.filter(p => p.texte_proposition.trim() !== '').length < 2 || !newQuestionData.propositions.some(p => p.est_correct)}
                            className="w-full px-4 py-2 text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:bg-orange-400 transition duration-150"
                        >
                            {isSubmitting ? 'Ajout...' : 'Ajouter la Question'}
                        </button>
                    </form>
                </div>

                {/* Colonne des Questions existantes QCM (Rendu inchangé) */}
                <div className="lg:col-span-2">
                    <h4 className="text-2xl font-semibold mb-4 text-gray-700">
                        Liste des Questions ({questions.length})
                    </h4>
                    
                    {
                    questions.length === 0 ? (
                        <div className="p-6 bg-gray-100 rounded-lg text-center text-gray-500">
                            Aucune question n'a été ajoutée à ce quiz.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {questions.map((question, index) => (
                                <div key={question.id_question} className="p-4 bg-white rounded-lg shadow flex flex-col justify-between border-l-4 border-orange-500">
                                    <div className="flex-grow pr-4">
                                        <p className="font-bold text-lg text-gray-800 mb-2">
                                            Q{index + 1}: {question.texte_question}
                                        </p>
                                        <div className="space-y-1">
                                            {question.propositions && question.propositions.map((prop) => (
                                                <p key={prop.id_proposition} className={`text-sm p-1 rounded ${prop.est_correct ? 'bg-green-100 text-green-700 border border-green-300 font-semibold' : 'text-gray-600 bg-gray-50'}`}>
                                                    {prop.est_correct ? '✅ Réponse Correcte: ' : '• Option: '}
                                                    {prop.texte_proposition}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 mt-3 self-end">
                                        <button 
                                            onClick={() => openEditModal(question)}
                                            className="px-3 py-1 text-sm text-white bg-indigo-500 rounded-md hover:bg-indigo-600"
                                        >
                                            Modifier
                                        </button>
                                        <button 
                                            onClick={() => openDeleteModal(question)}
                                            className="px-3 py-1 text-sm text-white bg-red-500 rounded-md hover:bg-red-600"
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODALE DE MODIFICATION (COMPLETÉE) --- */}
            {isEditModalOpen && questionToEdit && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-4 text-indigo-700">
                            Modifier le QCM #{questionToEdit.id_question}
                        </h3>
                        <form onSubmit={handleUpdateQuestion} className="space-y-4">
                            
                            <div>
                                <label htmlFor="edit_texte_question" className="block text-sm font-medium text-gray-700">Texte de la Question</label>
                                <textarea
                                    name="edit_texte_question"
                                    id="edit_texte_question"
                                    value={editFormData.texte_question}
                                    onChange={handleEditQuestionChange}
                                    rows="3"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                    required
                                />
                            </div>

                            {/* Zone des Propositions d'Édition */}
                            <div className="space-y-2 border p-3 rounded-md bg-gray-50">
                                <label className="block text-sm font-bold text-gray-700">Propositions (Cocher la Correcte)</label>
                                
                                {editFormData.propositions.map((prop, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="edit_correct_answer"
                                            checked={prop.est_correct}
                                            onChange={() => handleEditCorrectToggle(index)}
                                            className="form-radio text-green-600 h-4 w-4"
                                        />
                                        <input
                                            type="text"
                                            placeholder={`Option ${index + 1}`}
                                            value={prop.texte_proposition}
                                            onChange={(e) => handleEditPropositionChange(index, e.target.value)}
                                            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                                            required
                                        />
                                        {editFormData.propositions.length > 2 && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeEditProposition(index)}
                                                className="text-red-500 hover:text-red-700 text-lg"
                                            >
                                                &times;
                                            </button>
                                        )}
                                    </div>
                                ))}
                                
                                {editFormData.propositions.length < 5 && (
                                    <button 
                                        type="button" 
                                        onClick={addEditProposition}
                                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-2"
                                    >
                                        + Ajouter une option
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex justify-end space-x-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition duration-150"
                                    disabled={isSubmitting}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !editFormData.texte_question.trim() || editFormData.propositions.filter(p => p.texte_proposition.trim() !== '').length < 2 || !editFormData.propositions.some(p => p.est_correct)}
                                    className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 transition duration-150"
                                >
                                    {isSubmitting ? 'Mise à jour...' : 'Sauvegarder les modifications'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODALE DE SUPPRESSION (Rendu inchangé) --- */}
            {isDeleteModalOpen && questionToDelete && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-4 text-red-600">Confirmation de Suppression</h3>
                        <p className="mb-6 text-gray-700">
                            Êtes-vous sûr de vouloir supprimer la question : 
                            <span className="font-semibold block mt-1 line-clamp-2">
                                {questionToDelete.texte_question}
                            </span>
                        </p>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition duration-150"
                                disabled={isSubmitting}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteQuestion}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-400 transition duration-150"
                            >
                                {isSubmitting ? 'Suppression...' : 'Confirmer la Suppression'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionQuestions;