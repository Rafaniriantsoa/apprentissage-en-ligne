import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Retrait de useParams
import { Edit, BookOpen, Loader2, Save, X, ArrowLeft, CheckCircle } from 'lucide-react'; 

const ModifierCours = () => {
    // Retrait de const { id_cours } = useParams();
    const navigate = useNavigate();

    // URLs des API
    const API_URL = 'http://localhost/projet-plateforme/backend/api/formateur/modifierCours.php';
    const FILE_BASE_URL = 'http://localhost/projet-plateforme/backend/api/formateur/'; 

    // Récupérer l'ID du formateur connecté
    const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}');
    const idFormateur = utilisateur.id_utilisateur;
    // Récupération de l'ID du cours depuis localStorage
    const idCoursCourant = localStorage.getItem('cours_id_courant');

    // États du composant
    const [formData, setFormData] = useState({
        titre: '',
        description: '',
    });
    const [currentPhoto, setCurrentPhoto] = useState(''); 
    const [newPhotoFile, setNewPhotoFile] = useState(null); 
    const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null); 

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Gestion des changements d'entrée de texte
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError(''); // Effacer l'erreur lors de la saisie
    };

    // Gestion du changement de fichier (photo)
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewPhotoFile(file);
            setPreviewPhotoUrl(URL.createObjectURL(file));
        }
    };

    // Gestion du retrait de la nouvelle photo
    const handleRemoveNewPhoto = () => {
        setNewPhotoFile(null);
        setPreviewPhotoUrl(null);
        // Réinitialiser l'input file pour permettre le re-upload du même fichier
        document.querySelector('input[name="photo"]').value = '';
    };

    // 1. Chargement des données initiales depuis localStorage
    useEffect(() => {
        if (!idFormateur) {
            setError("ID Formateur introuvable. Redirection...");
            setLoading(false);
            // navigate('/deconnexion'); // Optionnel: rediriger si non connecté
            return;
        }

        const coursDataString = localStorage.getItem('cours_selectionne');
        
        if (!idCoursCourant || !coursDataString) {
            setError("Aucun cours sélectionné pour la modification.");
            setLoading(false);
            return;
        }
        
        try {
            const coursData = JSON.parse(coursDataString);

            // Vérification de cohérence
            if (coursData.id_cours.toString() !== idCoursCourant.toString()) {
                setError("Incohérence des données de cours.");
                setLoading(false);
                return;
            }

            setFormData({
                titre: coursData.titre || '',
                description: coursData.description || '',
            });
            setCurrentPhoto(coursData.photo || '');
        } catch (e) {
            setError("Erreur de format des données de cours.");
        } finally {
            setLoading(false);
        }

        // Nettoyage de l'URL temporaire de l'aperçu si le composant est démonté
        return () => {
            if (previewPhotoUrl) URL.revokeObjectURL(previewPhotoUrl);
        };
    }, [idFormateur, idCoursCourant]);


    // 2. Soumission du formulaire (incluant le fichier)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        if (!idCoursCourant || !idFormateur) {
            setError("Erreur de session/ID du cours. Veuillez actualiser.");
            setLoading(false);
            return;
        }

        try {
            // Utilisation de FormData car il y a un upload de fichier
            const data = new FormData();
            data.append('id_cours', idCoursCourant);
            data.append('id_formateur', idFormateur);
            data.append('titre', formData.titre);
            data.append('description', formData.description);

            if (newPhotoFile) {
                data.append('photo', newPhotoFile);
            }
            // Si l'utilisateur clique sur 'Sauvegarder' sans changer de fichier
            // le champ 'photo' sera absent de FormData. Le backend PHP gère ce cas en gardant l'ancienne photo.

            const response = await axios.post(API_URL, data, {
                headers: {
                    // 'Content-Type': 'multipart/form-data' est géré automatiquement par axios lors de l'utilisation de FormData
                },
            });

            setMessage(response.data.message || "Cours mis à jour avec succès !");
            
            // Mise à jour de l'état local après succès
            if (response.data.photo_path) {
                setCurrentPhoto(response.data.photo_path);
                // Mise à jour de localStorage pour la cohérence
                const updatedCours = JSON.parse(localStorage.getItem('cours_selectionne'));
                if (updatedCours) {
                    updatedCours.photo = response.data.photo_path;
                    localStorage.setItem('cours_selectionne', JSON.stringify(updatedCours));
                }
            }
            setNewPhotoFile(null);
            setPreviewPhotoUrl(null);

        } catch (err) {
            console.error("Erreur de modification:", err.response || err);
            setError(err.response?.data?.message || "Une erreur inconnue est survenue lors de la mise à jour.");
        } finally {
            setLoading(false);
        }
    };


    if (loading) return <div className="text-center p-10 text-lg font-semibold text-indigo-600 flex items-center justify-center"><Loader2 className="animate-spin mr-2" size={24} /> Chargement des détails du cours...</div>;

    if (error && !idCoursCourant) return (
        <div className="max-w-4xl mx-auto p-6">
             <div className="p-4 mb-5 text-sm font-medium text-red-800 bg-red-100 rounded-lg shadow-md flex items-center"><X size={18} className="mr-2"/>Erreur : {error}</div>
             <button
                onClick={() => navigate('/liste-cours')}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition duration-150"
            >
                <ArrowLeft size={16} />
                <span>Retour à la liste des cours</span>
            </button>
        </div>
    );

    // Calcul du chemin d'image actuel ou de l'aperçu
    const finalPhotoUrl = previewPhotoUrl 
        ? previewPhotoUrl 
        : (currentPhoto ? `${FILE_BASE_URL}${currentPhoto}` : `${FILE_BASE_URL}default.png`);

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            
            <button
                onClick={() => navigate('/liste-cours')}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition duration-150 mb-6"
            >
                <ArrowLeft size={16} />
                <span>Retour à la liste des cours</span>
            </button>

            <h1 className="text-3xl font-extrabold text-gray-500 mb-6 flex items-center">
                <Edit className="mr-3 text-indigo-600" size={28} />
                Modification du Cours
            </h1>

            {/* Messages de succès et d'erreur */}
            {message && <div className="p-4 mb-5 text-sm font-medium text-green-800 bg-green-100 rounded-lg shadow-md flex items-center"><CheckCircle size={18} className="mr-2"/>{message}</div>}
            {error && <div className="p-4 mb-5 text-sm font-medium text-red-800 bg-red-100 rounded-lg shadow-md flex items-center"><XCircle size={18} className="mr-2"/>Erreur : {error}</div>}


            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-2xl space-y-6 border border-indigo-100">

                {/* Champ Titre */}
                <div>
                    <label htmlFor="titre" className="block text-sm font-bold text-gray-700">Titre du Cours <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="titre"
                        id="titre"
                        value={formData.titre}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                        placeholder="Modifier le titre du cours"
                    />
                </div>

                {/* Champ Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-bold text-gray-700">Description Détaillée <span className="text-red-500">*</span></label>
                    <textarea
                        name="description"
                        id="description"
                        rows="5"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base"
                        placeholder="Décrivez en détail les votre cours."
                    />
                </div>

                {/* Gestion de l'Image */}
                <div className="border p-4 rounded-lg bg-gray-50">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Image de Couverture</label>
                    
                    <div className="relative w-full h-48 mb-4 overflow-hidden rounded-lg border-2 border-dashed border-gray-300">
                        <img 
                            src={finalPhotoUrl} 
                            alt="Aperçu de la photo de couverture" 
                            className="w-full h-full object-cover"
                        />
                        {/* Bouton X pour retirer l'image en prévisualisation */}
                        {previewPhotoUrl && (
                             <button
                                type="button"
                                onClick={handleRemoveNewPhoto}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    
                    <div className="mt-2 text-center">
                        <p className="text-xs text-gray-500 font-medium">
                            {previewPhotoUrl ? "Nouvelle image sélectionnée. Cliquez sur X pour annuler." : "Image actuellement enregistrée."}
                        </p>
                    </div>


                    <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mt-4">Changer l'Image (facultatif)</label>
                    <input
                        type="file"
                        name="photo"
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/gif"
                        className="mt-1 block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                    />
                </div>

                {/* Bouton de Soumission */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 transition duration-150 space-x-2"
                >
                    <Save className="h-5 w-5" />
                    <span>{loading ? 'Mise à jour en cours...' : 'Sauvegarder les Modifications'}</span>
                </button>
            </form>
        </div>
    );
};

export default ModifierCours;