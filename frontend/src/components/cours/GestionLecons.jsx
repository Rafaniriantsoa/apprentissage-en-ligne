import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
// Importation des icônes Lucide React
import { 
    FileText, Video, Trash2, Edit, PlusCircle, BookOpen, Save, XCircle, Upload, CheckCircle, AlertTriangle, ArrowLeft, Files, FolderOpen
} from 'lucide-react';

// Fonction utilitaire pour déterminer l'icône et le texte du fichier
const getFileIconAndName = (filePath, fileObject) => {
    // Si un nouvel objet File est présent (pour l'upload)
    if (fileObject && fileObject.name) {
        const fileExtension = fileObject.name.split('.').pop().toLowerCase();
        if (fileExtension === 'pdf') {
            return { icon: <FileText className="size-5 text-red-500 mr-2" />, name: fileObject.name, type: 'Nouveau Fichier PDF' };
        } else if (['mp4', 'mov', 'avi', 'mkv'].includes(fileExtension)) {
            return { icon: <Video className="size-5 text-blue-500 mr-2" />, name: fileObject.name, type: 'Nouvelle Vidéo' };
        }
        return { icon: <Upload className="size-5 text-gray-500 mr-2" />, name: fileObject.name, type: 'Nouveau Fichier' };
    }
    // Si c'est un chemin existant de la BDD
    if (filePath) {
        const fileName = filePath.split('/').pop();
        const fileExtension = fileName.split('.').pop().toLowerCase();
        if (fileExtension === 'pdf') {
            return { icon: <FileText className="size-5 text-red-500 mr-2" />, name: fileName, type: 'Fichier PDF' };
        } else if (['mp4', 'mov', 'avi', 'mkv'].includes(fileExtension)) {
            return { icon: <Video className="size-5 text-blue-500 mr-2" />, name: fileName, type: 'Fichier Vidéo' };
        }
        return { icon: <Files className="size-5 text-gray-500 mr-2" />, name: fileName, type: 'Fichier de Leçon' };
    }
    return { icon: <FolderOpen className="size-5 text-gray-500 mr-2" />, name: 'Non spécifié', type: 'Inconnu' };
};


const GestionLecons = () => {
    // --- Configuration API et données utilisateur ---
    const API_BASE_URL = 'http://localhost/projet-plateforme/backend/api/formateur/';
    // Ajustement de l'URL pour un accès direct au dossier de fichiers (si différent de l'API)
    const FILE_BASE_URL = 'http://localhost/projet-plateforme/backend/api/formateur/'; 
    
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
        setSuccessMessage(''); // Effacer les messages de succès lors du rechargement

        if (!idCours || !idFormateur) {
            setError("ID de cours ou de formateur manquant. Veuillez revenir à la liste des cours.");
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
            setError(err.response?.data?.message || "Impossible de charger les détails ou les leçons du cours. (Vérifiez les chemins d'API)");
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

            // Réinitialiser le formulaire
            const nextOrder = newLeconData.ordre + 1;
            setNewLeconData({ titre: '', fichier: null, ordre: nextOrder });
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
        // Utilisation de .split('/').pop() pour obtenir seulement le nom du fichier
        const fileName = lecon.contenu ? lecon.contenu.split('/').pop() : 'Fichier non spécifié';
        setEditFormData({
            titre: lecon.titre_lecon,
            ordre: parseInt(lecon.ordre),
            fichier: null, 
            oldFichier: fileName 
        });
        setError(''); // Effacer l'erreur précédente avant d'ouvrir
        setSuccessMessage('');
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
        setError('');
        setSuccessMessage('');
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

    if (loading) return <div className="text-center p-10 text-xl font-medium text-gray-600">Chargement des leçons...</div>;

    // Aperçu du fichier pour la création
    const { icon: newFileIcon, name: newFileName, type: newFileType } = getFileIconAndName(null, newLeconData.fichier);
    // Aperçu du nouveau fichier pour la modification (s'il y en a un)
    const { icon: editFileIcon, name: editFileName, type: editFileType } = getFileIconAndName(null, editFormData.fichier);

    return (
        <div className="max-w-6xl mx-auto p-6 md:p-8 mt-4">
            <Link to="/liste-cours" className="text-indigo-600 hover:text-indigo-800 transition duration-150 mb-6 flex items-center font-medium">
                <ArrowLeft className="size-4 mr-2" /> Retour à la liste des cours
            </Link>

            <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <BookOpen className="size-7 mr-3 text-indigo-600" /> Gestion des Leçons
            </h2>
            <h3 className="text-xl text-indigo-700 mb-8 border-b pb-2">
                {courseTitle}
            </h3>

            {/* Messages d'alerte */}
            {successMessage && (
                <div className="p-4 mb-6 text-sm text-blue-700 bg-blue-50 border border-blue-300 rounded-lg flex items-center shadow-sm">
                    <CheckCircle className="size-5 mr-2" /> {successMessage}
                </div>
            )}
            {error && (
                <div className="p-4 mb-6 text-sm text-red-700 bg-red-50 border border-red-300 rounded-lg flex items-center shadow-sm">
                    <AlertTriangle className="size-5 mr-2" /> {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Colonne de Création de Leçon */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-fit">
                    <h4 className="text-2xl font-semibold mb-6 text-blue-700 flex items-center">
                        <PlusCircle className="size-6 mr-2" /> Ajouter une Leçon
                    </h4>
                    <form onSubmit={handleLeconSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="titre" className="block text-sm font-medium text-gray-700 mb-1">Titre de la Leçon</label>
                            <input
                                type="text"
                                name="titre"
                                id="titre"
                                value={newLeconData.titre}
                                onChange={handleLeconChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ajouter un titre . . ."
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="ordre" className="block text-sm font-medium text-gray-700 mb-1">Ordre de la Leçon</label>
                            <input
                                type="number"
                                name="ordre"
                                id="ordre"
                                value={newLeconData.ordre}
                                onChange={handleLeconChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                min="1"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="fichier" className="block text-sm font-medium text-gray-700 mb-1">Fichier (PDF ou Vidéo)</label>
                            <input
                                type="file"
                                name="fichier"
                                id="file-input"
                                accept="application/pdf,video/*"
                                onChange={handleFileChange}
                                className="mt-1 block w-full text-sm text-gray-500 
                                            file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 
                                            file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 
                                            hover:file:bg-blue-200 transition duration-150"
                                required
                            />
                             {/* Aperçu du fichier à uploader */}
                            {newLeconData.fichier && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-300 rounded-lg flex items-center text-sm font-medium shadow-inner">
                                    {newFileIcon}
                                    <span className="truncate flex-1">{newFileName}</span>
                                    <span className="ml-3 text-xs text-blue-600 font-bold p-1 rounded-md bg-blue-200">{newFileType}</span>
                                </div>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting || !newLeconData.titre || !newLeconData.fichier}
                            className="w-full px-4 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition duration-150 flex items-center justify-center font-semibold mt-6"
                        >
                            {isSubmitting ? 'Téléchargement...' : <><Save className="size-5 mr-2" /> Créer la Leçon</>}
                        </button>
                    </form>
                </div>

                {/* Colonne des Leçons existantes */}
                <div className="lg:col-span-2">
                    <h4 className="text-2xl font-semibold mb-4 text-gray-700 flex items-center border-b pb-2">
                        <Files className="size-6 mr-2" /> Leçons existantes ({lecons.length})
                    </h4>
                    {lecons.length === 0 ? (
                        <div className="p-8 bg-gray-100 rounded-xl text-center text-gray-500 flex items-center justify-center border border-dashed border-gray-300">
                            <AlertTriangle className="size-5 mr-2" /> Aucune leçon créée pour le moment.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {lecons.sort((a, b) => parseInt(a.ordre) - parseInt(b.ordre)).map(lecon => {
                                const { icon: leconIcon, name: leconFileName } = getFileIconAndName(lecon.contenu, null);
                                const isAuthor = parseInt(lecon.id_formateur) === parseInt(idFormateur);
                                
                                return (
                                    <div key={lecon.id_lecon} className="p-4 bg-white rounded-xl shadow-md flex justify-between items-center border-l-4 border-indigo-500 hover:shadow-lg transition duration-150">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center">
                                                <span className="font-extrabold text-xl mr-3 text-indigo-600">#{lecon.ordre}</span>
                                                <span className="font-medium text-lg text-gray-800 truncate">{lecon.titre_lecon}</span>
                                            </div>
                                            <p className="text-sm text-gray-500 line-clamp-1 mt-1 flex items-center">
                                                Fichier : 
                                                <a
                                                    href={`${FILE_BASE_URL}${lecon.contenu}`} 
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="ml-1 text-indigo-500 hover:text-indigo-700 hover:underline font-semibold flex items-center truncate"
                                                >
                                                    {leconIcon}
                                                    <span className="truncate">{leconFileName}</span>
                                                </a>
                                            </p>
                                        </div>
                                        {isAuthor && (
                                            <div className="space-x-1 flex-shrink-0">
                                                <button 
                                                    onClick={() => openEditModal(lecon)}
                                                    className="text-indigo-600 hover:text-indigo-800 transition duration-150 p-2 rounded-full hover:bg-indigo-50"
                                                    title="Modifier la leçon"
                                                >
                                                    <Edit className="size-5" />
                                                </button>
                                                <button 
                                                    onClick={() => openDeleteModal(lecon)}
                                                    className="text-red-600 hover:text-red-800 transition duration-150 p-2 rounded-full hover:bg-red-50"
                                                    title="Supprimer la leçon"
                                                >
                                                    <Trash2 className="size-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODALE DE MODIFICATION --- */}
            {isEditModalOpen && leconToEdit && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg">
                        <h3 className="text-2xl font-bold mb-6 text-indigo-700 flex items-center border-b pb-2">
                            <Edit className="size-6 mr-2" /> Modifier la Leçon : #{leconToEdit.ordre}
                        </h3>
                        <form onSubmit={handleLeconUpdate} className="space-y-5">
                            
                            <div>
                                <label htmlFor="edit_titre" className="block text-sm font-medium text-gray-700 mb-1">Nouveau Titre</label>
                                <input
                                    type="text"
                                    name="titre"
                                    id="edit_titre"
                                    value={editFormData.titre}
                                    onChange={handleEditChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="edit_ordre" className="block text-sm font-medium text-gray-700 mb-1">Ordre</label>
                                <input
                                    type="number"
                                    name="ordre"
                                    id="edit_ordre"
                                    value={editFormData.ordre}
                                    onChange={handleEditChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="border border-indigo-200 p-4 rounded-lg bg-indigo-50">
                                {/* Affichage du fichier actuel */}
                                <p className="text-sm text-gray-700 mb-3 font-medium flex items-center">
                                    <FolderOpen className="size-4 mr-2 text-indigo-600" /> Fichier actuel : <span className="font-semibold text-indigo-700 ml-1 truncate">{editFormData.oldFichier}</span>
                                </p>
                                
                                <label htmlFor="edit_fichier" className="block text-sm font-medium text-gray-700 mb-1 mt-3">
                                    <Upload className="size-4 inline mr-1" /> Remplacer le fichier (Optionnel)
                                </label>
                                <input
                                    type="file"
                                    name="fichier"
                                    id="edit_fichier"
                                    accept="application/pdf,video/*"
                                    onChange={handleEditFileChange}
                                    className="mt-1 block w-full text-sm text-gray-500 
                                                file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 
                                                file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 
                                                hover:file:bg-indigo-200 transition duration-150"
                                />
                                {/* Aperçu du nouveau fichier à uploader */}
                                {editFormData.fichier && (
                                    <div className="mt-3 p-3 bg-blue-50 border border-blue-300 rounded-lg flex items-center text-sm font-medium shadow-inner">
                                        {editFileIcon}
                                        <span className="truncate flex-1">{editFileName}</span>
                                        <span className="ml-3 text-xs text-blue-600 font-bold p-1 rounded-md bg-blue-200">{editFileType}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-150 flex items-center font-medium"
                                    disabled={isSubmitting}
                                >
                                    <XCircle className="size-5 mr-2" /> Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !editFormData.titre}
                                    className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition duration-150 flex items-center font-semibold"
                                >
                                    {isSubmitting ? 'Mise à jour...' : <><Save className="size-5 mr-2" /> Sauvegarder</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODALE DE SUPPRESSION --- */}
            {isDeleteModalOpen && leconToDelete && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-4 text-red-600 flex items-center border-b pb-2"><Trash2 className="size-5 mr-2" /> Confirmation de Suppression</h3>
                        <p className="mb-6 text-gray-700">
                            Êtes-vous sûr de vouloir supprimer la leçon : 
                            <span className="font-semibold block mt-2 text-lg text-gray-800">
                                #{leconToDelete.ordre} - "{leconToDelete.titre_lecon}" ?
                            </span>
                            <span className="text-sm text-red-500 block mt-3 p-2 bg-red-100 rounded-md border border-red-300">
                                <AlertTriangle className="size-4 inline mr-1" /> Cette action est irréversible et **supprimera définitivement le fichier associé**.
                            </span>
                        </p>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-150 flex items-center font-medium"
                                disabled={isSubmitting}
                            >
                                <XCircle className="size-5 mr-2" /> Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleLeconDelete}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-400 transition duration-150 flex items-center font-semibold"
                            >
                                {isSubmitting ? 'Suppression...' : <><Trash2 className="size-5 mr-2" /> Confirmer</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionLecons;