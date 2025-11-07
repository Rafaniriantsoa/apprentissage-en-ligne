// src/components/cours/AccesCoursEtudiant.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react'; // <--- Importation de useRef
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
    BookOpen,
    HelpCircle,
    AlertTriangle,
    ChevronRight,
    CheckCircle,
    Loader,
    Lock,
    ArrowRight
} from 'lucide-react';

// URL de l'API GET pour charger le contenu du cours et la progression
const API_URL = 'http://localhost/projet-plateforme/backend/api/etudiant/accesCoursEtudiant.php';
// URL de l'API POST pour marquer une leçon comme vue
const PROGRESS_API_URL = 'http://localhost/projet-plateforme/backend/api/etudiant/marquerLeconVue.php';

const AccesCoursEtudiant = () => {

    // --- Configuration API et utilisateur ---
    const { id_cours } = useParams();
    const navigate = useNavigate();
    const idCours = id_cours;
    const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}');
    const idEtudiant = utilisateur.id_utilisateur;

    // --- Référence pour le scroll ---
    const contentRef = useRef(null); // <--- Création de la référence

    // --- États du composant ---
    const [courseData, setCourseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [progression, setProgression] = useState({
        pourcentage: 0,
        vues: 0,
        total: 0
    });

    // --- Fonction de chargement des données (inchangé) ---
    const fetchCourseContent = useCallback(async () => {
        setLoading(true);
        setError('');

        if (!idEtudiant) {
            setError("ID utilisateur manquant. Veuillez vous reconnecter.");
            setLoading(false);
            return;
        }

        if (!idCours) {
            setError("ID du cours manquant dans l'URL. Retour au catalogue.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${API_URL}?id_cours=${idCours}&id_utilisateur=${idEtudiant}`);

            if (response.data.success) {
                const data = response.data;
                setCourseData(data);

                // 1. Mettre à jour l'état de progression
                setProgression({
                    pourcentage: data.progression_pourcentage,
                    vues: data.lecons_vues_count,
                    total: data.total_lecons
                });

                // 2. Logique de sélection initiale
                const lecons = data.lecons || [];
                const quizzes = data.quizzes || [];

                let itemToSelect = null;
                const premiereNonVue = lecons.find(l => !l.vue) || lecons[0];

                if (premiereNonVue) {
                    itemToSelect = { type: 'lecon', data: premiereNonVue };
                } else if (lecons.length === 0 && quizzes.length > 0) {
                    const firstUnlockQuiz = quizzes.find(q => !q.locked);
                    if (firstUnlockQuiz) {
                        itemToSelect = { type: 'quiz', data: firstUnlockQuiz };
                    }
                }

                if (itemToSelect) setSelectedItem(itemToSelect);

            } else {
                setError(response.data.message || "Erreur de chargement du cours.");
            }
        } catch (err) {
            const message = err.response?.data?.message || `Impossible d'accéder au cours. Erreur de connexion: ${err.message}`;
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [idCours, idEtudiant]);

    useEffect(() => {
        fetchCourseContent();
    }, [fetchCourseContent]);

    // --- Logique du bouton "Suivant / Terminé" (inchangé) ---
    const handleNextItem = (currentOrder) => {
        const lecons = courseData.lecons || [];
        const quizzes = courseData.quizzes || [];

        const nextLecon = lecons.find(l => l.ordre === currentOrder + 1);

        if (nextLecon) {
            setSelectedItem({ type: 'lecon', data: nextLecon });
            // Pas de scroll ici, car le handleMark... s'en charge après l'update
            return;
        }

        if (progression.pourcentage >= 100) {
            const firstQuiz = quizzes.find(q => !q.locked);
            if (firstQuiz) {
                setSelectedItem({ type: 'quiz', data: firstQuiz });
                // Scroll au quiz
                if (contentRef.current) {
                    contentRef.current.scrollIntoView({ behavior: 'smooth' });
                }
                return;
            }
        }
    };

    const handleMarkAsViewedAndNext = async (currentLecon) => {

        if (currentLecon.vue && currentLecon.ordre === progression.total) {
            return;
        }

        if (currentLecon.vue) {
            handleNextItem(currentLecon.ordre);
            return;
        }

        try {
            const response = await axios.post(PROGRESS_API_URL, {
                id_utilisateur: idEtudiant,
                id_lecon: currentLecon.id_lecon,
                id_cours: idCours
            });

            if (response.data.success) {
                const newProgression = response.data;

                // 1. Mettre à jour l'état de progression
                setProgression({
                    pourcentage: newProgression.progression_pourcentage,
                    vues: newProgression.lecons_vues_count,
                    total: newProgression.total_lecons
                });

                // 2. Mettre à jour le statut "vue" de la leçon actuelle dans l'état local
                setCourseData(prevData => {
                    const updatedLecons = (prevData.lecons || []).map(l =>
                        l.id_lecon === currentLecon.id_lecon ? { ...l, vue: true } : l
                    );
                    return { ...prevData, lecons: updatedLecons };
                });

                // 3. Passer à l'élément suivant
                handleNextItem(currentLecon.ordre);
            }
        } catch (err) {
            console.error("Erreur lors du marquage de la leçon:", err);
            alert("Erreur: Impossible de mettre à jour la progression.");
        }
    };

    // Logique de sélection de l'élément (leçon ou quiz)
    const handleItemSelect = (item, type) => {
        if (type === 'quiz' && item.locked) {
            return;
        }
        setSelectedItem({ type, data: item });
        
        // --- SCROLL AJOUTÉ ---
        if (contentRef.current) {
            // Fait défiler jusqu'au conteneur du contenu principal
            contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // --- FIN SCROLL AJOUTÉ ---
    };

    // --- Logique d'affichage du contenu principal ---
    const renderContent = () => {
        if (!selectedItem) {
            return (
                <div className="p-10 bg-white rounded-2xl shadow-xl text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">👋 Bienvenue dans le cours !</h2>
                    <p className="text-lg text-gray-600">Sélectionnez une leçon ou un quiz dans le sommaire à gauche pour commencer votre parcours d'apprentissage.</p>
                </div>
            );
        }

        if (selectedItem.type === 'lecon') {
            const lecon = selectedItem.data;
            const isLastLecon = lecon.ordre === progression.total;

            let buttonText = "Leçon Suivante";
            let buttonStyle = 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'; // Ajout focus
            let isDisabled = false;

            if (isLastLecon) {
                if (lecon.vue) {
                    buttonText = 'Cours Terminé';
                    buttonStyle = 'bg-gray-400 cursor-not-allowed';
                    isDisabled = true;
                } else {
                    buttonText = 'Terminer le Cours';
                    buttonStyle = 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
                }
            } else if (lecon.vue) {
                buttonText = 'Passer à la suite';
                buttonStyle = 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500';
            }

            return (
                <div className="p-6 md:p-10 bg-white rounded-2xl shadow-xl">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-indigo-800 mb-6 border-b pb-3">
                        <BookOpen className="w-8 h-8 inline-block mr-3 align-middle text-indigo-500" />
                        <span className="align-middle">{lecon.ordre}. {lecon.titre_lecon}</span>
                    </h2>

                    <div className="w-full mb-6" style={{ height: '70vh' }}>
                        <iframe
                            src={`http://localhost/projet-plateforme/backend/api/formateur/${lecon.contenu}`}
                            title={`Aperçu de ${lecon.contenu}`}
                            allowFullScreen // ATTRIBUT AJOUTÉ POUR LE MODE PLEIN ÉCRAN
                            
                            className="w-full h-full border-2 border-gray-100 rounded-xl shadow-inner"
                        />
                    </div>

                    {/* BOUTON SUIVANT/TERMINÉ */}
                    <div className="mt-8 pt-6 border-t flex justify-end">
                        <button
                            onClick={() => handleMarkAsViewedAndNext(lecon)}
                            className={`
                                px-6 py-3 text-lg font-bold text-white rounded-xl transition duration-300 shadow-lg 
                                flex items-center transform active:scale-95 focus:outline-none focus:ring-4
                                ${buttonStyle}
                            `}
                            disabled={isDisabled}
                        >
                            {buttonText}
                            {(isLastLecon && lecon.vue) ? <CheckCircle className="w-5 h-5 inline-block ml-3" /> : <ArrowRight className="w-5 h-5 inline-block ml-3" />}
                        </button>
                    </div>
                    {/* FIN BOUTON SUIVANT/TERMINÉ */}

                </div>
            );
        }

        if (selectedItem.type === 'quiz') {
            const quiz = selectedItem.data;

            if (quiz.locked) {
                return (
                    <div className="p-10 bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-2xl shadow-xl text-center">
                        <Lock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-yellow-700 mb-3">
                            {quiz.titre_quiz} est Verrouillé
                        </h2>
                        <p className="text-lg text-gray-600">
                            Veuillez compléter toutes les leçons et réussir les quiz précédents pour accéder à celui-ci.
                        </p>
                    </div>
                );
            }

            if (quiz.passed) {
                return (
                    <div className="p-10 bg-green-50 rounded-2xl shadow-xl border-2 border-dashed border-green-300 text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <h2 className="text-3xl font-extrabold text-green-700 mb-4">
                            {quiz.titre_quiz} : Réussi !
                        </h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Félicitations, vous avez validé cette étape. Vous pouvez refaire le quiz ou passer au suivant.
                        </p>

                        <button
                            onClick={() => navigate(`/quiz/passer/${quiz.id_quiz}`)}
                            className="px-8 py-3 text-lg font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition duration-300 shadow-md focus:outline-none focus:ring-4 focus:ring-green-500"
                        >
                            Refaire le Quiz <ChevronRight className="w-5 h-5 inline-block ml-2" />
                        </button>
                    </div>
                );
            }

            return (
                <div className="p-10 bg-white rounded-2xl shadow-xl border-2 border-dashed border-indigo-300 text-center">
                    <HelpCircle className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-extrabold text-indigo-700 mb-4">
                        Évaluation : {quiz.titre_quiz}
                    </h2>
                    <p className="text-lg text-gray-600 mb-8">
                        Vous êtes prêt à tester vos connaissances sur ce module. Cliquez ci-dessous pour commencer.
                    </p>

                    <button
                        onClick={() => navigate(`/quiz/passer/${quiz.id_quiz}`)}
                        className="px-8 py-3 text-lg font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition duration-300 shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-500"
                    >
                        Commencer le Quiz <ChevronRight className="w-5 h-5 inline-block ml-2" />
                    </button>
                </div>
            );
        }
    };


    // --- RENDU GÉNÉRAL ---

    if (loading) return (
        <div className="text-center py-20 text-xl font-semibold text-indigo-600">
            <Loader className="w-8 h-8 animate-spin inline-block text-indigo-600 mr-3" /> Chargement du cours...
        </div>
    );

    if (error) return (
        <div className="max-w-4xl mx-auto p-6 bg-red-50 border border-red-300 text-red-700 rounded-xl shadow-lg mt-10">
            <AlertTriangle className="w-6 h-6 inline-block mr-2 align-middle" />
            <strong className="font-bold">Erreur:</strong> {error}
        </div>
    );

    if (!courseData) return null;


    return (
        // Utilisation de max-w-7xl pour un meilleur centrage sur les grands écrans
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-gray-50 min-h-screen">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
                {courseData.cours.titre}
            </h1>
            <p className="text-md text-gray-500 mb-6">
                Formateur : <span className="font-bold text-indigo-600">{courseData.cours.nom_formateur}</span>
            </p>

            {/* BARRE DE PROGRESSION */}
            <div className="mb-8 p-5 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="flex justify-between mb-2">
                    <span className="text-lg font-bold text-indigo-800">Votre Progression</span>
                    <span className="text-lg font-bold text-indigo-800">
                        {progression.pourcentage}% ({progression.vues}/{progression.total} leçons)
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className="h-2.5 rounded-full bg-indigo-600 transition-all duration-700"
                        style={{ width: `${progression.pourcentage}%` }}
                    ></div>
                </div>
            </div>
            {/* FIN BARRE DE PROGRESSION */}


            <div className="flex flex-col lg:flex-row gap-8">

                {/* Sommaire (Sidebar) - Rendu conditionnel pour mobile si nécessaire */}
                <div className="lg:w-1/4 w-full bg-white p-6 rounded-2xl shadow-xl border border-gray-100 h-fit lg:sticky top-8">
                    <h2 className="text-xl font-extrabold text-gray-900 mb-4 border-b pb-3 flex items-center">
                        <BookOpen className="w-6 h-6 mr-3 text-indigo-600" /> Sommaire du Cours
                    </h2>

                    <ul className="space-y-1">
                        {/* Liste des Leçons */}
                        {courseData?.lecons.map((lecon) => (
                            <li
                                key={lecon.id_lecon}
                                onClick={() => handleItemSelect(lecon, 'lecon')}
                                className={`
                                    cursor-pointer p-3 rounded-xl transition duration-150 flex justify-between items-center text-base
                                    ${selectedItem?.type === 'lecon' && selectedItem?.data.id_lecon === lecon.id_lecon
                                        ? 'bg-indigo-50 text-indigo-700 font-extrabold border-l-4 border-indigo-500 shadow-inner'
                                        : lecon.vue
                                            ? 'hover:bg-green-50 text-green-700'
                                            : 'hover:bg-gray-50 text-gray-700'
                                    }`}
                            >
                                <span className='flex items-center truncate'>
                                    {lecon.vue ? <CheckCircle className="w-5 h-5 mr-3 text-green-500 min-w-[20px]" /> : <BookOpen className="w-5 h-5 mr-3 text-indigo-500 min-w-[20px]" />}
                                    <span className="font-semibold">{lecon.ordre}.</span> {lecon.titre_lecon}
                                </span>
                                <ChevronRight className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                            </li>
                        ))}

                        {/* Liste des Quiz avec statut */}
                        {courseData?.quizzes.map((quiz) => (
                            <li
                                key={quiz.id_quiz}
                                onClick={() => handleItemSelect(quiz, 'quiz')}
                                className={`
                                    p-3 rounded-xl transition duration-150 flex justify-between items-center mt-2 text-base
                                    ${quiz.locked
                                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-70'
                                        : (selectedItem?.type === 'quiz' && selectedItem?.data.id_quiz === quiz.id_quiz)
                                            ? 'font-extrabold border-l-4 ' + (quiz.passed ? 'bg-green-100 text-green-700 border-green-500 shadow-inner' : 'bg-indigo-50 text-indigo-700 border-indigo-500 shadow-inner')
                                            : quiz.passed
                                                ? 'hover:bg-green-50 text-green-700 cursor-pointer'
                                                : 'hover:bg-gray-50 text-gray-700 cursor-pointer'
                                    }`}
                            >
                                <span className='flex items-center truncate'>
                                    {quiz.locked ? <Lock className="w-5 h-5 mr-3 text-gray-400 min-w-[20px]" />
                                        : quiz.passed ? <CheckCircle className="w-5 h-5 mr-3 text-green-500 min-w-[20px]" />
                                            : <HelpCircle className="w-5 h-5 mr-3 text-indigo-500 min-w-[20px]" />}
                                    <span className="font-semibold">{quiz.titre_quiz}</span>
                                </span>
                                {quiz.locked
                                    ? <Lock className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                                    : <ChevronRight className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Contenu Principal */}
                <div 
                    className="lg:w-3/4 w-full"
                    ref={contentRef} // <--- Référence attachée au conteneur du contenu
                >
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default AccesCoursEtudiant;