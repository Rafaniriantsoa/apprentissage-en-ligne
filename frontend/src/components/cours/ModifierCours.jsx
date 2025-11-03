import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, BookOpen, Loader2, Save, X } from 'lucide-react'; // Importation d'icônes pour l'UX

const ModifierCours = () => {
    // Récupérer l'ID du cours depuis l'URL (ex: /modifier-cours/5)
    const { id_cours } = useParams();
    const navigate = useNavigate();

    const API_URL = 'http://localhost/projet-plateforme/backend/api/formateur/modifierCours.php';

    // Récupérer l'ID du formateur connecté
    const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}');
    const idFormateur = utilisateur.id_utilisateur;

    // États
    const [formData, setFormData] = useState({
        titre: '',
        description: '',
    });
    const [currentPhoto, setCurrentPhoto] = useState(''); // Chemin de l'image existante dans la BDD
    const [newPhotoFile, setNewPhotoFile] = useState(null); // Le nouvel objet File sélectionné
    const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null); // URL temporaire pour l'aperçu

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // --- 1. Chargement des données initiales (useEffect) ---
    useEffect(() => {
        if (!idFormateur || !id_cours) {
            setError("Authentification ou ID de cours manquant.");
            setLoading(false);
            return;
        }

        const fetchCours = async () => {
            try {
                // Requête GET pour récupérer les détails du cours
                const response = await axios.get(`${API_URL}?id_cours=${id_cours}&id_formateur=${idFormateur}`); // Ajout idFormateur pour vérif API

                const data = response.data;

                // (La vérification d'autorisation est souvent faite aussi côté serveur,
                // mais on maintient cette vérification client si l'API ne la gère pas elle-même
                // ou pour un meilleur feedback utilisateur.)

                setFormData({
                    titre: data.titre,
                    description: data.description,
                });
                setCurrentPhoto(data.photo);

            } catch (err) {
                console.error("Erreur de chargement:", err.response || err);
                setError(err.response?.data?.message || "Cours introuvable ou erreur serveur.");
            } finally {
                setLoading(false);
            }
        };

        fetchCours();
    }, [id_cours, idFormateur, API_URL]);

    // --- 2. Gestion des changements et de l'aperçu de photo ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setNewPhotoFile(file);

        // Créer l'URL d'aperçu pour la nouvelle image
        if (file) {
            setPreviewPhotoUrl(URL.createObjectURL(file));
        } else {
            setPreviewPhotoUrl(null);
        }
    };

    const handleRemoveNewPhoto = () => {
        setNewPhotoFile(null);
        setPreviewPhotoUrl(null);
        // Réinitialiser le champ input
        const fileInput = document.querySelector('input[name="photo"]');
        if (fileInput) fileInput.value = '';
    };

    // --- 3. Soumission du formulaire (POST) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        if (!formData.titre || !formData.description) {
            setError("Veuillez remplir le titre et la description.");
            setLoading(false);
            return;
        }

        const dataToSend = new FormData();
        dataToSend.append('id_cours', id_cours);
        dataToSend.append('id_formateur', idFormateur);
        dataToSend.append('titre', formData.titre);
        dataToSend.append('description', formData.description);
        // Envoyer le chemin actuel au backend pour la logique de suppression
        dataToSend.append('photo_actuelle', currentPhoto || '');

        if (newPhotoFile) {
            dataToSend.append('photo', newPhotoFile);
        }

        try {
            const response = await axios.post(API_URL, dataToSend);

            setMessage(response.data.message || "Mise à jour réussie !");

            // Mettre à jour la photo actuelle si le backend a renvoyé un nouveau chemin
            if (response.data.photo_path) {
                setCurrentPhoto(response.data.photo_path);
            }
            // Réinitialiser les états liés au nouvel upload
            setNewPhotoFile(null);
            setPreviewPhotoUrl(null);

            // Redirection après succès
            setTimeout(() => {
                navigate('/formateur/cours');
            }, 1500);

        } catch (err) {
            console.error("Erreur de mise à jour:", err.response || err);
            setError(err.response?.data?.message || "Échec de la mise à jour du cours.");

        } finally {
            setLoading(false);
        }
    };

    // --- 4. Affichage Conditionnel et Rendu ---

    if (loading && !formData.titre) { // Affiche le loader si les données ne sont pas encore chargées
        return <div className="text-center p-10 font-medium flex justify-center items-center"><Loader2 className="animate-spin h-6 w-6 mr-2" /> Chargement des données du cours...</div>;
    }

    if (error && !message) { // Affiche l'erreur bloquante si pas de données chargées
        return <div className="max-w-xl mx-auto p-6 bg-white shadow-xl rounded-lg mt-10 text-center text-red-600 font-semibold">❌ Erreur : {error}</div>;
    }

    // Chemin de l'image à afficher (nouvelle sélection > photo actuelle > placeholder)
    const displayPhoto = previewPhotoUrl
        ? previewPhotoUrl // Aperçu de la nouvelle image sélectionnée
        : currentPhoto
            ? `http://localhost/projet-plateforme/backend/${currentPhoto}` // <-- CONFIRMATION DU CHEMIN
            : 'https://via.placeholder.com/600x338?text=Aucune+image';
    return (
        <div className="max-w-xl mx-auto p-6 bg-white shadow-2xl rounded-lg mt-10 border-t-4 border-indigo-600">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center flex items-center justify-center space-x-2">
                <Edit className="h-7 w-7 text-indigo-600" />
                <span>Modifier le Cours #{id_cours}</span>
            </h2>

            {message && <div className="p-3 mb-4 text-sm font-medium text-green-700 bg-green-100 rounded-lg">{message}</div>}
            {error && <div className="p-3 mb-4 text-sm font-medium text-red-700 bg-red-100 rounded-lg">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Champ Titre */}
                <div>
                    <label htmlFor="titre" className="block text-sm font-medium text-gray-700">Titre du Cours</label>
                    <input
                        type="text"
                        name="titre"
                        value={formData.titre}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    />
                </div>

                {/* Champ Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description Détaillée</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="5"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    />
                </div>

                {/* Champ Photo avec Aperçu */}
                <div className="border border-dashed p-4 rounded-md bg-gray-50">
                    <label className="block text-sm font-bold text-indigo-700 mb-2">Image de Couverture</label>

                    {/* Image Affichée (Actuelle OU Nouvelle) */}
                    <div className="relative mb-4">
                        <img src={displayPhoto} alt="Couverture actuelle ou nouvel aperçu" className="w-full max-h-40 object-cover rounded-md shadow-inner border" />
                        {previewPhotoUrl && (
                            <button
                                type="button"
                                onClick={handleRemoveNewPhoto}
                                className="absolute top-2 right-2 bg-red-600 p-1.5 rounded-full text-white hover:bg-red-700 transition"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
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