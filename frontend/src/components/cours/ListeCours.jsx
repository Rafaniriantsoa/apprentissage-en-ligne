import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft,PlusCircle, Settings, Trash2, Edit, BookOpen, HelpCircle, Eye, Loader2, XCircle, CheckCircle, Clock, LayoutList } from 'lucide-react';

const ListeCours = () => {

    // les URLs des APIs
    const LIST_API_URL = 'http://localhost/projet-plateforme/backend/api/formateur/listeCours.php';
    const DELETE_API_URL = 'http://localhost/projet-plateforme/backend/api/formateur/supprimerCours.php';
    // UPDATE_API_URL est déplacé vers ModifierCours.jsx

    // racine URL du backend.
    const FILE_BASE_URL = 'http://localhost/projet-plateforme/backend/api/formateur/';

    const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}');
    const idFormateur = utilisateur.id_utilisateur;
    const navigate = useNavigate();

    // États du composant principal
    const [cours, setCours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // États pour gérer les modales
    const [selectedCours, setSelectedCours] = useState(null);
    const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
    // const [isEditModalOpen, setIsEditModalOpen] = useState(false); <-- SUPPRIMÉ

    // ÉTATS POUR LA SUPPRESSION
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [coursToDelete, setCoursToDelete] = useState(null);

    // Les états du formulaire de modification sont déplacés vers ModifierCours.jsx

    // 1. FONCTIONS DE CHARGEMENT & GESTION DE LA SUPPRESSION

    const fetchCours = async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');

        if (!idFormateur) {
            setError("ID Formateur introuvable. Veuillez vous reconnecter.");
            setLoading(false);
            return;
        }

        try {
            const API_URL = `${LIST_API_URL}?id_formateur=${idFormateur}`;
            const response = await axios.get(API_URL);
            setCours(response.data.cours || []);

        } catch (err) {
            console.error("Erreur de chargement des cours:", err.response || err);
            setError(err.response?.data?.message || "Aucun cours trouvé pour le moment.");
            setCours([]);
        } finally {
            setLoading(false);
        }
    };


    //   Ouvre la modale de confirmation pour la suppression.

    const handleOpenDeleteModal = (idCours) => {
        const course = cours.find(c => c.id_cours === idCours);
        if (course) {
            setCoursToDelete(course);
            setIsDeleteModalOpen(true);
        }
    };

    //  Exécute l'appel API de suppression après confirmation.

    const confirmDelete = async () => {
        if (!coursToDelete) return;

        const idCours = coursToDelete.id_cours;

        setIsDeleteModalOpen(false);
        setCoursToDelete(null);

        try {
            const dataToSend = {
                id_cours: idCours,
                id_formateur: idFormateur
            };

            const response = await axios.post(DELETE_API_URL, dataToSend);

            setSuccessMessage(response.data.message || "Cours supprimé avec succès !");
            fetchCours();

        } catch (err) {
            console.error("Erreur de suppression:", err.response || err);
            setError(err.response?.data?.message || "Erreur lors de la suppression du cours.");
        }
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setCoursToDelete(null);
    };

    useEffect(() => {
        if (!idFormateur) return;
        fetchCours();
    }, [idFormateur]);


    // 2. GESTION DES MODALES D'ACTIONS (Mis à jour pour la navigation)

    const handleActionClick = (path, id_cours_to_save) => {
        handleCloseActionsModal();
        if (id_cours_to_save) {
            // Clé spécifique pour l'ID du cours en cours de gestion
            localStorage.setItem('cours_id_courant', id_cours_to_save);
        }
        navigate(path);
    };

    const handleOpenActions = (coursData) => {
        // Stocke les informations du cours pour les navigations vers d'autres pages
        localStorage.setItem('cours_id_courant', coursData.id_cours);
        localStorage.setItem('cours_selectionne', JSON.stringify(coursData));

        setSelectedCours(coursData);
        setIsActionsModalOpen(true);
    };

    const handleCloseActionsModal = () => {
        setIsActionsModalOpen(false);
    };

    // Fonctions de modification retirées (handleOpenEditModal, handleCloseEditModal, handleEditSubmit...)


    // 3. RENDU

    if (loading) return <div className="text-center p-10 text-lg font-semibold text-indigo-600 flex items-center justify-center"><Loader2 className="animate-spin mr-2" size={24} /> Chargement des cours en cours...</div>;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-extrabold text-gray-500 mb-6">Ma Liste de Cours</h1>

            {/* Messages de succès et d'erreur */}
            {successMessage && <div className="p-4 mb-5 text-sm font-medium text-green-800 bg-green-100 rounded-lg shadow-md flex items-center"><CheckCircle size={18} className="mr-2" />{successMessage}</div>}
            {error && <div className="p-4 mb-5 text-sm font-medium text-red-800 bg-red-100 rounded-lg shadow-md flex items-center"><XCircle size={18} className="mr-2" />Erreur : {error}</div>}

            <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition duration-150"
            >
                <ArrowLeft size={16} />
                <span>Retour au Tableau de Bord</span>
            </button>

            <div className="flex justify-end mb-8">
                <Link
                    to="/creer-cours"
                    className="flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition duration-300 shadow-lg transform hover:scale-[1.02]"
                >
                    <PlusCircle size={18} />
                    <span>Créer un nouveau cours</span>
                </Link>
            </div>

            {cours.length === 0 ? (
                <div className="p-16 text-center bg-white rounded-xl shadow-inner border border-dashed border-gray-300">
                    <p className="text-xl text-gray-500 font-medium">Vous n'avez pas encore créé de cours.</p>
                    <p className="mt-2 text-gray-400">Veuillez créer des cours pour commencer.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8">
                    {cours.map(coursItem => (
                        <div key={coursItem.id_cours} className="flex flex-col md:flex-row bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 transform hover:shadow-indigo-300/50 hover:border-indigo-400 transition duration-300 relative">

                            {/* Statut de publication déplacé en position absolute, haut-droite */}
                            <div className="absolute top-4 right-4 z-10 hidden md:block">
                                <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border shadow-lg ${coursItem.est_publie == 1
                                    ? 'bg-green-50 text-green-700 border-green-300'
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-300'
                                    }`}>
                                    {coursItem.est_publie == 1 ? (
                                        <><CheckCircle size={14} className="mr-1" /> Publié</>
                                    ) : (
                                        <><Clock size={14} className="mr-1" /> En attente</>
                                    )}
                                </span>
                            </div>


                            <div className="md:w-60 w-full h-48 md:h-auto flex-shrink-0">
                                <img
                                    src={coursItem.photo
                                        ? `${FILE_BASE_URL}${coursItem.photo}`
                                        : `${FILE_BASE_URL}/default.png`}
                                    alt={`Couverture de ${coursItem.titre}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="p-6 flex-grow flex flex-col justify-between">
                                <div>
                                    <h3 className="text-2xl font-extrabold text-gray-900 mb-1 leading-snug">
                                        {coursItem.titre}
                                    </h3>
                                    <p className="text-gray-500 mb-4 line-clamp-3 text-base">
                                        {coursItem.description}
                                    </p>

                                    {/*  Affichage du nombre de leçons */}
                                    <div className="flex items-center space-x-4 mb-3">
                                        <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                            <LayoutList size={14} className="mr-2" />
                                            {/* Assurez-vous que votre API PHP retourne nombre_lecons */}
                                            {coursItem.nombre_lecons ? `${coursItem.nombre_lecons} Leçon(s)` : '0 Leçon'}
                                        </span>
                                    </div>

                                    {/* Statut de publication affiché en bas à gauche sur mobile/petit écran (md:hidden) */}
                                    <div className="mb-3 block md:hidden">
                                        <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border ${coursItem.est_publie == 1
                                            ? 'bg-green-50 text-green-700 border-green-300'
                                            : 'bg-yellow-50 text-yellow-700 border-yellow-300'
                                            }`}>
                                            {coursItem.est_publie == 1 ? (
                                                <><CheckCircle size={14} className="mr-1" /> Publié</>
                                            ) : (
                                                <><Clock size={14} className="mr-1" /> En attente</>
                                            )}
                                        </span>
                                    </div>

                                    <p className="text-xs text-gray-400 font-medium">
                                        Créé le: <span className="font-semibold">{new Date(coursItem.dateCreation).toLocaleDateString()}</span>
                                    </p>
                                </div>

                                <div className="mt-5 flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex space-x-3">
                                        {/* Bouton pour ouvrir la Modale d'Actions */}
                                        <button
                                            onClick={() => handleOpenActions(coursItem)}
                                            className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition duration-300 shadow-lg shadow-indigo-300/50"
                                        >
                                            <Settings size={16} />
                                            <span>Gérer ce cours </span>
                                        </button>

                                        {/* Supprimer - Bouton séparé pour la suppression immédiate */}
                                        <button
                                            onClick={() => handleOpenDeleteModal(coursItem.id_cours)}
                                            className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition duration-150 flex items-center space-x-1 border border-red-300"
                                        >
                                            <Trash2 size={16} />
                                            <span>Supprimer</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 1. Modale des Actions (Afficher les options) */}
            {isActionsModalOpen && selectedCours && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={handleCloseActionsModal}>
                    <div className="bg-white rounded-xl shadow-3xl p-7 w-full max-w-sm transform transition-all duration-300 scale-100" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-gray-900 mb-5 border-b pb-3 flex items-center">
                            <Settings size={20} className="mr-3 text-indigo-600" />
                            <span className="ml-1 text-indigo-600 line-clamp-1">{selectedCours.titre}</span>
                        </h3>

                        <div className="space-y-3">
                            {/* CHANGEMENT CLÉ : Navigue vers la nouvelle page /modifier-cours */}
                            <button
                                onClick={() => handleActionClick('/modifier-cours', selectedCours.id_cours)}
                                className="w-full py-3 px-4 text-left font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition duration-200 flex items-center space-x-3 shadow-sm"
                            >
                                <Edit size={18} />
                                <span>Modifier les détails</span>
                            </button>

                            {/* Navigations statiques utilisant localStorage */}
                            <button
                                onClick={() => handleActionClick('/gerer-lecon', selectedCours.id_cours)}
                                className="w-full py-3 px-4 text-left font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition duration-200 flex items-center space-x-3 shadow-sm"
                            >
                                <BookOpen size={18} />
                                <span>Gérer les Leçons</span>
                            </button>
                            <button
                                onClick={() => handleActionClick('/gerer-quiz', selectedCours.id_cours)}
                                className="w-full py-3 px-4 text-left font-medium text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 transition duration-200 flex items-center space-x-3 shadow-sm"
                            >
                                <HelpCircle size={18} />
                                <span>Gérer les Quiz/Évaluations</span>
                            </button>
                            <button
                                onClick={() => handleActionClick('/consulter-cours', selectedCours.id_cours)}
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

            {/* 2. Modale de Modification (Formulaire) - SUPPRIMÉ */}
            {/* 3. Modale de Confirmation de Suppression */}
            {isDeleteModalOpen && coursToDelete && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={handleCloseDeleteModal}>
                    <div className="bg-white rounded-xl shadow-3xl p-7 w-full max-w-md transform transition-all duration-300 scale-100" onClick={e => e.stopPropagation()}>

                        <h3 className="text-2xl font-bold text-red-600 mb-4 border-b pb-2 flex items-center space-x-2">
                            <Trash2 size={24} />
                            <span>Confirmation de Suppression</span>
                        </h3>

                        <p className="text-gray-700 mb-6 leading-relaxed">
                            Êtes-vous sûr de vouloir supprimer définitivement le cours **"{coursToDelete.titre}"** ?
                            <br /><br />
                            Cette action est <strong className="text-red-600">irréversible</strong> et entraînera la suppression de toutes les leçons et quiz associés.
                        </p>

                        <div className="flex justify-end space-x-3 pt-3">
                            <button
                                onClick={handleCloseDeleteModal}
                                className="px-5 py-2.5 text-sm   font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-200"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition duration-200 shadow-md shadow-red-300/50"
                            >
                                Confirmer la Suppression
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListeCours;