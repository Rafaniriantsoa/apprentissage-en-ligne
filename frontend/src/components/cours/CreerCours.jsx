import React, { useState, useRef } from 'react';
import axios from 'axios';
// useNavigate n'est plus utilisé pour la redirection, mais est conservé
import { useNavigate } from 'react-router-dom';
import { Loader2, Save, BookOpen, FileText, Image, X, Upload } from 'lucide-react';

// URL de l'API (Rendue plus visible)
const API_CREATION_URL = 'http://localhost/projet-plateforme/backend/api/formateur/creerCours.php';

const CreerCours = () => {

    const navigate = useNavigate();
    // 💡 Nouvelle référence pour l'input de type file
    const fileInputRef = useRef(null);

    // 1. Récupération de l'ID du formateur (Doit être présent pour continuer)
    const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}');
    const idFormateur = utilisateur.id_utilisateur;

    // --- États du Composant ---
    const [formData, setFormData] = useState({
        titre: '',
        description: '',
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Vérification initiale de sécurité
    if (!idFormateur) {
        return (
            <div className="text-red-600 p-4 text-center">
                Erreur de sécurité: Formateur non identifié. Veuillez vous reconnecter.
            </div>
        );
    }

    // --- Fonctions de Gestion des Entrées ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    // 💡 Logique mise à jour pour gérer le fichier ET l'aperçu
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setPhotoFile(file);

        if (file) {
            setPhotoPreviewUrl(URL.createObjectURL(file));
        } else {
            setPhotoPreviewUrl(null);
        }
    };

    // 💡 Fonction pour déclencher le clic sur l'input masqué
    const handleButtonClick = () => {
        fileInputRef.current.click();
    };

    // 💡 Fonction pour effacer le fichier sélectionné (réutilise la référence)
    const handleClearFile = () => {
        setPhotoFile(null);
        setPhotoPreviewUrl(null);
        // Réinitialiser la valeur de l'input de type file
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };


    // --- Fonction de Soumission (Cœur du script) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        // 1. Validation de base des champs requis
        if (!formData.titre.trim() || !formData.description.trim()) {
            setError("Veuillez remplir tous les champs obligatoires (Titre et Description).");
            setLoading(false);
            return;
        }

        // 2. Préparation des données pour l'API
        const dataToSend = new FormData();
        dataToSend.append('id_formateur', idFormateur);
        dataToSend.append('titre', formData.titre.trim());
        dataToSend.append('description', formData.description.trim());

        // Ajouter le fichier s'il existe
        if (photoFile) {
            dataToSend.append('photo', photoFile);
        }

        // 3. Appel à l'API
        try {
            const response = await axios.post(API_CREATION_URL, dataToSend);

            // 4. Succès: Affichage du message et réinitialisation du formulaire
            setMessage(response.data.message || "Cours créé avec succès ! Vous pouvez en créer un autre.");


            handleClearFile(); // Réinitialise le fichier ET l'aperçu

            setTimeout(() => {
                setFormData({ titre: '', description: '', photoFile: null });
                setMessage('')
                navigate('/')
            }, 1000);

        } catch (err) {
            // 5. Erreur: Affichage du message d'erreur
            console.error("Erreur de création de cours:", err);
            let errorMessage = "Erreur de connexion au serveur.";
            if (err.response && err.response.data && err.response.data.message) {
                errorMessage = err.response.data.message;
            }
            setError(errorMessage);

        } finally {
            // 6. Fin du processus
            setLoading(false);
        }
    };

    // --- Rendu du Formulaire ---
    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-xl">

                <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center justify-center space-x-2">
                    <BookOpen className="h-6 w-6" />
                    <span>Nouveau Cours</span>
                </h2>

                {/* Messages de feedback */}
                {message && <div className="p-3 mb-4 bg-green-100 border border-green-400 text-green-700 rounded font-medium">{message}</div>}
                {error && <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded font-medium">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* ... (Champs Titre et Description non modifiés) ... */}
                    {/* Champ Titre */}
                    <div>
                        <label htmlFor="titre" className="block text-sm font-medium text-gray-700">Titre du Cours</label>
                        <div className="relative mt-1">
                            <input
                                type="text"
                                id="titre"
                                name="titre"
                                value={formData.titre}
                                onChange={handleChange}
                                className="block w-full border border-gray-300 rounded-md p-2 pl-8 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Nom de la formation"
                                required
                            />
                            <BookOpen className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                    </div>

                    {/* Champ Description (Textarea) */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <div className="relative mt-1">
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                className="block w-full border border-gray-300 rounded-md p-2 pl-8 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Description détaillée du contenu..."
                                required
                            />
                            <FileText className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                        </div>
                    </div>

                    {/* Champ Image de Couverture (MODIFIÉ) */}
                    <div className="border border-dashed border-gray-300 p-4 rounded-lg bg-gray-50">
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                            <Image className="h-4 w-4 text-indigo-600" />
                            <span>Image de Couverture (Optionnel)</span>
                        </label>

                        {/* 💡 INPUT DE TYPE FILE MASQUÉ */}
                        <input
                            ref={fileInputRef} // Attache la référence
                            type="file"
                            id="photo"
                            name="photo"
                            onChange={handleFileChange}
                            accept="image/*"
                            // Classes pour masquer l'input file par défaut
                            className="hidden"
                        />

                        {/* 💡 BOUTON VISIBLE POUR DÉCLENCHER LE CLIC */}
                        {!photoPreviewUrl && (
                            <button
                                type="button"
                                onClick={handleButtonClick}
                                className="w-full flex items-center justify-center py-2 px-4 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Choisir une image (JPG, PNG)
                            </button>
                        )}

                        {/* 💡 BLOC D'APERÇU (Visible si une image est sélectionnée) */}
                        {photoPreviewUrl && (
                            <div className="mt-4 relative">
                                <p className="text-sm text-gray-600 mb-2">Image sélectionnée :</p>
                                <img src={photoPreviewUrl} alt="Aperçu du cours" className="w-full h-24 object-cover rounded-md shadow-md border border-gray-300" />
                                <button
                                    type="button"
                                    onClick={handleClearFile}
                                    className="absolute top-8 right-1 bg-red-600 p-1 rounded-full text-white hover:bg-red-700 transition shadow-lg"
                                    aria-label="Supprimer l'image sélectionnée"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Bouton de Soumission */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-lg text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 transition"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                <span>Envoi en cours...</span>
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5 mr-2" />
                                <span>Créer un autre Cours</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};


export default CreerCours;