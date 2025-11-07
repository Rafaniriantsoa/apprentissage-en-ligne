import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
// Importation des icônes Lucide-React
import { 
    Plus, 
    Pencil, 
    Trash2, 
    ListChecks, 
    ArrowLeft, 
    RotateCcw,
    AlertTriangle,
    CheckCircle,
    BookOpenText 
} from 'lucide-react'; 

const GestionQuiz = () => {
    // --- Configuration API et données utilisateur ---
    const API_BASE_URL = 'http://localhost/projet-plateforme/backend/api/formateur/';
    const CREATE_QUIZ_API_URL = API_BASE_URL + 'creerQuiz.php';
    const LIST_QUIZ_API_URL = API_BASE_URL + 'listerQuiz.php';
    const MODIFY_QUIZ_API_URL = API_BASE_URL + 'modifierQuiz.php';
    const DELETE_QUIZ_API_URL = API_BASE_URL + 'supprimerQuiz.php'; 
    
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
    const [isSubmitting, setIsSubmitting] = useState(false); 

    // --- États pour la Création ---
    const [newQuizTitle, setNewQuizTitle] = useState('');
    
    // --- États pour la Modification (Modale) ---
    const [isEditQuizModalOpen, setIsEditQuizModalOpen] = useState(false);
    const [quizToEdit, setQuizToEdit] = useState(null);
    const [editQuizTitle, setEditQuizTitle] = useState('');
    
    // --- États pour la Suppression (Modale) ---
    const [isDeleteQuizModalOpen, setIsDeleteQuizModalOpen] = useState(false);
    const [quizToDelete, setQuizToDelete] = useState(null);


    // 1. CHARGEMENT DES QUIZ

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
            // Gérer le cas où l'API renvoie un message sans 'quiz' ou un tableau vide
            setQuizList(response.data.cours || response.data.quiz || []); 
        } catch (err) {
            console.error("Erreur de chargement des quiz:", err.response || err);
            if(err.response?.status === 404 || err.response?.data?.quiz === null) {
                 setQuizList([]);
            } else {
                 setError("Impossible de charger les quiz. Vérifiez la connexion API.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuiz();
    }, [idCours]);


    // 2. CRÉATION D'UN QUIZ

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

            setSuccessMessage(response.data.message || "Quiz créé avec succès !");
            setNewQuizTitle('');
            fetchQuiz();

        } catch (err) {
            console.error("Erreur création quiz:", err.response || err);
            setError(err.response?.data?.message || "Échec de la création du quiz.");
        } finally {
            setIsSubmitting(false);
        }
    };


    // 3. MODIFICATION D'UN QUIZ

    const openEditQuizModal = (quiz) => {
        setQuizToEdit(quiz);
        setEditQuizTitle(quiz.titre_quiz);
        setIsEditQuizModalOpen(true);
    };

    const closeEditQuizModal = () => {
        setIsEditQuizModalOpen(false);
        setQuizToEdit(null);
        setEditQuizTitle('');
        setError('');
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
            closeEditQuizModal();
            fetchQuiz(); 
        } catch (err) {
            console.error("Erreur modification quiz:", err.response || err);
            setError(err.response?.data?.message || "Échec de la modification du quiz.");
        } finally {
            setIsSubmitting(false);
        }
    };


    // 4. SUPPRESSION D'UN QUIZ

    const openDeleteQuizModal = (quiz) => {
        setQuizToDelete(quiz);
        setIsDeleteQuizModalOpen(true);
    };
    
    const closeDeleteQuizModal = () => {
        setIsDeleteQuizModalOpen(false);
        setQuizToDelete(null);
        setError('');
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
            closeDeleteQuizModal();
            fetchQuiz();

        } catch (err) {
            console.error("Erreur suppression quiz:", err.response || err);
            setError(err.response?.data?.message || "Échec de la suppression du quiz.");
        } finally {
            setIsSubmitting(false);
        }
    };


    // 5. NAVIGATION VERS LA GESTION DES QUESTIONS
    
    const handleManageQuestions = (quiz) => {
        localStorage.setItem('quiz_selectionne', JSON.stringify({
            id_quiz: quiz.id_quiz,
            titre_quiz: quiz.titre_quiz,
            nombre_questions: quiz.nombre_questions 
        }));
        
        navigate(`/gerer-question`);
    };

    // 6. RENDU

    if (loading) return <div className="flex justify-center items-center h-40 text-lg text-indigo-600 animate-pulse">
        <RotateCcw className="mr-3 animate-spin" size={24} /> 
        Chargement des quiz...
    </div>;
    
    return (
        <div className="max-w-7xl mx-auto p-6 lg:p-8 bg-gray-50 min-h-screen">
            <Link to="/liste-cours" className="text-indigo-600 hover:text-indigo-800 font-medium transition duration-150 flex items-center mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la liste des cours
            </Link>

            <header className="mb-8 border-b border-gray-200 pb-4">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-1 flex items-center">
                    <BookOpenText className="mr-3 text-blue-600" size={32} />
                    Gestion des Quiz du Cours
                </h2>
                <h3 className="text-xl text-blue-700 font-semibold">
                    Cours : <span className="text-gray-800 font-bold">{courseTitle}</span> 
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
                
                {/* Colonne de Création de Quiz  */}
                <div className="lg:col-span-1 bg-white p-8 rounded-xl shadow-2xl border-t-4 border-blue-600 h-fit">
                    <h4 className="text-2xl font-bold mb-5 text-blue-800 flex items-center">
                        <Plus className="mr-2 h-6 w-6" />
                        Créer un nouveau Quiz
                    </h4>
                    <form onSubmit={handleCreateQuiz} className="space-y-6">
                        <div>
                            <label htmlFor="titre_quiz" className="block text-sm font-semibold text-gray-700 mb-1">Titre du Quiz</label>
                            <input
                                type="text"
                                name="titre_quiz"
                                id="titre_quiz"
                                placeholder="Ex: Quiz de fin de module 1"
                                value={newQuizTitle}
                                onChange={(e) => setNewQuizTitle(e.target.value)}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting || !newQuizTitle.trim()}
                            className="w-full px-4 py-2 text-lg font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition duration-200 transform hover:scale-[1.01] flex items-center justify-center"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            {isSubmitting ? 'Création...' : 'Créer le Quiz'}
                        </button>
                    </form>
                </div>

                {/* Colonne des Quiz existants  */}
                <div className="lg:col-span-2">
                    <h4 className="text-2xl font-bold mb-5 text-gray-700 flex items-center">
                        <ListChecks className="mr-2 h-6 w-6 text-indigo-600" />
                        Liste des Quiz existants ({quizList.length})
                        <button onClick={fetchQuiz} className="ml-4 text-sm text-indigo-600 hover:text-indigo-800 hover:underline flex items-center">
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Actualiser
                        </button>
                    </h4>
                    
                    {quizList.length === 0 ? (
                        <div className="p-10 bg-white rounded-xl shadow-lg text-center text-gray-500 border border-dashed border-gray-300">
                            Aucun quiz créé pour ce cours.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {quizList.map(quiz => (
                                <div key={quiz.id_quiz} className="p-5 bg-white rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-center border-l-6 border-indigo-500 hover:shadow-xl transition duration-200">
                                    
                                    <div className="flex-grow pr-4 mb-2 sm:mb-0">
                                        <h4 className="font-extrabold text-xl text-gray-800 truncate">{quiz.titre_quiz}</h4>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Questions : <span className="font-bold text-indigo-600">{quiz.nombre_questions || 0}</span>
                                        </p>
                                    </div>

                                    <div className="flex space-x-2">
                                        {/* Bouton Gérer Questions - Le plus important */}
                                        <button
                                            onClick={() => handleManageQuestions(quiz)}
                                            className="px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 transition duration-150 whitespace-nowrap flex items-center"
                                        >
                                            <ListChecks className="h-4 w-4 mr-1" />
                                            Gérer Questions
                                        </button>
                                        
                                        {/* Bouton Modifier */}
                                        <button
                                            onClick={() => openEditQuizModal(quiz)}
                                            className="px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition duration-150 flex items-center"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        
                                        {/* Bouton Supprimer */}
                                        <button
                                            onClick={() => openDeleteQuizModal(quiz)}
                                            className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition duration-150 flex items-center"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODALE DE MODIFICATION DU QUIZ --- */}
            {isEditQuizModalOpen && quizToEdit && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl shadow-3xl w-full max-w-lg transform transition-all duration-300 scale-100">
                        <h3 className="text-2xl font-bold mb-4 text-indigo-700 border-b pb-2 flex items-center">
                            <Pencil className="h-6 w-6 mr-2" />
                            Modifier le Quiz
                        </h3>
                        <p className="text-gray-600 mb-4">Titre actuel : <span className="font-semibold">{quizToEdit.titre_quiz}</span></p>

                        {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg flex items-center">
                             <AlertTriangle className="h-4 w-4 mr-2" />
                            {error}
                        </div>}

                        <form onSubmit={handleUpdateQuiz} className="space-y-4">
                            <div>
                                <label htmlFor="edit_quiz_title" className="block text-sm font-medium text-gray-700">Nouveau Titre</label>
                                <input
                                    type="text"
                                    name="edit_quiz_title"
                                    id="edit_quiz_title"
                                    value={editQuizTitle}
                                    onChange={(e) => setEditQuizTitle(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-3">
                                <button
                                    type="button"
                                    onClick={closeEditQuizModal}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-150"
                                    disabled={isSubmitting}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !editQuizTitle.trim()}
                                    className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition duration-150"
                                >
                                    {isSubmitting ? 'Mise à jour...' : 'Sauvegarder'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODALE DE SUPPRESSION DU QUIZ  --- */}
            {isDeleteQuizModalOpen && quizToDelete && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl shadow-3xl w-full max-w-sm transform transition-all duration-300 scale-100 border-t-4 border-red-600">
                        <h3 className="text-xl font-bold mb-4 text-red-700 flex items-center">
                            <AlertTriangle className="h-6 w-6 mr-2" />
                            Confirmation de Suppression
                        </h3>
                        <p className="mb-6 text-gray-700">
                            Êtes-vous sûr de vouloir supprimer définitivement le quiz : 
                            <span className="font-extrabold block mt-1 line-clamp-2 text-red-800">
                                {quizToDelete.titre_quiz} ?
                            </span>
                            <span className="text-sm text-red-500 font-medium mt-3 block p-2 bg-red-50 rounded">
                                ATTENTION : Cela supprimera toutes les questions, propositions et résultats utilisateurs associés à ce quiz !
                            </span>
                        </p>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={closeDeleteQuizModal}
                                className="px-4 py-2 text-gray-600 border text-xs sm:text-sm border-gray-300 rounded-lg hover:bg-gray-100 transition duration-150"
                                disabled={isSubmitting}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteQuiz}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-white text-xs sm:text-sm bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-400 font-bold transition duration-150 flex items-center"
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                {isSubmitting ? 'Suppression...' : 'Supprimer Définitivement'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionQuiz;