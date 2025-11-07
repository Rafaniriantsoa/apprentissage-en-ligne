import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
// Importation des icônes pour les champs
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'; // Ajout de Eye et EyeOff

// --- Composant Spinner pour le chargement ---
const Spinner = () => (
    <Loader2 className="animate-spin h-5 w-5 mr-3 text-white" />
);


const Connexion = () => {

    const API_URL = 'http://localhost/projet/back/api/authentifierUtilisateur.php';
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        motDePasse: '',
    });

    // 💡 NOUVEAU: État pour gérer l'affichage du mot de passe
    const [showPassword, setShowPassword] = useState(false);

    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setErrors({});
        setLoading(true);

        if (!formData.email || !formData.motDePasse) {
            setErrors({ general: "Veuillez entrer votre email et votre mot de passe." });
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(API_URL, formData);

            const userData = response.data.utilisateur;
            const successMsg = response.data.message || "Connexion réussie ! Redirection en cours...";

            setMessage(successMsg);

            if (userData) {
                localStorage.setItem('utilisateur', JSON.stringify(userData)); 
                setTimeout(() => {
                    navigate('/');
                    window.location.reload();
                }, 300);
            }

        } catch (error) {
            console.error("Erreur de connexion:", error.response || error);

            let errorMessage = "Erreur de serveur inconnue.";
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.request) {
                errorMessage = "Impossible de contacter le serveur API. Le serveur est-il démarré ?";
            }
            setErrors({ general: errorMessage });

        } finally {
            setLoading(false);
        }
    };

    // --- Rendu du Formulaire Amélioré ---
    return (
        <div
            className="flex justify-center items-center min-h-screen p-4 bg-gray-50"
        >
            <div className="w-full max-w-md bg-white p-10 rounded-xl shadow-2xl border border-gray-100 transform transition duration-500 hover:shadow-indigo-300/50">
                <h2 className="text-4xl font-bold text-center text-indigo-700 mb-2">
                    Bienvenue
                </h2>
                <p className="text-gray-500 mb-8 text-center">Connectez-vous à votre espace.</p>

                {/* Messages de feedback */}
                {message && (
                    <div className="p-3 mb-4 text-sm text-green-800 bg-green-100 border border-green-200 rounded-lg animate-fade-in">
                        {message}
                    </div>
                )}
                {errors.general && (
                    <div className="p-3 mb-4 text-sm text-red-800 bg-red-100 border border-red-200 rounded-lg animate-fade-in">
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Champ Email (inchangé) */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Adresse Email</label>
                        <div className="relative">
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-base transition duration-200"
                                placeholder="Entrer votre email"
                            />
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        </div>
                    </div>

                    {/* Mot de Passe avec bouton "Afficher/Masquer" */}
                    <div>
                        <label htmlFor="motDePasse" className="block text-sm font-semibold text-gray-700 mb-1">Mot de Passe</label>
                        <div className="relative">
                            <input
                                // 💡 CHANGEMENT 1: Type dynamique basé sur l'état
                                type={showPassword ? "text" : "password"}
                                id="motDePasse"
                                name="motDePasse"
                                value={formData.motDePasse}
                                onChange={handleChange}
                                // 💡 CHANGEMENT 2: Padding pour laisser la place au bouton
                                className="pl-10 pr-10 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-base transition duration-200"
                                placeholder="••••••••"
                            />
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />

                            {/* 💡 NOUVEAU: Bouton Afficher/Masquer */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-0 top-1/2 transform -translate-y-1/2 h-full p-2 text-gray-500 hover:text-indigo-600 transition duration-150"
                                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Bouton de Soumission avec Spinner */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Spinner />
                                Connexion en cours...
                            </>
                        ) : (
                            <>
                                <LogIn className="h-5 w-5 mr-2" />
                                Connexion
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-8 text-center text-base text-gray-600">
                    Pas encore de compte ? <Link to="/inscrire" className="font-bold text-indigo-600 hover:text-indigo-500 transition duration-150">Inscrivez-vous ici</Link>
                </p>
            </div>
        </div>
    );
};

export default Connexion;