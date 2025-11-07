// AutreFormations.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

// --- Définition du Composant Modal (Inchangé dans sa structure, mais inclus pour la refonte complète) ---
const CourseDetailModal = ({ course, lecons, quiz, onClose }) => {
    if (!course) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
                
                {/* En-tête de la Modal */}
                <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-extrabold text-indigo-700">
                            {course.titre}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Par: <span className="font-semibold">{course.formateur}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition duration-150 p-2 rounded-full hover:bg-gray-100"
                        aria-label="Fermer"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Contenu de la Modal */}
                <div className="p-6">
                    <h4 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                        Sommaire des Leçons
                    </h4>
                    
                    {lecons.length > 0 ? (
                        <ul className="space-y-3">
                            {lecons.sort((a, b) => a.ordre - b.ordre).map((lecon) => (
                                <li key={lecon.id_lecon} className="flex items-center p-3 bg-gray-50 rounded-lg shadow-sm">
                                    <span className="font-bold text-indigo-600 mr-3 w-8 text-center">{lecon.ordre}.</span>
                                    <span className="text-gray-700">{lecon.titre_lecon}</span>
                                </li>
                            ))}
                            {quiz && (
                                <li className="flex items-center p-3 bg-orange-100 rounded-lg shadow-sm mt-3 border-l-4 border-orange-500">
                                    <span className="font-bold text-orange-700 mr-3 w-8 text-center">🏆</span>
                                    <span className="text-orange-800 font-semibold">{quiz.titre} (Quiz)</span>
                                </li>
                            )}
                        </ul>
                    ) : (
                        <p className="text-gray-500 italic">Aucune leçon publiée pour ce cours pour le moment.</p>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Composant Principal AutreFormations ---
const AutreFormations = () => {

    // --- Configuration API et utilisateur ---
    const API_BASE_URL = 'http://localhost/projet-plateforme/backend/api/etudiant/';
    // Utilisation de la NOUVELLE API pour lister les cours non-inscrits
    const LIST_API_URL = `${API_BASE_URL}listerCoursNonInscrits.php`; 
    const DETAIL_API_PUBLIC_URL = `${API_BASE_URL}detailCoursPublic.php`; 
    const INSCRIPTION_API_URL = `${API_BASE_URL}inscrireEtudiant.php`;

    const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}');
    const idEtudiant = utilisateur.id_utilisateur;
    const navigate = useNavigate();
    
    // --- États du composant ---
    const [cours, setCours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // --- États pour la Modal (Inchangés) ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCourseDetails, setSelectedCourseDetails] = useState({ 
        course: null, 
        lecons: [], 
        quiz: null, 
        loading: false,
        error: ''
    });

    // --- Fonction de chargement des cours (Mise à jour pour la nouvelle API) ---
    const fetchCours = async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');

        if (!idEtudiant) {
            setError("ID utilisateur non trouvé. Veuillez vous reconnecter.");
            setLoading(false);
            return;
        }
        
        try {
            // Appel à la nouvelle API avec l'ID utilisateur
            const response = await axios.get(`${LIST_API_URL}?id_utilisateur=${idEtudiant}`);
            
            if (response.data.success) {
                // L'API nous retourne déjà la liste filtrée
                setCours(response.data.cours || []);
                if (response.data.nombre_cours === 0) {
                     setError(response.data.message); // Affiche le message "Vous êtes inscrit(e) à tous..."
                }
            } else {
                // Gestion des erreurs côté serveur
                setError(response.data.message || "Erreur lors du chargement des formations.");
            }
        } catch (err) {
            console.error("Erreur de chargement des cours:", err.response || err);
            setError(`Impossible de charger le catalogue: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCours();
    }, [idEtudiant]);


    // --- Logique d'Inscription (Simplifiée car tous les cours sont non-inscrits) ---
    const handleEnroll = async (courseId, courseTitle) => {
        // Pas besoin de vérifier si l'étudiant est inscrit, la liste ne contient que des cours non inscrits.
        
        try {
            const response = await axios.post(INSCRIPTION_API_URL, {
                id_utilisateur: idEtudiant,
                id_cours: courseId
            });

            if (response.data.success) {
                setSuccessMessage(`Inscription à "${courseTitle}" réussie ! Redirection vers le cours...`);
                
                // Mettre à jour l'état : Retirer le cours de la liste après inscription
                setCours(prevCours => prevCours.filter(c => c.id_cours !== courseId)); 
                
                setTimeout(() => {
                    navigate(`/cours/acces/${courseId}`);
                }, 1500);

            } else {
                setError(response.data.message || "Échec de l'inscription.");
            }
        } catch (err) {
             setError(`Erreur lors de l'inscription: ${err.message}`);
             console.error("Erreur d'inscription:", err.response || err);
        }
    };


    // --- Logique pour la Modal de Détails (Inchangée) ---
    const handleDetailClick = async (courseId) => {
        setIsModalOpen(true);
        setSelectedCourseDetails({ course: null, lecons: [], quiz: null, loading: true, error: '' });

        try {
            const response = await axios.get(`${DETAIL_API_PUBLIC_URL}?id_cours=${courseId}`); 

            if (response.data.success) {
                setSelectedCourseDetails({
                    course: response.data.cours,
                    lecons: response.data.lecons || [],
                    quiz: response.data.quiz,
                    loading: false,
                    error: ''
                });
            } else {
                 setSelectedCourseDetails(prev => ({ ...prev, loading: false, error: response.data.message }));
            }
        } catch (err) {
            console.error("Erreur de chargement des détails:", err);
            setSelectedCourseDetails(prev => ({ ...prev, loading: false, error: "Impossible de charger les détails du cours." }));
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCourseDetails({ course: null, lecons: [], quiz: null, loading: false, error: '' });
    };

    if (loading) return <div className="text-center p-10 text-lg">Chargement du catalogue étudiant...</div>;
    
    // Affiche l'erreur si aucun cours n'est trouvé (y compris le message de succès d'avoir tout fini)
    if (cours.length === 0 && error) return (
         <div className="max-w-7xl mx-auto p-6 mt-10">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-8 border-b pb-3">
                Vos Formations Disponibles 🎓
            </h1>
            <div className="p-4 text-center text-lg text-gray-700 bg-gray-100 rounded-lg">
                {error}
            </div>
        </div>
    );
    
    // ... (Rendu du composant) ...
    return (
        <div className="max-w-7xl mx-auto p-6 mt-10">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-8 border-b pb-3">
                Catalogue de Formations Disponibles 📚
            </h1>

            {successMessage && (
                <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
                    {successMessage}
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cours.map((course) => (
                    <div 
                        key={course.id_cours} 
                        className="block bg-white rounded-xl shadow-lg transition duration-300 overflow-hidden border border-gray-100 hover:shadow-xl"
                    >
                        <div className="h-48 w-full overflow-hidden bg-gray-100 flex items-center justify-center text-gray-400">
                             {course.photo ? (
                                 <img 
                                     src={`http://localhost/projet-plateforme/backend/api/formateur/${course.photo}`} 
                                     alt={`Photo du cours ${course.titre}`} 
                                     className="w-full h-full object-cover"
                                 />
                             ) : (
                                 <span>[Image non disponible]</span>
                             )}
                        </div>
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-2 truncate">
                                {course.titre}
                            </h2>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                                {course.description || "Aucune description fournie."}
                            </p>
                            <p className="text-md font-semibold text-indigo-600">
                                Formateur: {course.formateur}
                            </p>
                            
                            <div className="mt-4 flex space-x-2">
                                
                                {/* Bouton 1: Suivre le cours (simplifié) */}
                                <button
                                    onClick={() => handleEnroll(course.id_cours, course.titre)}
                                    className="flex-grow px-4 py-2 text-sm font-medium rounded-md transition duration-150 bg-indigo-600 text-white hover:bg-indigo-700"
                                >
                                    Suivre le cours
                                </button>

                                {/* Bouton 2: Plus de détails (ouvre la Modal) */}
                                <button 
                                    onClick={() => handleDetailClick(course.id_cours)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition duration-150"
                                >
                                    Détails
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Détails (Gestion loading/error/content) */}
            {isModalOpen && selectedCourseDetails.loading && (
                 <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-xl text-center">
                        <p className="text-lg font-semibold text-indigo-600">Chargement des détails...</p>
                    </div>
                </div>
            )}
            
            {isModalOpen && selectedCourseDetails.error && (
                 <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-xl text-center">
                        <p className="text-lg font-semibold text-red-600">Erreur: {selectedCourseDetails.error}</p>
                        <button onClick={handleCloseModal} className="mt-4 px-4 py-2 bg-gray-200 rounded">Fermer</button>
                    </div>
                </div>
            )}

            {isModalOpen && !selectedCourseDetails.loading && selectedCourseDetails.course && (
                <CourseDetailModal 
                    course={selectedCourseDetails.course} 
                    lecons={selectedCourseDetails.lecons} 
                    quiz={selectedCourseDetails.quiz} 
                    onClose={handleCloseModal} 
                />
            )}
        </div>
    );
};

export default AutreFormations;