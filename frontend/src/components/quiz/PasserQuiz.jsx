// src/components/quiz/PasserQuiz.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { HelpCircle, Loader, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const API_URL_QUIZ = 'http://localhost/projet-plateforme/backend/api/etudiant/passerQuiz.php';
const API_URL_SUBMIT = 'http://localhost/projet-plateforme/backend/api/etudiant/soumettreQuiz.php';

const PasserQuiz = () => {
    const { idQuiz } = useParams();
    const navigate = useNavigate();

    const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}');
    const idEtudiant = utilisateur.id_utilisateur;

    // --- États ---
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userResponses, setUserResponses] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    // Fonction pour charger les questions du quiz
    const fetchQuizQuestions = useCallback(async () => {
        setLoading(true);
        setError('');
        
        if (!idEtudiant) {
            setError("ID utilisateur manquant. Veuillez vous reconnecter.");
            setLoading(false);
            setTimeout(() => navigate('/deconnexion'), 1500); 
            return;
        }

        if (!idQuiz) {
            setError("ID du quiz manquant dans l'URL.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${API_URL_QUIZ}?id_quiz=${idQuiz}`);
            
            if (response.data.success) {
                setQuiz(response.data.quiz);
            } else {
                setError(response.data.message || "Erreur de chargement des questions.");
            }
        } catch (err) {
            const message = err.response?.data?.message || `Impossible de charger le quiz. Erreur: ${err.message}`;
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [idQuiz, idEtudiant, navigate]);

    useEffect(() => {
        fetchQuizQuestions();
    }, [fetchQuizQuestions]);

    // Fonction pour gérer la sélection d'une proposition
    const handleResponseChange = (idQuestion, idProposition) => {
        setUserResponses(prev => ({
            ...prev,
            [idQuestion]: idProposition
        }));
    };
    
    // Fonction de soumission du quiz
    const handleSubmitQuiz = async () => {
        setIsSubmitting(true);
        setError('');
        
        // Validation: s'assurer que toutes les questions ont une réponse
        const totalQuestions = quiz.questions.length;
        const answeredQuestions = Object.keys(userResponses).length;

        if (answeredQuestions < totalQuestions) {
            setError(`Veuillez répondre à toutes les questions (${answeredQuestions}/${totalQuestions} répondues).`);
            setIsSubmitting(false);
            return;
        }

        // Préparation des données pour l'API
        const data = {
            id_utilisateur: idEtudiant,
            id_quiz: quiz.id_quiz,
            reponses: Object.entries(userResponses).map(([id_question, id_proposition_choisie]) => ({
                id_question: parseInt(id_question),
                id_proposition_choisie: parseInt(id_proposition_choisie)
            }))
        };
        
        try {
            const response = await axios.post(API_URL_SUBMIT, data, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data.success) {
                setResult(response.data.resultat);
                setQuiz(null); // Cache le formulaire de quiz
            } else {
                setError(response.data.message || "Erreur lors de la soumission du quiz.");
            }
        } catch (err) {
            const message = err.response?.data?.message || `Erreur de soumission : ${err.message}`;
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- RENDU : Chargement, Erreur, Résultat ---
    if (loading) return (
        <div className="text-center py-20 max-w-4xl mx-auto">
            <Loader className="w-8 h-8 animate-spin inline-block text-indigo-600 mr-2"/> Chargement du quiz...
        </div>
    );
    
    if (error && !quiz) return (
        <div className="max-w-4xl mx-auto p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-lg mt-10">
            <AlertTriangle className="w-5 h-5 inline-block mr-2"/>
            <strong>Erreur critique:</strong> {error}
        </div>
    );
    
    // --- RENDU : Résultat du Quiz ---
    if (result) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-10">
                <div className="p-10 bg-white rounded-xl shadow-2xl text-center border-t-8 border-green-500">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6"/>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Résultats du Quiz : {result.titre_quiz}</h1>
                    <p className="text-2xl text-indigo-700 mb-8">
                        Votre score : 
                        <span className="font-bold ml-2 text-green-600">
                            {result.score_obtenu} / {result.total_questions}
                        </span>
                        <span className="text-xl text-gray-500 ml-4">({result.pourcentage}%)</span>
                    </p>
                    
                    <div className={`p-4 rounded-lg text-lg font-semibold ${result.succes ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {result.succes ? "Félicitations ! Vous avez réussi l'évaluation. Le quiz suivant est déverrouillé." : "Encouragements ! Revoyez les leçons et réessayez."}
                    </div>

                    <div className="mt-8 flex justify-center space-x-4">
                        <button 
                            onClick={() => navigate(`/cours/acces/${result.id_cours}`)} 
                            className="px-6 py-3 text-lg font-semibold text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition duration-150"
                        >
                            Retourner au Cours
                        </button>
                        <button 
                            onClick={() => {
                                setResult(null);
                                setUserResponses({});
                                fetchQuizQuestions(); // Recharge le quiz
                            }} 
                            className="px-6 py-3 text-lg font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition duration-150"
                        >
                            Refaire le Quiz
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDU : Formulaire de Quiz ---
    if (quiz) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-10 bg-gray-50 min-h-screen">
                <h1 className="text-3xl font-extrabold text-indigo-700 mb-8 flex items-center">
                    <HelpCircle className="w-7 h-7 mr-3"/> Passage du Quiz : {quiz.titre_quiz}
                </h1>
                
                {error && (
                    <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        <AlertTriangle className="w-5 h-5 inline-block mr-2"/>
                        {error}
                    </div>
                )}
                
                <div className="space-y-8">
                    {quiz.questions.map((question, index) => (
                        <div key={question.id_question} className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">
                                Question {index + 1} : {question.texte_question}
                            </h3>
                            
                            <div className="space-y-3">
                                {question.propositions.map((proposition) => (
                                    <div 
                                        key={proposition.id_proposition} 
                                        className={`p-3 border rounded-lg cursor-pointer transition duration-150 
                                            ${userResponses[question.id_question] === proposition.id_proposition 
                                                ? 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-500' 
                                                : 'hover:bg-gray-50 border-gray-300'}`
                                        }
                                        onClick={() => handleResponseChange(question.id_question, proposition.id_proposition)}
                                    >
                                        <label className="flex items-center space-x-3 cursor-pointer w-full">
                                            <input
                                                type="radio"
                                                name={`question-${question.id_question}`}
                                                value={proposition.id_proposition}
                                                checked={userResponses[question.id_question] === proposition.id_proposition}
                                                onChange={() => handleResponseChange(question.id_question, proposition.id_proposition)}
                                                className="form-radio h-5 w-5 text-indigo-600"
                                            />
                                            <span className="text-gray-700">{proposition.texte_proposition}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 text-center">
                    <button
                        onClick={handleSubmitQuiz}
                        disabled={isSubmitting || Object.keys(userResponses).length < quiz.questions.length}
                        className="px-10 py-4 text-xl font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition duration-150 shadow-lg disabled:bg-green-400"
                    >
                        {isSubmitting ? 'Soumission...' : 'Soumettre le Quiz'}
                    </button>
                    {quiz.questions.length > 0 && (
                        <p className="mt-3 text-sm text-gray-500">
                            {Object.keys(userResponses).length} / {quiz.questions.length} questions répondues.
                        </p>
                    )}
                </div>
            </div>
        );
    }
    
    return null;
};

export default PasserQuiz;