import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const GestionQuiz = () => {
    // --- Configuration API et données utilisateur ---
    const API_BASE_URL = 'http://localhost/projet-plateforme/backend/api/formateur/';
    const CREATE_QUIZ_API_URL = API_BASE_URL + 'creerQuiz.php';
    const LIST_QUIZ_API_URL = API_BASE_URL + 'listerQuiz.php';
    const MODIFY_QUIZ_API_URL = API_BASE_URL + 'modifierQuiz.php'; // NOUVEAU
    const DELETE_QUIZ_API_URL = API_BASE_URL + 'supprimerQuiz.php'; // NOUVEAU
    
    // Assurez-vous que le cours sélectionné est toujours en localStorage
    const cours = JSON.parse(localStorage.getItem('cours_selectionne') || '{}');
    const idCours = cours.id_cours;
    const courseTitle = cours.titre;

    const navigate = useNavigate();

    // --- États principaux ---
    const [quizList, setQuizList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // Utilisé pour tous les envois

    // --- États pour la Création ---
    const [newQuizTitle, setNewQuizTitle] = useState('');
    
    // --- États pour la Modification (Modale) ---
    const [isEditQuizModalOpen, setIsEditQuizModalOpen] = useState(false);
    const [quizToEdit, setQuizToEdit] = useState(null);
    const [editQuizTitle, setEditQuizTitle] = useState('');
    
    // --- États pour la Suppression (Modale) ---
    const [isDeleteQuizModalOpen, setIsDeleteQuizModalOpen] = useState(false);
    const [quizToDelete, setQuizToDelete] = useState(null);


    // ==========================================================
    // 1. CHARGEMENT DES QUIZ
    // ==========================================================

    const fetchQuiz = async () => {
        setLoading(true);
        setError('');
        
        if (!idCours) {
            setError("ID de cours manquant. Veuillez revenir à la liste des cours.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${LIST_QUIZ_API_URL}?id_cours=${idCours}`);
            setQuizList(response.data.quiz || []);
        } catch (err) {
            console.error("Erreur de chargement des quiz:", err.response || err);
            if(err.response?.status === 404) {
                 setQuizList([]);
            } else {
                 setError("Impossible de charger les quiz.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuiz();
    }, [idCours]);


    // ==========================================================
    // 2. CRÉATION D'UN QUIZ
    // ==========================================================

    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!newQuizTitle.trim()) {
            setError("Veuillez donner un titre au quiz.");
            return;
        }
        
        setIsSubmitting(true);

        try {
            const response = await axios.post(CREATE_QUIZ_API_URL, {
                id_cours: idCours,
                titre_quiz: newQuizTitle.trim(),
            });

            setSuccessMessage(response.data.message || "Quiz créé !");
            setNewQuizTitle(''); // Réinitialiser le champ
            fetchQuiz(); // Recharger la liste

        } catch (err) {
            console.error("Erreur création quiz:", err.response || err);
            setError(err.response?.data?.message || "Échec de la création du quiz.");
        } finally {
            setIsSubmitting(false);
        }
    };


    // ==========================================================
    // 3. MODIFICATION D'UN QUIZ (Actions et Modal)
    // ==========================================================

    const openEditQuizModal = (quiz) => {
        setQuizToEdit(quiz);
        setEditQuizTitle(quiz.titre_quiz);
        setIsEditQuizModalOpen(true);
    };

    const handleUpdateQuiz = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!editQuizTitle.trim()) {
            setError("Veuillez entrer un titre valide.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await axios.post(MODIFY_QUIZ_API_URL, {
                id_quiz: quizToEdit.id_quiz,
                titre_quiz: editQuizTitle.trim(),
            });

            setSuccessMessage(response.data.message || "Quiz modifié avec succès !");
            setIsEditQuizModalOpen(false);
            fetchQuiz(); // Recharger la liste
        } catch (err) {
            console.error("Erreur modification quiz:", err.response || err);
            setError(err.response?.data?.message || "Échec de la modification du quiz.");
        } finally {
            setIsSubmitting(false);
        }
    };


    // ==========================================================
    // 4. SUPPRESSION D'UN QUIZ (Actions et Modal)
    // ==========================================================

    const openDeleteQuizModal = (quiz) => {
        setQuizToDelete(quiz);
        setIsDeleteQuizModalOpen(true);
    };

    const handleDeleteQuiz = async () => {
        setError('');
        setSuccessMessage('');
        setIsSubmitting(true);

        try {
            const response = await axios.post(DELETE_QUIZ_API_URL, {
                id_quiz: quizToDelete.id_quiz
            });

            setSuccessMessage(response.data.message || "Quiz supprimé avec succès.");
            setIsDeleteQuizModalOpen(false);
            setQuizToDelete(null);
            fetchQuiz(); // Recharger la liste

        } catch (err) {
            console.error("Erreur suppression quiz:", err.response || err);
            setError(err.response?.data?.message || "Échec de la suppression du quiz.");
        } finally {
            setIsSubmitting(false);
        }
    };


    // ==========================================================
    // 5. NAVIGATION VERS LA GESTION DES QUESTIONS
    // ==========================================================
    
    const handleManageQuestions = (quiz) => {
        // Stocker le quiz sélectionné pour le composant GestionQuestions
        localStorage.setItem('quiz_selectionne', JSON.stringify({
            id_quiz: quiz.id_quiz,
            titre_quiz: quiz.titre_quiz,
            nombre_questions: quiz.nombre_questions 
        }));
        
        navigate(`/gerer-question`);
    };


    // ==========================================================
    // 6. RENDU
    // ==========================================================

    if (loading) return <div className="text-center p-10">Chargement des quiz...</div>;
    
    return (
        <div className="max-w-6xl mx-auto p-6 mt-10">
            <Link to="/" className="text-indigo-600 hover:underline mb-4 block">
                ← Retour à la liste des cours
            </Link>

            <h2 className="text-3xl font-bold text-gray-800 mb-2">
                ❓ Gestion des Quiz
            </h2>
            <h3 className="text-xl text-purple-700 mb-6 border-b pb-2">
                Cours : **{courseTitle}** (ID: {idCours})
            </h3>
            
            {successMessage && <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">{successMessage}</div>}
            {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Colonne de Création de Quiz */}
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-xl border border-gray-100 h-fit">
                    <h4 className="text-2xl font-semibold mb-4 text-purple-700">
                        Créer un nouveau Quiz
                    </h4>
                    <form onSubmit={handleCreateQuiz} className="space-y-4">
                        <div>
                            <label htmlFor="titre_quiz" className="block text-sm font-medium text-gray-700">Titre du Quiz</label>
                            <input
                                type="text"
                                name="titre_quiz"
                                id="titre_quiz"
                                value={newQuizTitle}
                                onChange={(e) => setNewQuizTitle(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting || !newQuizTitle.trim()}
                            className="w-full px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-purple-400 transition duration-150"
                        >
                            {isSubmitting ? 'Création...' : 'Créer le Quiz'}
                        </button>
                    </form>
                </div>

                {/* Colonne des Quiz existants */}
                <div className="lg:col-span-2">
                    <h4 className="text-2xl font-semibold mb-4 text-gray-700">
                        Liste des Quiz existants ({quizList.length})
                    </h4>
                    
                    {
                    // quizList.length === 0 ? (
                    //     <div className="p-6 bg-gray-100 rounded-lg text-center text-gray-500">
                    //         Aucun quiz créé pour ce cours.
                    //     </div>
                    // ) : (
                        <div className="space-y-4">
                            {quizList.map(quiz => (
                                <div key={quiz.id_quiz} className="p-4 bg-white rounded-lg shadow flex flex-col sm:flex-row justify-between items-center border-l-4 border-purple-500">
                                    <div className="flex-grow pr-4 mb-2 sm:mb-0">
                                        <h4 className="font-bold text-lg text-gray-800">{quiz.titre_quiz}</h4>
                                        <p className="text-sm text-gray-500">
                                            Questions : <span className="font-semibold text-purple-600">{quiz.nombre_questions}</span>
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        {/* Bouton Modifier */}
                                        <button
                                            onClick={() => openEditQuizModal(quiz)}
                                            className="px-3 py-1 text-sm font-medium text-white bg-indigo-500 rounded-md hover:bg-indigo-600 transition duration-150"
                                        >
                                            Modifier
                                        </button>
                                        {/* Bouton Supprimer */}
                                        <button
                                            onClick={() => openDeleteQuizModal(quiz)}
                                            className="px-3 py-1 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition duration-150"
                                        >
                                            Supprimer
                                        </button>
                                        {/* Bouton Gérer Questions */}
                                        <button
                                            onClick={() => handleManageQuestions(quiz)}
                                            className="px-3 py-1 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition duration-150"
                                        >
                                            Gérer Questions
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    // )
                    }
                </div>
            </div>

            {/* --- MODALE DE MODIFICATION DU QUIZ --- */}
            {isEditQuizModalOpen && quizToEdit && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-lg">
                        <h3 className="text-2xl font-bold mb-4 text-indigo-700">
                            Modifier le Quiz : {quizToEdit.titre_quiz}
                        </h3>
                        <form onSubmit={handleUpdateQuiz} className="space-y-4">
                            
                            <div>
                                <label htmlFor="edit_quiz_title" className="block text-sm font-medium text-gray-700">Nouveau Titre</label>
                                <input
                                    type="text"
                                    name="edit_quiz_title"
                                    id="edit_quiz_title"
                                    value={editQuizTitle}
                                    onChange={(e) => setEditQuizTitle(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                    required
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditQuizModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition duration-150"
                                    disabled={isSubmitting}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !editQuizTitle.trim()}
                                    className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 transition duration-150"
                                >
                                    {isSubmitting ? 'Mise à jour...' : 'Sauvegarder'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODALE DE SUPPRESSION DU QUIZ --- */}
            {isDeleteQuizModalOpen && quizToDelete && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-4 text-red-600">Confirmation de Suppression du Quiz</h3>
                        <p className="mb-6 text-gray-700">
                            Êtes-vous sûr de vouloir supprimer le quiz : 
                            <span className="font-semibold block mt-1 line-clamp-2">
                                {quizToDelete.titre_quiz} ?
                            </span>
                            <span className="text-sm text-red-500 font-medium mt-2 block">
                                ATTENTION : Cela supprimera aussi toutes les questions et réponses utilisateurs associées !
                            </span>
                        </p>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setIsDeleteQuizModalOpen(false)}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition duration-150"
                                disabled={isSubmitting}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteQuiz}
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

export default GestionQuiz;