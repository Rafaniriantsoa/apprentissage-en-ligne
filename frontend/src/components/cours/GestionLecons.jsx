import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const GestionLecons = () => {
    // --- Configuration API et données utilisateur ---
    const API_BASE_URL = 'http://localhost/projet-plateforme/backend/api/formateur/';
    const CREATE_LECON_API_URL = API_BASE_URL + 'creerLecon.php';
    const LIST_LECONS_API_URL = API_BASE_URL + 'listerLecons.php';
    const MODIFY_LECON_API_URL = API_BASE_URL + 'modifierLecon.php';
    const DELETE_LECON_API_URL = API_BASE_URL + 'supprimerLecon.php';
    const COURSE_DETAIL_API_URL = API_BASE_URL + 'detailCours.php';

    const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}');
    const idFormateur = utilisateur.id_utilisateur;
    const cours = JSON.parse(localStorage.getItem('cours_selectionne') || '{}');
    const idCours = cours.id_cours;

    // --- États généraux ---
    const [courseTitle, setCourseTitle] = useState("Chargement du cours...");
    const [lecons, setLecons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- États pour la Création ---
    const [newLeconData, setNewLeconData] = useState({
        titre: '',
        fichier: null,
        ordre: 1,
    });

    // --- États pour la Modification (Modale) ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [leconToEdit, setLeconToEdit] = useState(null);
    const [editFormData, setEditFormData] = useState({ titre: '', ordre: 1, fichier: null, oldFichier: '' });
    
    // --- États pour la Suppression (Modale) ---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [leconToDelete, setLeconToDelete] = useState(null);


    // ==========================================================
    // 1. FONCTIONS DE CHARGEMENT et RECHARGEMENT
    // ==========================================================

    const fetchCourseAndLecons = async () => {
        setLoading(true);
        setError('');

        if (!idCours || !idFormateur) {
            setError("ID de cours ou de formateur manquant.");
            setLoading(false);
            return;
        }

        try {
            // Charger le titre du cours
            const courseResponse = await axios.get(`${COURSE_DETAIL_API_URL}?id_cours=${idCours}`);
            setCourseTitle(courseResponse.data.titre || "Titre inconnu");

            // Charger les leçons existantes
            const leconsResponse = await axios.get(`${LIST_LECONS_API_URL}?id_cours=${idCours}`);
            const existingLecons = leconsResponse.data.lecons || [];

            setLecons(existingLecons);
            // Calculer le prochain ordre
            const nextOrder = existingLecons.length > 0 ? Math.max(...existingLecons.map(l => parseInt(l.ordre))) + 1 : 1;
            setNewLeconData(prev => ({ ...prev, ordre: nextOrder }));

        } catch (err) {
            console.error("Erreur de chargement:", err.response || err);
            setError("Impossible de charger les détails ou les leçons du cours.");
            setLecons([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourseAndLecons();
    }, [idCours, idFormateur]);


    // ==========================================================
    // 2. GESTION DU FORMULAIRE DE CRÉATION
    // ==========================================================

    const handleLeconChange = (e) => {
        const { name, value } = e.target;
        setNewLeconData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleFileChange = (e) => {
        setNewLeconData(prevData => ({ ...prevData, fichier: e.target.files[0] }));
    };

    const handleLeconSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!newLeconData.fichier) {
            setError("Veuillez sélectionner un fichier (PDF, MP4, etc.) pour la leçon.");
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('id_cours', idCours);
        formData.append('id_formateur', idFormateur);
        formData.append('titre', newLeconData.titre);
        formData.append('ordre', newLeconData.ordre);
        formData.append('fichier', newLeconData.fichier);

        try {
            const response = await axios.post(CREATE_LECON_API_URL, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setSuccessMessage(response.data.message || "Leçon créée avec succès !");

            // Réinitialiser
            setNewLeconData(prev => ({ titre: '', fichier: null, ordre: prev.ordre + 1 }));
            document.getElementById('file-input').value = null; 

            fetchCourseAndLecons(); // Recharger la liste

        } catch (err) {
            console.error("Erreur création leçon:", err.response || err);
            setError(err.response?.data?.message || "Échec de la création de la leçon.");
        } finally {
            setIsSubmitting(false);
        }
    };


    // ==========================================================
    // 3. GESTION DE LA MODIFICATION (Modale)
    // ==========================================================

    const openEditModal = (lecon) => {
        setLeconToEdit(lecon);
        setEditFormData({
            titre: lecon.titre_lecon,
            ordre: parseInt(lecon.ordre),
            fichier: null, 
            oldFichier: lecon.contenu.split('/').pop() 
        });
        setIsEditModalOpen(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleEditFileChange = (e) => {
        setEditFormData(prevData => ({ ...prevData, fichier: e.target.files[0] }));
    };

    const handleLeconUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('id_lecon', leconToEdit.id_lecon);
        formData.append('id_formateur', idFormateur);
        formData.append('titre', editFormData.titre);
        formData.append('ordre', editFormData.ordre);
        
        if (editFormData.fichier) {
            formData.append('fichier', editFormData.fichier);
        }

        try {
            const response = await axios.post(MODIFY_LECON_API_URL, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setSuccessMessage(response.data.message || "Leçon modifiée avec succès !");
            setIsEditModalOpen(false);
            fetchCourseAndLecons(); 
        } catch (err) {
            console.error("Erreur modification leçon:", err.response || err);
            setError(err.response?.data?.message || "Échec de la modification de la leçon.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==========================================================
    // 4. GESTION DE LA SUPPRESSION (Modale)
    // ==========================================================

    const openDeleteModal = (lecon) => {
        setLeconToDelete(lecon);
        setIsDeleteModalOpen(true);
    };

    const handleLeconDelete = async () => {
        setError('');
        setSuccessMessage('');
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('id_lecon', leconToDelete.id_lecon);
        formData.append('id_formateur', idFormateur); // Autorisation

        try {
            const response = await axios.post(DELETE_LECON_API_URL, formData);

            setSuccessMessage(response.data.message || "Leçon supprimée avec succès.");
            setIsDeleteModalOpen(false);
            setLeconToDelete(null);
            fetchCourseAndLecons(); 
        } catch (err) {
            console.error("Erreur suppression leçon:", err.response || err);
            setError(err.response?.data?.message || "Échec de la suppression de la leçon.");
        } finally {
            setIsSubmitting(false);
        }
    };


    // ==========================================================
    // 5. RENDU DU COMPOSANT
    // ==========================================================

    if (loading) return <div className="text-center p-10">Chargement des leçons...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 mt-10">
            <Link to="/" className="text-indigo-600 hover:underline mb-4 block">
                ← Retour à la liste des cours
            </Link>

            <h2 className="text-3xl font-bold text-gray-800 mb-2">
                📖 Gestion des Leçons
            </h2>
            <h3 className="text-xl text-indigo-700 mb-6 border-b pb-2">
                Cours : **{courseTitle}** (ID: {idCours})
            </h3>

            {successMessage && <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">{successMessage}</div>}
            {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Colonne de Création de Leçon */}
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-xl border border-gray-100 h-fit">
                    <h4 className="text-2xl font-semibold mb-4 text-green-700">
                        Ajouter une nouvelle Leçon
                    </h4>
                    <form onSubmit={handleLeconSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="titre" className="block text-sm font-medium text-gray-700">Titre de la Leçon</label>
                            <input
                                type="text"
                                name="titre"
                                id="titre"
                                value={newLeconData.titre}
                                onChange={handleLeconChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="ordre" className="block text-sm font-medium text-gray-700">Ordre de la Leçon</label>
                            <input
                                type="number"
                                name="ordre"
                                id="ordre"
                                value={newLeconData.ordre}
                                onChange={handleLeconChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                min="1"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="fichier" className="block text-sm font-medium text-gray-700">Fichier (PDF ou Vidéo)</label>
                            <input
                                type="file"
                                name="fichier"
                                id="file-input"
                                accept="application/pdf,video/*"
                                onChange={handleFileChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting || !newLeconData.titre || !newLeconData.fichier}
                            className="w-full px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-400 transition duration-150"
                        >
                            {isSubmitting ? 'Téléchargement...' : 'Créer la Leçon'}
                        </button>
                    </form>
                </div>

                {/* Colonne des Leçons existantes */}
                <div className="lg:col-span-2">
                    <h4 className="text-2xl font-semibold mb-4 text-gray-700">
                        Liste des Leçons ({lecons.length})
                    </h4>
                    {lecons.length === 0 ? (
                        <div className="p-6 bg-gray-100 rounded-lg text-center text-gray-500">
                            Aucune leçon créée pour le moment.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {lecons.map(lecon => (
                                <div key={lecon.id_lecon} className="p-4 bg-white rounded-lg shadow flex justify-between items-center border-l-4 border-indigo-500">
                                    <div>
                                        <span className="font-bold text-lg mr-2">#{lecon.ordre}</span>
                                        <span className="font-medium text-gray-800">{lecon.titre_lecon}</span>
                                        <p className="text-sm text-gray-500 line-clamp-1">
                                            Fichier : <a
                                                href={`${API_BASE_URL}${lecon.contenu}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-500 hover:text-indigo-700 hover:underline font-semibold"
                                            >
                                                {lecon.contenu.split('/').pop()}
                                            </a>
                                        </p>
                                    </div>
                                    <div className="space-x-2">
                                        {/* Boutons d'action conditionnels */}
                                        {parseInt(lecon.id_formateur) === parseInt(idFormateur) && (
                                            <>
                                                <button 
                                                    onClick={() => openEditModal(lecon)}
                                                    className="text-sm text-indigo-600 hover:underline hover:text-indigo-800"
                                                >
                                                    Modifier
                                                </button>
                                                <button 
                                                    onClick={() => openDeleteModal(lecon)}
                                                    className="text-sm text-red-600 hover:underline hover:text-red-800"
                                                >
                                                    Supprimer
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODALE DE MODIFICATION --- */}
            {isEditModalOpen && leconToEdit && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-lg">
                        <h3 className="text-2xl font-bold mb-4 text-indigo-700">
                            Modifier la Leçon : #{leconToEdit.ordre}
                        </h3>
                        <form onSubmit={handleLeconUpdate} className="space-y-4">
                            
                            <div>
                                <label htmlFor="edit_titre" className="block text-sm font-medium text-gray-700">Nouveau Titre</label>
                                <input
                                    type="text"
                                    name="titre"
                                    id="edit_titre"
                                    value={editFormData.titre}
                                    onChange={handleEditChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="edit_ordre" className="block text-sm font-medium text-gray-700">Ordre</label>
                                <input
                                    type="number"
                                    name="ordre"
                                    id="edit_ordre"
                                    value={editFormData.ordre}
                                    onChange={handleEditChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="border p-3 rounded-md bg-gray-50">
                                <p className="text-sm text-gray-600 mb-2">Fichier actuel : <span className="font-semibold text-indigo-600">{editFormData.oldFichier}</span></p>
                                <label htmlFor="edit_fichier" className="block text-sm font-medium text-gray-700">
                                    Remplacer le fichier (Optionnel)
                                </label>
                                <input
                                    type="file"
                                    name="fichier"
                                    id="edit_fichier"
                                    accept="application/pdf,video/*"
                                    onChange={handleEditFileChange}
                                    className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm"
                                />
                                {editFormData.fichier && (
                                    <p className="text-xs mt-1 text-green-600">Nouveau fichier sélectionné : {editFormData.fichier.name}</p>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition duration-150"
                                    disabled={isSubmitting}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !editFormData.titre}
                                    className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 transition duration-150"
                                >
                                    {isSubmitting ? 'Mise à jour...' : 'Sauvegarder les modifications'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODALE DE SUPPRESSION --- */}
            {isDeleteModalOpen && leconToDelete && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-4 text-red-600">Confirmation de Suppression</h3>
                        <p className="mb-6 text-gray-700">
                            Êtes-vous sûr de vouloir supprimer la leçon : 
                            <span className="font-semibold block mt-1">
                                #{leconToDelete.ordre} - {leconToDelete.titre_lecon} ?
                            </span>
                            Cette action est irréversible et **supprimera définitivement le fichier associé**.
                        </p>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition duration-150"
                                disabled={isSubmitting}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleLeconDelete}
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

export default GestionLecons;