import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, BookOpen, Clock, AlertTriangle, ListChecks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color, linkTo }) => {
    const navigate = useNavigate();
    
    // Classes CSS pour la couleur de fond et l'icône
    const iconColorClass = color.replace('bg-', 'text-');
    
    return (
        <div 
            className="bg-white p-6 rounded-xl shadow-lg transform hover:scale-[1.03] hover:shadow-2xl transition duration-300 border-t-4 border-indigo-500 cursor-pointer"
            onClick={() => navigate(linkTo)} // Rend la carte cliquable
        >
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
                <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 ${iconColorClass}`} />
                </div>
            </div>
            <p className="text-5xl font-extrabold text-gray-900 mt-4">
                {value}
            </p>
            <p className="text-sm text-gray-500 mt-2">
                Total depuis la création de vos cours
            </p>
        </div>
    );
};


const DashboardFormateur = () => {
    
    const API_BASE_URL = 'http://localhost/projet-plateforme/backend/api/formateur/';
    
    const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}');
    const idFormateur = utilisateur.id_utilisateur;
    const nomFormateur = utilisateur.nom_complet || 'Formateur';

    // AJOUT DE totalCoursCrees à l'état initial
    const [stats, setStats] = useState({ totalEtudiants: 0, totalCoursPublies: 0, totalCoursCrees: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            if (!idFormateur) {
                setError("ID Formateur manquant. Veuillez vous connecter.");
                setLoading(false);
                return;
            }

            try {
                // Appel API 1
                const etudiantsPromise = axios.get(`${API_BASE_URL}totalEtudiantsInscrits.php?id_formateur=${idFormateur}`);
                // Appel API 2
                const coursPubliesPromise = axios.get(`${API_BASE_URL}totalCoursPubliesFormateur.php?id_formateur=${idFormateur}`);
                // Appel API 3 (MODIFIÉ)
                const coursCreesPromise = axios.get(`${API_BASE_URL}totalCoursCreesFormateur.php?id_formateur=${idFormateur}`); // <-- Appel corrigé et ID ajouté

                const [etudiantsRes, coursPubliesRes, coursCreesRes] = await Promise.all([etudiantsPromise, coursPubliesPromise, coursCreesPromise]);
                
                setStats({
                    totalEtudiants: etudiantsRes.data.total_etudiants_inscrits || 0,
                    totalCoursPublies: coursPubliesRes.data.total_cours_publies || 0,
                    totalCoursCrees: coursCreesRes.data.total_cours_crees || 0,
                });

            } catch (err) {
                console.error("Erreur de chargement des stats:", err);
                // setError("Erreur lors de la récupération des statistiques.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [idFormateur]);


    if (loading) {
        return (
            <div className="p-8 text-center text-lg">
                <Clock className="w-6 h-6 animate-spin inline-block mr-2 text-indigo-600" /> 
                Chargement du tableau de bord...
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="p-8 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
                <AlertTriangle className="w-5 h-5 mr-3" />
                <p>{error}</p>
            </div>
        );
    }

    return (
        <section id="dashboard-formateur" className="p-8 bg-gray-50">
            
            <div className="pb-8">
                <h1 className="text-4xl font-bold text-center tracking-tight text-gray-900 sm:text-5xl">
                    Bienvenue, <span className="text-indigo-600">{nomFormateur}</span> !
                </h1>
                <p className="mt-2 text-lg leading-8 text-center text-gray-600">
                    Aperçu rapide de vos performances sur la plateforme.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                <StatCard 
                    title="Étudiants Inscrits"
                    value={stats.totalEtudiants}
                    icon={Users}
                    color="bg-indigo-600"
                    linkTo="/liste-etudiants"
                />

                <StatCard 
                    title="Cours Publiés"
                    value={stats.totalCoursPublies}
                    icon={BookOpen}
                    color="bg-green-600"
                    linkTo="/liste-cours-publies"
                />

                <StatCard 
                    title="Cours Créés"
                    value={stats.totalCoursCrees}
                    icon={ListChecks}
                    color="bg-red-600" 
                    linkTo="/liste-cours" 
                />
                
            </div>
        </section>
    );
};

export default DashboardFormateur;