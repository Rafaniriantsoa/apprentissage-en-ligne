import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const ListeCours = () => {

    // Définition des URLs des APIs
    const LIST_API_URL = 'http://localhost/projet-plateforme/backend/api/formateur/listeCours.php';
    const DELETE_API_URL = 'http://localhost/projet-plateforme/backend/api/formateur/supprimerCours.php';
    const UPDATE_API_URL = 'http://localhost/projet-plateforme/backend/api/formateur//modifierCours.php';

    // Correction de l'URL de base pour pointer vers la racine du back, et non /api/formateurs/
    const BASE_URL = 'http://localhost/projet-plateforme/backend/api/formateur/';

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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // NOUVEAUX ÉTATS POUR LA SUPPRESSION PERSONNALISÉE
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [coursToDelete, setCoursToDelete] = useState(null);

    // État du formulaire de modification
    const [editFormData, setEditFormData] = useState({
        titre: '',
        description: '',
        nouvelle_photo: null,
        photo_actuelle: '',
        // AJOUT DU CHAMP 'est_publie' (initialisé comme string '0' ou '1')
        est_publie: '0', 
    });
    const [editError, setEditError] = useState('');
    const [editLoading, setEditLoading] = useState(false);


    // ==========================================================
    // 1. FONCTIONS DE CHARGEMENT & GESTION DE LA SUPPRESSION
    // ==========================================================

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
            // S'assurer que les données retournées par le back-end contiennent bien 'est_publie'
            setCours(response.data.cours || []);

        } catch (err) {
            console.error("Erreur de chargement des cours:", err.response || err);
            setError(err.response?.data?.message || "Aucun cours trouvé pour le moment.");
            setCours([]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Ouvre la modale de confirmation pour la suppression.
     * @param {number} idCours - L'ID du cours à supprimer.
     */
    const handleOpenDeleteModal = (idCours) => {
        const course = cours.find(c => c.id_cours === idCours);
        if (course) {
            setCoursToDelete(course);
            setIsDeleteModalOpen(true);
        }
    };

    /**
     * Exécute l'appel API de suppression après confirmation.
     */
    const confirmDelete = async () => {
        if (!coursToDelete) return;

        const idCours = coursToDelete.id_cours;

        // 1. Fermer la modale et réinitialiser l'état
        setIsDeleteModalOpen(false);
        setCoursToDelete(null);

        // 2. Exécuter la suppression
        try {
            const dataToSend = {
                id_cours: idCours,
                id_formateur: idFormateur // Sécurité: envoie l'ID du formateur pour validation côté PHP
            };

            const response = await axios.post(DELETE_API_URL, dataToSend);

            setSuccessMessage(response.data.message || "Cours supprimé avec succès !");
            fetchCours(); // Recharger la liste après suppression

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


    // ==========================================================
    // 2. GESTION DES MODALES D'ACTIONS ET DE MODIFICATION
    // ==========================================================

    const handleOpenActions = (coursData) => {
        localStorage.setItem('cours_selectionne', JSON.stringify({
            id_cours: coursData.id_cours,
            titre: coursData.titre,
            photo: coursData.photo,
        }));

        setSelectedCours(coursData);
        setIsActionsModalOpen(true);
    };

    const handleCloseActionsModal = () => {
        setIsActionsModalOpen(false);
    };

    const handleOpenEditModal = () => {
        if (selectedCours) {
            setEditFormData({
                titre: selectedCours.titre,
                description: selectedCours.description,
                nouvelle_photo: null,
                photo_actuelle: selectedCours.photo,
                // Initialise est_publie avec la valeur du cours (convertie en chaîne pour le select)
                est_publie: String(selectedCours.est_publie || 0), 
            });
            setEditError('');
            handleCloseActionsModal();
            setIsEditModalOpen(true);
        }
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedCours(null);
        setEditFormData({ titre: '', description: '', nouvelle_photo: null, photo_actuelle: '', est_publie: '0' });
    };

    const handleActionClick = (path) => {
        handleCloseActionsModal();
        navigate(path);
    };

    // ==========================================================
    // 3. GESTION DU FORMULAIRE DE MODIFICATION
    // ==========================================================

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleEditFileChange = (e) => {
        setEditFormData(prevData => ({ ...prevData, nouvelle_photo: e.target.files[0] }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditError('');
        setEditLoading(true);

        const form = new FormData();
        form.append('id_cours', selectedCours.id_cours);
        form.append('id_formateur', idFormateur);
        form.append('titre', editFormData.titre);
        form.append('description', editFormData.description);
        form.append('photo_actuelle', editFormData.photo_actuelle);
        // AJOUT : Envoi du statut de publication à l'API
        form.append('est_publie', editFormData.est_publie); 

        if (editFormData.nouvelle_photo) {
            form.append('photo', editFormData.nouvelle_photo);
        }

        try {
            const response = await axios.post(UPDATE_API_URL, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setSuccessMessage(response.data.message || "Cours mis à jour avec succès !");
            handleCloseEditModal();
            fetchCours();

        } catch (err) {
            console.error("Erreur de modification:", err.response || err);
            setEditError(err.response?.data?.message || "Échec de la modification du cours.");
        } finally {
            setEditLoading(false);
        }
    };

    console.log(cours)

    // ==========================================================
    // 4. RENDU
    // ==========================================================

    // URL de l'image pour la prévisualisation dans la modale d'édition
    const currentPhotoUrl = editFormData.nouvelle_photo
        ? URL.createObjectURL(editFormData.nouvelle_photo)
        : (editFormData.photo_actuelle ? BASE_URL + editFormData.photo_actuelle : BASE_URL + 'uploads/cours/default/9.jpg');


    if (loading) return <div className="text-center p-10">Chargement des cours...</div>;
    // if (error && cours.length === 0) return <div className="text-center p-10 text-red-600">Erreur : {error}</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 mt-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">
                Mes Cours Créés ({cours.length})
            </h2>

            {successMessage && <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">{successMessage}</div>}
            {error && cours.length > 0 && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">Erreur : {error}</div>}

            <div className="flex justify-end mb-6">
                <Link
                    to="/creer-cours"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition duration-150 shadow-md"
                >
                    + Créer un nouveau cours
                </Link>
            </div>

            {cours.length === 0 ? (
                <div className="p-10 text-center bg-gray-100 rounded-lg shadow">
                    <p className="text-lg text-gray-600">Vous n'avez pas encore créé de cours.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {cours.map(coursItem => (
                        <div key={coursItem.id_cours} className="flex bg-white rounded-lg shadow-xl overflow-hidden border border-gray-100">

                            <img
                                src={coursItem.photo
                                    ? `${BASE_URL}${coursItem.photo}`
                                    : `${BASE_URL}default.jpg`}
                                alt={`Couverture de ${coursItem.titre}`}
                                className="w-48 h-auto object-cover flex-shrink-0"
                            />

                            <div className="p-4 flex-grow flex flex-col justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-indigo-700 mb-1">
                                        {coursItem.titre}
                                    </h3>
                                    <p className="text-gray-600 mb-3 line-clamp-2 text-sm">
                                        {coursItem.description}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Créé le: {new Date(coursItem.dateCreation).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="mt-4 space-x-3 flex items-center flex-wrap">

                                    {/* Bouton pour ouvrir la Modale d'Actions */}
                                    <button
                                        onClick={() => handleOpenActions(coursItem)}
                                        className="px-3 py-1 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 transition duration-150 shadow-md"
                                    >
                                        ⚙️ Actions
                                    </button>

                                    {/* 🗑️ Supprimer - Appelle la nouvelle fonction pour la modale */}
                                    <button
                                        onClick={() => handleOpenDeleteModal(coursItem.id_cours)}
                                        className="text-sm font-medium text-red-600 hover:text-red-800 transition duration-150"
                                    >
                                        🗑️ Supprimer
                                    </button>
                                </div>

                                {/* Affichage du statut de publication (MODIFIÉ) */}
                                <div className="mt-2">
                                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                                        coursItem.est_publie == 1
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {coursItem.est_publie == 1 ? "✅ Publié" : "⏳ En attente"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 1. Modale des Actions (Afficher les options) */}
            {isActionsModalOpen && selectedCours && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                            Actions pour : {selectedCours.titre}
                        </h3>

                        <div className="space-y-3">
                            <button
                                onClick={handleOpenEditModal}
                                className="w-full py-2 px-4 text-left text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition duration-150 flex items-center"
                            >
                                ✏️ Modifier les détails (Pop-up)
                            </button>

                            <button
                                onClick={() => handleActionClick(`/gerer-lecon`)}
                                // onClick={() => handleActionClick(`/gerer-lecon?id_cours=${selectedCours.id_cours}`)}
                                className="w-full py-2 px-4 text-left text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition duration-150 flex items-center"
                            >
                                📖 Gérer les Leçons
                            </button>
                            <button
                                onClick={() => handleActionClick(`/gerer-quiz`)}
                                // onClick={() => handleActionClick(`/formateur/cours/quiz/${selectedCours.id_cours}`)}
                                className="w-full py-2 px-4 text-left text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 transition duration-150 flex items-center"
                            >
                                ❓ Gérer les Quiz/Évaluations
                            </button>
                            <button
                                onClick={() => handleActionClick(`/consulter-cours/${selectedCours.id_cours}`)}
                                className="w-full py-2 px-4 text-left text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition duration-150 flex items-center"
                            >
                                 Voir le cours (Page publique)
                            </button>
                        </div>

                        <div className="mt-6 text-right">
                            <button
                                onClick={handleCloseActionsModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Modale de Modification (Formulaire) - MODIFIÉE */}
            {isEditModalOpen && selectedCours && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                            ✏️ Modifier "{selectedCours.titre}"
                        </h3>

                        {editError && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{editError}</div>}

                        <form onSubmit={handleEditSubmit} className="space-y-5">

                            {/* Prévisualisation Image */}
                            <div className="text-center">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Image actuelle / Prévisualisation</label>
                                <img
                                    src={currentPhotoUrl}
                                    alt="Couverture actuelle"
                                    className="w-full h-32 object-cover rounded-md border border-gray-200 mx-auto"
                                />
                            </div>

                            {/* Champ Photo */}
                            <div>
                                <label htmlFor="nouvelle_photo" className="block text-sm font-medium text-gray-700">Changer l'Image</label>
                                <input
                                    type="file"
                                    id="nouvelle_photo"
                                    name="nouvelle_photo"
                                    accept="image/*"
                                    onChange={handleEditFileChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                />
                            </div>

                            {/* Champ Titre */}
                            <div>
                                <label htmlFor="titre" className="block text-sm font-medium text-gray-700">Titre</label>
                                <input
                                    type="text"
                                    name="titre"
                                    value={editFormData.titre}
                                    onChange={handleEditChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                    required
                                />
                            </div>

                            {/* Champ Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    name="description"
                                    value={editFormData.description}
                                    onChange={handleEditChange}
                                    rows="4"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                    required
                                />
                            </div>

                            {/* NOUVEAU CHAMP : Statut de Publication */}
                            {/* <div>
                                <label htmlFor="est_publie" className="block text-sm font-medium text-gray-700">Statut de Publication</label>
                                <select
                                    id="est_publie"
                                    name="est_publie"
                                    value={editFormData.est_publie}
                                    onChange={handleEditChange}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                    <option value="0">En attente (Non publié)</option>
                                    <option value="1">Publié</option>
                                </select>
                            </div> */}

                            <div className="flex justify-end space-x-3 pt-3">
                                <button
                                    type="button"
                                    onClick={handleCloseEditModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 transition duration-150"
                                >
                                    {editLoading ? 'Sauvegarde...' : 'Sauvegarder les Modifications'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. NOUVELLE MODALE DE CONFIRMATION DE SUPPRESSION */}
            {isDeleteModalOpen && coursToDelete && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm">

                        <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center">
                            ⚠️ Confirmation de Suppression
                        </h3>

                        <p className="text-gray-700 mb-6">
                            Êtes-vous sûr de vouloir supprimer définitivement le cours **"{coursToDelete.titre}"** ?
                            <br /><br />
                            Cette action est **irréversible** et entraînera la suppression de toutes les leçons et quiz associés.
                        </p>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleCloseDeleteModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition duration-150"
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