// ConsulterCours.jsx (Avec Icones Améliorées)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
// Import des icones nécessaires
import { Lock, User, BookOpen, ChevronLeft, Zap, Info } from 'lucide-react'; 

const ConsultationCours = () => {

    const { idCours } = useParams(); 
    const navigate = useNavigate();

    // URLs API
    const PUBLIC_API_BASE = 'http://localhost/projet-plateforme/backend/api/visiteur/';
    const DETAIL_API_URL = `${PUBLIC_API_BASE}detailCoursPublic.php`; 
    
    // États du composant
    const [course, setCourse] = useState(null);
    const [lecons, setLecons] = useState([]);
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [leconCourante, setLeconCourante] = useState(null);

    const idCourseToFetch = idCours || localStorage.getItem('cours_id_courant_public');


    const fetchCourseDetails = async () => {
        setLoading(true);
        setError('');

        if (!idCourseToFetch) {
            setError("Aucun ID de cours n'a été fourni. Redirection vers le catalogue...");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${DETAIL_API_URL}?id_cours=${idCourseToFetch}`); 

            if (response.data.success) {
                const data = response.data;
                setCourse(data.cours);
                setLecons(data.lecons.map(l => ({ 
                    id_lecon: l.id_lecon, 
                    titre_lecon: l.titre_lecon, 
                    ordre: l.ordre 
                })) || []); 
                setQuiz(data.quiz || null); 
            } else {
                setError(response.data.message || "Détails du cours introuvables ou non publiés.");
            }

        } catch (err) {
            console.error("Erreur de chargement des détails du cours:", err.response || err);
            setError(`Erreur lors du chargement : ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourseDetails();
    }, [idCourseToFetch]);
    
    // Gère la redirection si l'ID provient uniquement de localStorage
    useEffect(() => {
        if (!idCours && idCourseToFetch) {
            navigate(`/cours/${idCourseToFetch}`, { replace: true });
        }
    }, [idCours, idCourseToFetch, navigate]);


    // --- Composant de restriction du contenu (avec icônes) ---
    const renderContentPlaceholder = () => {
        return (
            <div className="p-12 bg-gray-50 border-4 border-dashed border-gray-300 rounded-lg shadow-inner text-center">
                <h4 className="text-2xl font-bold text-gray-800 mb-3 flex items-center justify-center">
                    <Lock className='mr-2 h-6 w-6'/> Contenu Réservé aux Membres
                </h4>
                <p className="text-gray-700 mb-6 max-w-lg mx-auto">
                    Pour accéder au contenu de cette leçon et participer au quiz, vous devez vous inscrire et être connecté.
                </p>
                {/* Structure responsive des boutons */}
                <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 justify-center">
                    <Link
                        to="/inscrire"
                        className="px-6 py-3 text-white bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200 shadow-md w-full sm:w-auto flex items-center justify-center"
                    >
                        <Zap className='mr-2 h-5 w-5'/> S'inscrire (Gratuit)
                    </Link>
                    <Link
                        to="/connexion"
                        className="px-6 py-3 text-indigo-600 border border-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition duration-200 w-full sm:w-auto flex items-center justify-center"
                    >
                        <User className='mr-2 h-5 w-5'/> Se connecter
                    </Link>
                </div>
            </div>
        );
    };


    if (loading) return <div className="text-center p-10 text-lg font-medium text-indigo-600">Chargement des détails du cours...</div>;
    if (error || !course) return <div className="text-center p-10 text-red-600 bg-red-100 rounded-lg max-w-xl mx-auto mt-10"><h3 className="font-bold text-lg">Erreur</h3><p>{error}</p><Link to="/formations" className="mt-4 text-indigo-500 hover:underline">Retour au catalogue</Link></div>;

    return (
        <div className="max-w-7xl mx-auto p-6 mt-10">
            
            <Link to="/formations" className="text-indigo-600 hover:underline mb-6 font-medium flex items-center">
                <ChevronLeft className='mr-1 h-5 w-5'/> Retour au Catalogue des Formations
            </Link>

            {/* EN-TÊTE : Formateur et Photo */}
            <div className="mb-4">
                <div className="flex items-center text-lg text-gray-600 mb-2">
                    {/* Image du Formateur */}
                    {course.photo_formateur ? (
                        <img
                            src={`http://localhost/projet-plateforme/backend/api/visiteur/${course.photo_formateur}`} 
                            alt={`Photo de ${course.formateur}`}
                            className="w-12 h-12 object-cover rounded-full mr-3 border-2 border-indigo-500 shadow-md"
                        />
                    ) : (
                        <User className='w-12 h-12 text-gray-400 p-2 border-2 border-gray-300 rounded-full mr-3'/>
                    )}
                    
                    {/* Nom et Rôle */}
                    <div>
                        <p className="text-sm text-gray-500">Formateur :</p>
                        <span className="text-xl font-bold text-indigo-700">{course.formateur}</span>
                    </div>
                </div>
                <hr className="mt-2 mb-4"/> 
            </div>
            
            {/* TITRE DU COURS */}
            <h2 className="text-4xl font-extrabold text-gray-900 mb-8">{course.titre}</h2>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Sommaire Visible pour le Visiteur */}
                <div className="lg:col-span-1">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center">
                        <BookOpen className='mr-2 h-6 w-6 text-indigo-600'/> Sommaire du Cours
                    </h3>
                    <div className="space-y-2">
                        
                        {/* Liste des titres de leçons */}
                        {lecons.sort((a, b) => a.ordre - b.ordre).map((lecon) => (
                            <button
                                key={lecon.id_lecon}
                                onClick={() => setLeconCourante(lecon)}
                                className={`w-full text-left p-3 rounded-lg transition duration-150 flex items-center ${leconCourante?.id_lecon === lecon.id_lecon 
                                    ? 'bg-indigo-600 text-white shadow-lg' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                <span className="font-bold mr-2">{lecon.ordre}.</span>
                                {lecon.titre_lecon}
                                <Lock className='ml-auto h-4 w-4 opacity-70'/> {/* Icône de verrou sur chaque leçon */}
                            </button>
                        ))}

                        {/* Affichage du Quiz (bloqué) */}
                        {quiz && (
                            <div className="pt-4 border-t mt-4">
                                <div className="w-full text-left p-3 rounded-lg bg-orange-100 text-orange-800 font-bold border border-orange-200 flex items-center">
                                    <Zap className='mr-2 h-5 w-5'/> Quiz
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Contenu principal : Description ou Message de Restriction */}
                <div className="lg:col-span-3">
                    <div className="bg-white p-6 rounded-lg shadow-2xl border border-gray-100 min-h-[400px] flex flex-col justify-center">
                        
                        {leconCourante ? (
                            // Si une leçon est sélectionnée : AFFICHER LA RESTRICTION
                            <>
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                                    {leconCourante.titre_lecon}
                                </h3>
                                {renderContentPlaceholder()}
                            </>
                        ) : (
                            // Écran initial : Afficher la description du cours
                            <div className="p-4">
                                <p className="text-gray-700 mb-6">{course.description}</p>
                                <div className="p-6 bg-indigo-50 rounded-lg text-center">
                                    <p className="text-indigo-700 text-lg font-semibold">
                                        Sélectionnez un titre de leçon pour voir l'aperçu et les modalités d'accès.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsultationCours;