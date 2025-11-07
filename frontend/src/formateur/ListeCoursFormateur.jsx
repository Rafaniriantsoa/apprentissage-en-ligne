import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Users, Clock, AlertTriangle, ArrowLeft, Edit, Settings, HelpCircle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ListeCoursFormateur = () => {
    const API_URL = 'http://localhost/projet-plateforme/backend/api/formateur/listerCoursPubliesDetail.php';
    const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}');
    const idFormateur = utilisateur.id_utilisateur;
    const navigate = useNavigate();

    const [cours, setCours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // NOUVEAUX ÉTATS POUR LA MODALE D'ACTIONS (Récupérés de ListeCours.jsx)
    const [selectedCours, setSelectedCours] = useState(null);
    const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);

    // --- FONCTIONS DE GESTION DES ACTIONS ET NAVIGATION ---

    // Réutilisation de la fonction de navigation de ListeCours.jsx
    const handleActionClick = (path) => {
        handleCloseActionsModal();
        // L'ID du cours est déjà stocké par handleOpenActions
        navigate(path);
    };

    // Fonction qui ouvre la modale et stocke les données dans localStorage
    const handleOpenActions = (coursData) => {
        // Stocke les informations nécessaires pour les pages de gestion
        localStorage.setItem('cours_id_courant', coursData.id_cours);
        localStorage.setItem('cours_selectionne', JSON.stringify(coursData));

        setSelectedCours(coursData);
        setIsActionsModalOpen(true);
    };

    const handleCloseActionsModal = () => {
        setIsActionsModalOpen(false);
    };
    
    // Ancien "handleManageCourse" remplacé par l'appel à handleOpenActions
    // La fonction n'est plus nécessaire telle quelle, le bouton appellera directement handleOpenActions

    // --- Récupération des données ---
    useEffect(() => {
        const fetchCours = async () => {
            if (!idFormateur) {
                setError("ID Formateur manquant. Veuillez vous reconnecter.");
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${API_URL}?id_formateur=${idFormateur}`);
                
                if (response.data.success) {
                    setCours(response.data.cours || []);
                } else {
                    setCours([]);
                }
                
            } catch (err) {
                console.error("Erreur de chargement des cours:", err.response || err);
                setError("Impossible de charger la liste des cours publiés. Vérifiez l'API.");
            } finally {
                setLoading(false);
            }
        };
        fetchCours();
    }, [idFormateur]);


    if (loading) return (
        <div className="max-w-7xl mx-auto p-6 lg:p-8 pt-10 text-center text-lg">
            <Clock className="w-6 h-6 animate-spin inline-block mr-2 text-indigo-600" /> 
            Chargement de vos cours...
        </div>
    );
    
    if (error) return (
        <div className="max-w-7xl mx-auto p-6 lg:p-8 pt-10">
            <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center">
                <AlertTriangle className="w-5 h-5 inline mr-3" />
                <p>{error}</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-6 lg:p-8 pt-10 bg-gray-50 min-h-screen">
            
            {/* Bouton de Retour */}
            <button 
                onClick={() => navigate('/')}
                className="mb-6 inline-flex items-center text-indigo-600 hover:text-indigo-800 transition duration-150 font-medium"
            >
                <ArrowLeft className="w-5 h-5 mr-2" /> Retour au Tableau de Bord
            </button>
            
            {/* Titre Principal */}
            <h1 className="text-4xl font-extrabold text-gray-900 mb-8 border-b pb-3 flex items-center">
                <BookOpen className="w-8 h-8 mr-3 text-green-600" /> 
                Mes Cours Publiés ({cours.length})
            </h1>
            
            {/* Liste des Cours */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cours.map((c) => (
                    <div 
                        key={c.id_cours} 
                        className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transition duration-300 hover:shadow-xl"
                    >
                        {/* Image du cours */}
                        <div className="h-40 w-full overflow-hidden bg-gray-100 flex items-center justify-center">
                            {c.photo ? (
                                <img 
                                    src={`http://localhost/projet-plateforme/backend/api/formateur/${c.photo}`} 
                                    alt={`Couverture de ${c.titre}`} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-gray-400 text-lg">Aucune image</div>
                            )}
                        </div>

                        <div className="p-5">
                            <h2 className="text-xl font-bold text-gray-900 mb-2 truncate">{c.titre}</h2>
                            <p className="text-sm text-gray-500 line-clamp-3 mb-4">{c.description || "Aucune description détaillée."}</p>
                            
                            {/* Statistiques */}
                            <div className="flex items-center justify-between border-t pt-3">
                                <div className="flex items-center text-indigo-700 text-sm font-semibold">
                                    <Users className="w-4 h-4 mr-2" />
                                    <span>{c.nombre_inscrits || 0} Inscrits</span>
                                </div>

                                {/* Bouton d'action pour le formateur */}
                                <button 
                                    onClick={() => handleOpenActions(c)}
                                    className="inline-flex items-center text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition duration-150 shadow-md"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Gérer le Cours
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Message d'absence de cours */}
            {cours.length === 0 && !loading && (
                <div className="mt-12 p-8 text-center bg-white rounded-xl shadow-inner border border-gray-200">
                    <p className="text-lg text-gray-600 font-medium">
                        Vous n'avez actuellement aucun cours publié.
                    </p>
                    <p className="mt-2 text-gray-500">
                        Cliquez sur le lien ci-dessous pour commencer à créer votre première formation !
                    </p>
                    <button 
                        onClick={() => navigate('/creer-cours')}
                        className="mt-6 inline-flex items-center text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg transition duration-150 shadow-lg"
                    >
                        <BookOpen className="w-5 h-5 mr-2" /> Créer un nouveau cours
                    </button>
                </div>
            )}
            
            {/* 1. Modale des Actions (Copie du JSX de ListeCours.jsx) */}
            {isActionsModalOpen && selectedCours && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={handleCloseActionsModal}>
                    <div className="bg-white rounded-xl shadow-3xl p-7 w-full max-w-sm transform transition-all duration-300 scale-100" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-gray-900 mb-5 border-b pb-3 flex items-center">
                            <Settings size={20} className="mr-3 text-indigo-600" />
                            <span className="ml-1 text-indigo-600 line-clamp-1">{selectedCours.titre}</span>
                        </h3>

                        <div className="space-y-3">
                            {/* Navigation vers la page de modification */}
                            <button
                                onClick={() => handleActionClick('/modifier-cours')} 
                                className="w-full py-3 px-4 text-left font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition duration-200 flex items-center space-x-3 shadow-sm"
                            >
                                <Edit size={18} />
                                <span>Modifier les détails</span>
                            </button>

                            {/* Navigations statiques utilisant localStorage (ID du cours déjà stocké) */}
                            <button
                                onClick={() => handleActionClick('/gerer-lecon')} 
                                className="w-full py-3 px-4 text-left font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition duration-200 flex items-center space-x-3 shadow-sm"
                            >
                                <BookOpen size={18} />
                                <span>Gérer les Leçons</span>
                            </button>
                            <button
                                onClick={() => handleActionClick('/gerer-quiz')}
                                className="w-full py-3 px-4 text-left font-medium text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 transition duration-200 flex items-center space-x-3 shadow-sm"
                            >
                                <HelpCircle size={18} />
                                <span>Gérer les Quiz/Évaluations</span>
                            </button>
                            <button
                                onClick={() => handleActionClick('/consulter-cours')}
                                className="w-full py-3 px-4 text-left font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition duration-200 flex items-center space-x-3 shadow-sm"
                            >
                                <Eye size={18} />
                                <span>Voir le cours</span>
                            </button>
                        </div>

                        <div className="mt-6 text-right">
                            <button
                                onClick={handleCloseActionsModal}
                                className="px-5 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-200"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListeCoursFormateur;