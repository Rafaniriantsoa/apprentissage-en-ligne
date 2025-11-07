// ListeCoursEtudiant.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const ListeCoursEtudiant = () => {

    // --- Configuration API et utilisateur ---
    const API_BASE_URL = 'http://localhost/projet-plateforme/backend/api/etudiant/';
    const LIST_API_URL = `${API_BASE_URL}listerCoursEtudiant.php`; 
    const INSCRIPTION_API_URL = `${API_BASE_URL}inscrireEtudiant.php`;

    const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}');
    const idEtudiant = utilisateur.id_utilisateur;
    const navigate = useNavigate();
    
    // --- États du composant ---
    const [cours, setCours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');


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
            const response = await axios.get(`${LIST_API_URL}?id_utilisateur=${idEtudiant}`);
            if (response.data.cours && response.data.cours.length > 0) {
                setCours(response.data.cours);
            } else {
                setError(response.data.message || "Aucun cours publié trouvé pour le moment.");
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


    // --- Logique d'Inscription (Suivre le cours) ---
    const handleEnroll = async (courseId, courseTitle) => {
        // Redirige directement si déjà inscrit
        const course = cours.find(c => c.id_cours === courseId);
        if (course && course.est_inscrit) {
            navigate(`/cours/acces/${courseId}`); // Route à définir pour l'accès étudiant
            return;
        }

        try {
            const response = await axios.post(INSCRIPTION_API_URL, {
                id_utilisateur: idEtudiant,
                id_cours: courseId
            });

            if (response.data.success) {
                setSuccessMessage(`Inscription à "${courseTitle}" réussie ! Redirection...`);
                
                // Mettre à jour l'état local pour refléter l'inscription immédiate
                setCours(prevCours => 
                    prevCours.map(c => 
                        c.id_cours === courseId ? { ...c, est_inscrit: true } : c
                    )
                );
                
                // Redirection après 1.5s
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


    // --- Logique de détails (pour le visiteur) ---
    const handleDetailClick = (id_cours) => {
        // Stocke l'ID dans le localStorage pour la consultation
        localStorage.setItem('cours_id_courant_public', id_cours);
    };

    if (loading) return <div className="text-center p-10 text-lg">Chargement du catalogue étudiant...</div>;

    if (error) return (
        <div className="text-center p-10 text-red-700 bg-red-100 border border-red-300 rounded-lg max-w-2xl mx-auto mt-10">
            <h3 className="font-bold text-xl">Erreur de Chargement</h3>
            <p>{error}</p>
        </div>
    );
    
    return (
        <div className="max-w-7xl mx-auto p-6 mt-10">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-8 border-b pb-3">
                Vos Formations Disponibles 🎓
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
                        className="block bg-white rounded-xl shadow-lg transition duration-300 overflow-hidden border border-gray-100"
                    >
                        <div className="h-48 w-full overflow-hidden">
                             {/* Affichage de la photo ici... */}
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
                                
                                {/* Bouton 1: Suivre/Continuer le cours */}
                                <button
                                    onClick={() => handleEnroll(course.id_cours, course.titre)}
                                    className={`flex-grow px-4 py-2 text-sm font-medium rounded-md transition duration-150 ${course.est_inscrit 
                                        ? 'bg-green-600 text-white hover:bg-green-700' 
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'}`
                                    }
                                >
                                    {course.est_inscrit ? 'Continuer le cours' : 'Suivre le cours'}
                                </button>

                                {/* Bouton 2: Plus de détails (redirige vers la vue publique) */}
                                <Link 
                                    to={`/cours/${course.id_cours}`} 
                                    onClick={() => handleDetailClick(course.id_cours)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition duration-150"
                                >
                                    Détails
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ListeCoursEtudiant;