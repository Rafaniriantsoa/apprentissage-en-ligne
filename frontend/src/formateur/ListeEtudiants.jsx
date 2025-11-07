import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Clock, AlertTriangle, ArrowLeft, X, BookOpen, Calendar, CheckCircle, Hourglass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ===================================================
// Composant de la Modal (Pop-up)
// ===================================================

const ModalCoursEtudiant = ({ etudiant, onClose }) => {
    const API_URL = 'http://localhost/projet-plateforme/backend/api/formateur/listerCoursEtudiant.php';
    const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}');
    const idFormateur = utilisateur.id_utilisateur;

    const [cours, setCours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCours = async () => {
            if (!idFormateur || !etudiant?.id_utilisateur) {
                setError("Informations manquantes.");
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(
                    `${API_URL}?id_formateur=${idFormateur}&id_etudiant=${etudiant.id_utilisateur}`
                );
                setCours(response.data.cours_suivis || []);
            } catch (err) {
                setError("Erreur lors du chargement des cours de l'étudiant.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCours();
    }, [idFormateur, etudiant?.id_utilisateur]);
    
    // Fonction pour afficher l'icône et la couleur en fonction du statut
    const getStatutDisplay = (statut) => {
        switch (statut) {
            case 'Terminé':
                return { icon: <CheckCircle className="w-4 h-4 text-green-600 mr-2" />, color: 'text-green-600', text: 'Terminé' };
            case 'En cours':
                return { icon: <Hourglass className="w-4 h-4 text-indigo-600 mr-2" />, color: 'text-indigo-600', text: 'En Cours' };
            case 'Abandonné':
                return { icon: <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />, color: 'text-red-600', text: 'Abandonné' };
            default:
                return { icon: <BookOpen className="w-4 h-4 text-gray-600 mr-2" />, color: 'text-gray-600', text: statut };
        }
    };


    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300">
                
                {/* En-tête de la Modal */}
                <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-extrabold text-indigo-700">
                            Cours de {etudiant.nom_complet}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Email: <span className="font-semibold">{etudiant.email}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition duration-150 p-2 rounded-full hover:bg-gray-100"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Contenu de la Modal */}
                <div className="p-6">
                    {loading && (
                        <div className="text-center py-8">
                            <Clock className="w-6 h-6 animate-spin inline-block mr-2" /> Chargement...
                        </div>
                    )}
                    
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg"><AlertTriangle className="w-5 h-5 inline mr-2" />{error}</div>}

                    {!loading && !error && (
                        <>
                            <h4 className="text-lg font-bold mb-4 text-gray-700">
                                Total de cours inscrits : <span className="text-indigo-600">{cours.length}</span>
                            </h4>
                            {cours.length > 0 ? (
                                <ul className="space-y-3">
                                    {cours.map((c, index) => {
                                        const status = getStatutDisplay(c.statut);
                                        return (
                                            <li key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-500 shadow-sm flex justify-between items-center">
                                                <div>
                                                    <p className="text-lg font-semibold text-gray-900">{c.titre}</p>
                                                    <div className="text-sm text-gray-500 mt-1 flex items-center">
                                                        <Calendar className="w-4 h-4 mr-1" />
                                                        Inscrit le : {new Date(c.date_inscription).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className={`flex items-center font-bold ${status.color}`}>
                                                    {status.icon} {status.text}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-500 py-4">Cet étudiant n'est inscrit à aucun de vos cours.</p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};


// ===================================================
// Composant Principal ListeEtudiants
// ===================================================

const ListeEtudiants = () => {
    const API_URL = 'http://localhost/projet-plateforme/backend/api/formateur/listerEtudiantsFormateur.php';
    const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}');
    const idFormateur = utilisateur.id_utilisateur;
    const navigate = useNavigate();

    const [etudiants, setEtudiants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // État pour la modale
    const [selectedEtudiant, setSelectedEtudiant] = useState(null); 

    useEffect(() => {
        const fetchEtudiants = async () => {
            if (!idFormateur) {
                setError("ID Formateur manquant.");
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${API_URL}?id_formateur=${idFormateur}`);
                setEtudiants(response.data.etudiants || []);
            } catch (err) {
                // setError("Erreur lors de la récupération de la liste des étudiants.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchEtudiants();
    }, [idFormateur]);


    // Fonctions de gestion de la modale
    const handleEtudiantClick = (etudiant) => {
        setSelectedEtudiant(etudiant);
    };

    const handleCloseModal = () => {
        setSelectedEtudiant(null);
    };


    if (loading) return <div className="p-8 text-center text-lg"><Clock className="w-6 h-6 animate-spin inline-block mr-2" /> Chargement...</div>;
    if (error) return <div className="p-8 bg-red-100 text-red-700 rounded-lg"><AlertTriangle className="w-5 h-5 inline mr-2" />{error}</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <button 
                onClick={() => navigate('/')}
                className="mb-6 inline-flex items-center text-indigo-600 hover:text-indigo-800 transition duration-150"
            >
                <ArrowLeft className="w-5 h-5 mr-2" /> Retour au Tableau de Bord
            </button>
            
            <h1 className="text-3xl font-bold mb-8 flex items-center">
                <Users className="w-7 h-7 mr-3 text-indigo-600" /> 
                Liste des Étudiants Inscrits à Mes Cours ({etudiants.length})
            </h1>
            
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom de l'étudiant</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cours Suivis (Total)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {etudiants.map((etudiant) => (
                            <tr 
                                key={etudiant.id_utilisateur} 
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => handleEtudiantClick(etudiant)} // <-- ÉVÉNEMENT DE CLIC
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 hover:text-indigo-800 transition duration-150">{etudiant.nom_complet}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{etudiant.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-semibold">{etudiant.nombre_cours_suivis}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {etudiants.length === 0 && !loading && <p className="mt-6 text-center text-gray-500">Aucun étudiant n'est inscrit à vos cours.</p>}

            {/* Affichage conditionnel de la Modal */}
            {selectedEtudiant && (
                <ModalCoursEtudiant 
                    etudiant={selectedEtudiant} 
                    onClose={handleCloseModal} 
                />
            )}

        </div>
    );
};

export default ListeEtudiants;