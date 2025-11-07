// src/components/formateur/ProfilFormateur.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Lock, CheckCircle, AlertTriangle, Clock, Edit, Briefcase, Camera, X } from 'lucide-react';

// --- Configuration API ---
const LIRE_PROFIL_API = 'http://localhost/projet-plateforme/backend/api/formateur/lireProfil.php';
const MODIFIER_PROFIL_API = 'http://localhost/projet-plateforme/backend/api/formateur/modifierProfil.php';
// NOUVELLE URL de base pour afficher l'image (selon votre demande)
// const BASE_URL_PHOTO = 'http://localhost/projet-plateforme/backend/api/visiteur/'; 
const BASE_URL_PHOTO = 'http://localhost/projet-plateforme/backend/api/visiteur/';
const ProfilFormateur = () => {
    
    // Récupération de l'ID formateur
    const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}');
    const idFormateur = utilisateur.id_utilisateur;

    // --- États du composant ---
    const [formData, setFormData] = useState({
        nom_complet: '',
        email: '',
        specialite: '', 
        photo: '', // Chemin actuel de la photo dans la DB (ex: formateur_1.jpg)
        mot_de_passe: '',
        confirm_mot_de_passe: ''
    });
    const [fileToUpload, setFileToUpload] = useState(null); // Fichier binaire à uploader
    const [filePreview, setFilePreview] = useState(null); // URL de l'aperçu local (URL.createObjectURL)
    
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [initialEmail, setInitialEmail] = useState('');

    const [imageError, setImageError] = useState(false); // État si l'image existante ne charge pas
    
    // --- 1. Chargement des données initiales (Fetch) ---
    useEffect(() => {
        const fetchProfil = async () => {
            if (!idFormateur) {
                setError("ID Formateur manquant. Veuillez vous reconnecter.");
                setLoading(false);
                return;
            }

            try {
                // Effectue la requête de récupération
                const response = await axios.get(`${LIRE_PROFIL_API}?id_formateur=${idFormateur}`);
                
                if (response.data.success) {
                    const data = response.data.formateur;
                    
                    // Définit la valeur par défaut de tous les champs
                    setFormData({
                        nom_complet: data.nom_complet,
                        email: data.email,
                        specialite: data.specialite || '',
                        photo: data.photo || '', 
                        mot_de_passe: '', 
                        confirm_mot_de_passe: ''
                    });
                    setInitialEmail(data.email);
                    setImageError(false);
                    setFilePreview(null);
                } else {
                    setError(response.data.message || "Erreur lors du chargement du profil.");
                }
            } catch (err) {
                setError("Erreur de connexion à l'API de lecture de profil (vérifiez le back-end).");
                console.error("Erreur Fetch Profil:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfil();

        // Nettoyage de l'aperçu pour éviter les fuites de mémoire
        return () => {
            if (filePreview) URL.revokeObjectURL(filePreview);
        };
    }, [idFormateur]);

    // --- 2. Gestion des changements de formulaire (texte) ---
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setSuccessMessage(''); 
        setError('');
    };

    // --- 3. Gestion de la sélection du fichier ---
    const handleFileChange = (e) => {
        setError('');
        const file = e.target.files[0];
        setFileToUpload(file);
        
        // Création de l'aperçu local
        if (file) {
            if (filePreview) URL.revokeObjectURL(filePreview);
            setFilePreview(URL.createObjectURL(file));
        } else {
            setFilePreview(null);
        }
    };

    // --- Suppression de l'aperçu et du fichier en attente ---
    const handleRemoveFile = () => {
        setFileToUpload(null);
        if (filePreview) {
            URL.revokeObjectURL(filePreview);
            setFilePreview(null);
        }
        document.getElementById('photo_file_input').value = '';
    };

    // --- Gestion des erreurs de chargement d'image existante ---
    const handleImageError = () => {
        setImageError(true);
    };

    // --- 4. Soumission du formulaire (avec FormData) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setError('');
        setSuccessMessage('');
        setIsSubmitting(true);

        if (formData.mot_de_passe && formData.mot_de_passe !== formData.confirm_mot_de_passe) {
            setError("Les mots de passe ne correspondent pas.");
            setIsSubmitting(false);
            return;
        }

        // Utilisation de FormData pour l'envoi de fichiers et de données mixtes
        const dataToSend = new FormData();
        dataToSend.append('id_formateur', idFormateur);
        dataToSend.append('nom_complet', formData.nom_complet);
        dataToSend.append('email', formData.email);
        dataToSend.append('specialite', formData.specialite);
        
        if (fileToUpload) {
            // Le nom 'photo_file' doit correspondre au $_FILES['photo_file'] dans PHP
            dataToSend.append('photo_file', fileToUpload); 
        }

        if (formData.mot_de_passe) {
            dataToSend.append('mot_de_passe', formData.mot_de_passe);
        }

        try {
            const response = await axios.post(MODIFIER_PROFIL_API, dataToSend);

            if (response.data.success) {
                setSuccessMessage(response.data.message);
                
                // Si un nouveau fichier a été uploadé, PHP retourne le nouveau chemin/nom
                const newPhotoPath = response.data.new_photo || formData.photo;
                
                // Mise à jour de l'état et du localStorage
                setFormData(prev => ({ 
                    ...prev, 
                    photo: newPhotoPath,
                    mot_de_passe: '', 
                    confirm_mot_de_passe: '' 
                }));
                localStorage.setItem('utilisateur', JSON.stringify({
                    ...utilisateur,
                    nom_complet: formData.nom_complet,
                    photo: newPhotoPath 
                }));
                
                handleRemoveFile(); // Réinitialiser l'input file

            } else {
                setError(response.data.message || "Échec de la mise à jour.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Erreur réseau lors de la mise à jour.");
            console.error("Erreur Submit Profil:", err.response || err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // L'URL de l'image à afficher (priorité à l'aperçu local)
    const currentPhotoUrl = filePreview 
        ? filePreview 
        : (formData.photo && !imageError) 
            ? `${BASE_URL_PHOTO}${formData.photo}` 
            : null;
    
    // Contenu du placeholder
    const placeholderContent = fileToUpload ? (
        <p className='text-xs text-center mt-1 text-indigo-600 font-medium'>Nouveau fichier sélectionné</p>
    ) : imageError ? (
        <p className='text-xs text-center mt-1 text-red-600'>Image introuvable ou chemin incorrect</p>
    ) : (
        <p className='text-xs text-center mt-1 text-gray-400'>Ajouter / Changer de photo</p>
    );


    if (loading) return (
        <div className="p-10 text-center text-lg">
            <Clock className="w-6 h-6 animate-spin inline-block mr-2 text-indigo-600" /> Chargement du profil...
        </div>
    );
    
    return (
        <div className="max-w-3xl mx-auto p-6 md:p-10 bg-white shadow-2xl rounded-xl mt-10">
            <h1 className="text-3xl font-bold text-indigo-700 mb-6 flex items-center border-b pb-3">
                <User className="w-7 h-7 mr-3" /> Mon Profil Formateur
            </h1>

            {/* Messages d'alerte */}
            {successMessage && (
                <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg flex items-center" role="alert">
                    <CheckCircle className="w-5 h-5 mr-2" /> {successMessage}
                </div>
            )}
            {error && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg flex items-center" role="alert">
                    <AlertTriangle className="w-5 h-5 mr-2" /> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Section Photo de Profil (Upload et Aperçu) */}
                <div className="flex flex-col items-center mb-6">
                    <label 
                        htmlFor="photo_file_input" 
                        className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-500 shadow-lg cursor-pointer hover:opacity-90 transition duration-150 group"
                    >
                        {/* Aperçu de la photo */}
                        {currentPhotoUrl ? (
                            <img 
                                src={currentPhotoUrl}
                                alt="Photo de profil" 
                                className="w-full h-full object-cover"
                                onError={handleImageError} 
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                                <Camera className="w-8 h-8" />
                            </div>
                        )}
                        {/* Effet au survol */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-150">
                            <Camera className="w-6 h-6 text-white" />
                        </div>
                    </label>
                    
                    {placeholderContent}

                    {/* Input de type FILE (masqué) */}
                    <input
                        type="file"
                        id="photo_file_input"
                        name="photo_file"
                        accept="image/jpeg,image/png,image/gif"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {/* Bouton pour retirer le fichier en attente */}
                    {fileToUpload && (
                        <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="mt-2 text-sm text-red-600 hover:text-red-800 flex items-center transition duration-150"
                        >
                            <X className="w-4 h-4 mr-1" /> Annuler la sélection
                        </button>
                    )}
                </div>


                {/* Champ Nom Complet */}
                <div>
                    <label htmlFor="nom_complet" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 mr-2 text-indigo-500" /> Nom Complet
                    </label>
                    <input
                        type="text"
                        name="nom_complet"
                        id="nom_complet"
                        value={formData.nom_complet}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    />
                </div>

                {/* Champ Spécialité */}
                <div>
                    <label htmlFor="specialite" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <Briefcase className="w-4 h-4 mr-2 text-indigo-500" /> Spécialité / Domaine d'expertise
                    </label>
                    <input
                        type="text"
                        name="specialite"
                        id="specialite"
                        value={formData.specialite}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    />
                </div>

                {/* Champ Email */}
                <div>
                    <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 mr-2 text-indigo-500" /> Email
                    </label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    />
                    {formData.email !== initialEmail && (
                        <p className="mt-1 text-xs text-orange-500">Un nouvel email nécessitera peut-être une nouvelle connexion.</p>
                    )}
                </div>

                <div className="border-t pt-6 mt-6">
                    <p className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                         <Lock className="w-4 h-4 mr-2 text-gray-500" /> Modifier le mot de passe (Laisser vide si inchangé)
                    </p>
                    
                    {/* Champs Mot de Passe */}
                    <div className="mb-4">
                        <label htmlFor="mot_de_passe" className="block text-sm font-medium text-gray-700 mb-2">
                             Nouveau Mot de Passe
                        </label>
                        <input
                            type="password"
                            name="mot_de_passe"
                            id="mot_de_passe"
                            value={formData.mot_de_passe}
                            onChange={handleChange}
                            autoComplete="new-password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="confirm_mot_de_passe" className="block text-sm font-medium text-gray-700 mb-2">
                            Confirmer le Mot de Passe
                        </label>
                        <input
                            type="password"
                            name="confirm_mot_de_passe"
                            id="confirm_mot_de_passe"
                            value={formData.confirm_mot_de_passe}
                            onChange={handleChange}
                            autoComplete="new-password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                        />
                    </div>
                </div>

                {/* Bouton de soumission */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 disabled:bg-indigo-400"
                >
                    {isSubmitting ? (
                        <>
                            <Clock className="w-5 h-5 animate-spin mr-2" /> Mise à jour...
                        </>
                    ) : (
                        <>
                            <Edit className="w-5 h-5 mr-2" /> Enregistrer les modifications
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default ProfilFormateur;