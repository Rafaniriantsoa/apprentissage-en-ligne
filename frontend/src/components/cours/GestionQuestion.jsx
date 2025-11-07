import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
// Importation des icônes Lucide-React
import { 
    Plus, 
    Pencil, 
    Trash2, 
    ArrowLeft, 
    RotateCcw,
    AlertTriangle,
    CheckCircle,
    HelpCircle, // Pour le titre QCM
    SquareCheckBig, // Pour la proposition correcte
    XCircle, // Pour les propositions incorrectes
    Minus,
    Check,
    X
} from 'lucide-react'; 


const GestionQuestions = () => {
    // --- Configuration API ---
    const API_BASE_URL = 'http://localhost/projet-plateforme/backend/api/formateur/';
    const CREATE_QUESTION_API_URL = API_BASE_URL + 'creerQuestionAvecPropositions.php'; 
    const LIST_QUESTIONS_API_URL = API_BASE_URL + 'listerQuestionsQCM.php'; 
    const MODIFY_QUESTION_API_URL = API_BASE_URL + 'modifierQuestionQCM.php'; 
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
             // J'ai enlevé l'erreur persistante ici pour ne pas bloquer l'interface si l'API est vide.
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, [idQuiz]);


    // ==========================================================
    // 2. GESTION DE LA CRÉATION
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

            setSuccessMessage(response.data.message || "Question ajoutée !"); // Ajout du message de succès
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
    // 3. GESTION DE LA MODIFICATION
    // ==========================================================

    const openEditModal = (question) => {
        setError(''); // Reset error message on opening
        setQuestionToEdit(question);
        setEditFormData({
            texte_question: question.texte_question,
            // S'assurer que les propositions sont bien un tableau et copiées
            propositions: question.propositions ? JSON.parse(JSON.stringify(question.propositions)) : [],
        });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setQuestionToEdit(null);
        setEditFormData({ texte_question: '', propositions: [] });
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
            closeEditModal();
            fetchQuestions(); // Recharger la liste

        } catch (err) {
            console.error("Erreur modification question:", err.response || err);
            setError(err.response?.data?.message || "Échec de la modification de la question.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==========================================================
    // 4. GESTION DE LA SUPPRESSION
    // ==========================================================
    
    const openDeleteModal = (question) => {
        setError('');
        setQuestionToDelete(question);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setQuestionToDelete(null);
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
            closeDeleteModal();
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
    
    if (loading) return (
        <div className="flex justify-center items-center h-40 text-lg text-blue-600 animate-pulse">
            <RotateCcw className="mr-3 animate-spin" size={24} /> 
            Chargement des questions...
        </div>
    );
    
    return (
        <div className="max-w-6xl mx-auto p-6 lg:p-8 bg-gray-50 min-h-screen">
            <Link to="/gerer-quiz" className="text-indigo-600 hover:text-indigo-800 font-medium transition duration-150 flex items-center mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la gestion des quiz
            </Link>

            <header className="mb-8 border-b border-gray-200 pb-4">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-1 flex items-center">
                    <HelpCircle className="mr-3 text-blue-600" size={32} />
                    Gestion des Questions QCM
                </h2>
                <h3 className="text-xl text-indigo-700 font-semibold">
                    Quiz : <span className="text-gray-800 font-bold">{quizTitle}</span> | Cours : <span className="text-gray-600 italic">{courseTitle}</span>
                </h3>
            </header>
            
            {/* Messages de Feedback */}
            {successMessage && <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 border border-green-300 rounded-lg shadow-md transition-opacity duration-300 flex items-center">
                <CheckCircle className="mr-3 h-5 w-5 text-green-500" />
                {successMessage}
            </div>}
            {error && <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg shadow-md transition-opacity duration-300 flex items-center">
                <AlertTriangle className="mr-3 h-5 w-5 text-red-500" />
                {error}
            </div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Colonne de Création de Question QCM */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-2xl border-t-4 border-blue-600 h-fit">
                    <h4 className="text-2xl font-bold mb-5 text-blue-800 flex items-center">
                        <Plus className="mr-2 h-6 w-6" />
                        Ajouter une Question QCM
                    </h4>
                    <form onSubmit={handleCreateQuestion} className="space-y-4">
                        <div>
                            <label htmlFor="texte_question" className="block text-sm font-semibold text-gray-700 mb-1">Texte de la Question</label>
                            <textarea
                                name="texte_question"
                                id="texte_question"
                                value={newQuestionData.texte_question}
                                onChange={handleNewQuestionChange}
                                rows="3"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                                required
                            />
                        </div>

                        {/* Zone des Propositions de Création */}
                        <div className="space-y-3 border p-4 rounded-lg bg-gray-50">
                            <label className="block text-sm font-bold text-gray-700">Propositions (Cocher la Correcte)</label>
                            
                            {newQuestionData.propositions.map((prop, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="correct_answer"
                                        checked={prop.est_correct}
                                        onChange={() => handleCorrectToggle(index)}
                                        className="form-radio text-green-600 h-5 w-5 cursor-pointer focus:ring-green-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder={`Option ${index + 1}`}
                                        value={prop.texte_proposition}
                                        onChange={(e) => handlePropositionChange(index, e.target.value)}
                                        className="flex-grow px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                    {newQuestionData.propositions.length > 2 && (
                                        <button 
                                            type="button" 
                                            onClick={() => removeProposition(index)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition duration-150"
                                        >
                                            <Minus className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            
                            {newQuestionData.propositions.length < 5 && (
                                <button 
                                    type="button" 
                                    onClick={addProposition}
                                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-2 flex items-center"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Ajouter une option
                                </button>
                            )}
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isSubmitting || !newQuestionData.texte_question.trim() || newQuestionData.propositions.filter(p => p.texte_proposition.trim() !== '').length < 2 || !newQuestionData.propositions.some(p => p.est_correct)}
                            className="w-full px-4 py-2 text-lg font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition duration-200 transform hover:scale-[1.01] flex items-center justify-center"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            {isSubmitting ? 'Ajout en cours...' : 'Ajouter la Question'}
                        </button>
                    </form>
                </div>

                {/* Colonne des Questions existantes QCM */}
                <div className="lg:col-span-2">
                    <h4 className="text-2xl font-bold mb-5 text-gray-700 flex items-center">
                        Liste des Questions ({questions.length})
                        <button onClick={fetchQuestions} className="ml-4 text-sm text-indigo-600 hover:text-indigo-800 hover:underline flex items-center">
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Actualiser
                        </button>
                    </h4>
                    
                    {
                    questions.length === 0 ? (
                        <div className="p-10 bg-white rounded-xl shadow-lg text-center text-gray-500 border border-dashed border-gray-300">
                            <HelpCircle className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                            Aucune question n'a été ajoutée à ce quiz. Utilisez le formulaire à gauche.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {questions.map((question, index) => (
                                <div key={question.id_question} className="p-5 bg-white rounded-xl shadow-lg flex flex-col justify-between border-l-6 border-indigo-500 hover:shadow-xl transition duration-200">
                                    <div className="flex-grow pr-4">
                                        <p className="font-extrabold text-xl text-gray-800 mb-2">
                                            Q{index + 1}: {question.texte_question}
                                        </p>
                                        <div className="space-y-1 mt-3">
                                            {question.propositions && question.propositions.map((prop) => (
                                                <p key={prop.id_proposition} className={`text-sm p-2 rounded-lg flex items-center ${prop.est_correct ? 'bg-green-100 text-green-800 font-semibold border border-green-300' : 'text-gray-700 bg-gray-50'}`}>
                                                    {prop.est_correct ? <SquareCheckBig className="h-4 w-4 mr-2 text-green-600" /> : <XCircle className="h-4 w-4 mr-2 text-red-500" />}
                                                    {prop.texte_proposition}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 mt-4 self-end">
                                        <button 
                                            onClick={() => openEditModal(question)}
                                            className="px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition duration-150 flex items-center"
                                        >
                                            <Pencil className="h-4 w-4 mr-1" />
                                            Modifier
                                        </button>
                                        <button 
                                            onClick={() => openDeleteModal(question)}
                                            className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition duration-150 flex items-center"
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODALE DE MODIFICATION --- */}
            {isEditModalOpen && questionToEdit && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl shadow-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 border-t-4 border-indigo-600">
                        <h3 className="text-2xl font-bold mb-4 text-indigo-700 border-b pb-2 flex items-center">
                            <Pencil className="h-6 w-6 mr-2" />
                            Modifier le QCM
                        </h3>
                         {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg flex items-center">
                             <AlertTriangle className="h-4 w-4 mr-2" />
                            {error}
                        </div>}
                        <form onSubmit={handleUpdateQuestion} className="space-y-4">
                            
                            <div>
                                <label htmlFor="edit_texte_question" className="block text-sm font-semibold text-gray-700">Texte de la Question</label>
                                <textarea
                                    name="edit_texte_question"
                                    id="edit_texte_question"
                                    value={editFormData.texte_question}
                                    onChange={handleEditQuestionChange}
                                    rows="3"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>

                            {/* Zone des Propositions d'Édition */}
                            <div className="space-y-3 border p-4 rounded-lg bg-gray-50">
                                <label className="block text-sm font-bold text-gray-700">Propositions (Cocher la Correcte)</label>
                                
                                {editFormData.propositions.map((prop, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="edit_correct_answer"
                                            checked={prop.est_correct}
                                            onChange={() => handleEditCorrectToggle(index)}
                                            className="form-radio text-green-600 h-5 w-5 cursor-pointer focus:ring-green-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder={`Option ${index + 1}`}
                                            value={prop.texte_proposition}
                                            onChange={(e) => handleEditPropositionChange(index, e.target.value)}
                                            className="flex-grow px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        />
                                        {editFormData.propositions.length > 2 && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeEditProposition(index)}
                                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition duration-150"
                                            >
                                                <Minus className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                
                                {editFormData.propositions.length < 5 && (
                                    <button 
                                        type="button" 
                                        onClick={addEditProposition}
                                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-2 flex items-center"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Ajouter une option
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex justify-end space-x-3 pt-3">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-150 flex items-center"
                                    disabled={isSubmitting}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !editFormData.texte_question.trim() || editFormData.propositions.filter(p => p.texte_proposition.trim() !== '').length < 2 || !editFormData.propositions.some(p => p.est_correct)}
                                    className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition duration-150 flex items-center font-bold"
                                >
                                    <Check className="h-5 w-5 mr-2" />
                                    {isSubmitting ? 'Mise à jour...' : 'Sauvegarder'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODALE DE SUPPRESSION --- */}
            {isDeleteModalOpen && questionToDelete && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl shadow-3xl w-full max-w-sm transform transition-all duration-300 scale-100 border-t-4 border-red-600">
                        <h3 className="text-xl font-bold mb-4 text-red-700 flex items-center">
                            <Trash2 className="h-6 w-6 mr-2" />
                            Confirmation de Suppression
                        </h3>
                        <p className="mb-6 text-gray-700">
                            Êtes-vous sûr de vouloir supprimer la question : 
                            <span className="font-extrabold block mt-1 line-clamp-2 text-red-800">
                                {questionToDelete.texte_question}
                            </span>
                        </p>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-150"
                                disabled={isSubmitting}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteQuestion}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-400 font-bold transition duration-150 flex items-center"
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                {isSubmitting ? 'Suppression...' : 'Supprimer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionQuestions;