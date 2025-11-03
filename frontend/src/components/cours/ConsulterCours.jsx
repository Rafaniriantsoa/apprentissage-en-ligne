import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const ConsulterCours = () => {
    const { id_cours } = useParams(); // Récupère l'ID du cours depuis l'URL (ex: /consulter-cours/1)

    // URLs
    const API_URL = 'http://localhost/projet-plateforme/backend/api/formateur/consulterCoursPublic.php';
    const BASE_URL = 'http://localhost/projet-plateforme/backend/api/formateur/'; 

    // États
    const [coursDetail, setCoursDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id_cours) {
            setError("ID du cours non spécifié.");
            setLoading(false);
            return;
        }

        const fetchCoursDetail = async () => {
            setLoading(true);
            setError('');
            try {
                // Appel de la nouvelle API pour les détails du cours et les leçons
                const response = await axios.get(`${API_URL}?id_cours=${id_cours}`);
                
                setCoursDetail(response.data.cours_detail);
                
            } catch (err) {
                console.error("Erreur de chargement du cours:", err.response || err);
                setError(err.response?.data?.message || "Cours introuvable ou problème de connexion.");
                setCoursDetail(null);
            } finally {
                setLoading(false);
            }
        };

        fetchCoursDetail();
    }, [id_cours]);

    if (loading) return <div className="text-center p-10 text-indigo-600 font-semibold">Chargement des détails du cours...</div>;
    if (error) return <div className="text-center p-10 text-red-600">Erreur : {error}</div>;
    if (!coursDetail) return <div className="text-center p-10 text-gray-500">Le cours n'est pas disponible.</div>;

    const imageUrl = coursDetail.photo 
        ? `${BASE_URL}${coursDetail.photo}` 
        : `${BASE_URL}uploads/cours/default/9.jpg`;

    return (
        <div className="max-w-4xl mx-auto p-6 mt-10">
            
            {/* EN-TÊTE DU COURS */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-t-4 border-indigo-600">
                <div className="flex items-center space-x-6">
                    <img 
                        src={imageUrl} 
                        alt={coursDetail.titre} 
                        className="w-32 h-32 object-cover rounded-lg flex-shrink-0 shadow-md"
                    />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{coursDetail.titre}</h1>
                        <p className="text-sm text-gray-500">
                            Par **{coursDetail.nom_formateur}** | Publié le {new Date(coursDetail.date_creation).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <p className="text-gray-700 mt-5 leading-relaxed">
                    {coursDetail.description}
                </p>

                {/* Bouton d'action principal pour l'inscription */}
                <div className="mt-8 text-center">
                    <Link
                        to="/inscription" // Redirige vers votre page d'inscription
                        className="inline-block px-8 py-3 text-lg font-semibold text-white bg-green-600 rounded-full hover:bg-green-700 transition duration-300 shadow-xl transform hover:scale-105"
                    >
                        S'inscrire pour suivre ce cours (Gratuit)
                    </Link>
                    <p className="mt-2 text-sm text-gray-500">Déjà membre ? <Link to="/connexion" className="text-indigo-600 font-medium hover:underline">Connectez-vous</Link></p>
                </div>
            </div>

            {/* CONTENU DU COURS (Liste des leçons) */}
            <div className="mt-10">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
                    Contenu du Cours (Plan de formation)
                </h2>

                <div className="bg-white rounded-lg shadow-lg divide-y divide-gray-100">
                    {coursDetail.lecons && coursDetail.lecons.length > 0 ? (
                        coursDetail.lecons.map((lecon, index) => (
                            <div key={lecon.id_lecon} className="p-4 flex justify-between items-center group">
                                <span className="text-lg font-medium text-gray-700">
                                    {index + 1}. {lecon.titre}
                                </span>
                                
                                {/* Bouton "Détails" (Restreint) */}
                                <button
                                    className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition duration-150 cursor-pointer opacity-100"
                                    onClick={() => alert(`Leçon "${lecon.titre}" : Veuillez vous inscrire pour accéder au contenu !`)}
                                    title="Contenu réservé aux membres"
                                >
                                    🔒 Détails (Réservé)
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="p-4 text-gray-500">Ce cours ne contient pas encore de leçons.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConsulterCours;