// FormateurNavbar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
// Importation des icônes nécessaires
import { Home, User, BookOpen, GraduationCap, Menu, X, LogOut, List, Settings } from 'lucide-react';

// --- Définitions de style cohérentes ---
const ACCENT_COLOR_CLASS = 'text-indigo-700';
const HOVER_BG_CLASS = 'hover:bg-indigo-50';
const LOGOUT_BG_CLASS = 'bg-blue-600 hover:bg-blue-700';

// LIENS POUR L'ESPACE FORMATEUR (le menu latéral) - ICÔNES AJUSTÉES
const trainerNavLinks = [
    { name: 'Tableau de bord', to: '/', icon: Home },
    { name: 'Créer un cours', to: '/creer-cours', icon: BookOpen },
    // Remplacé 'User' par 'List' ou 'GraduationCap' pour le catalogue de cours
    { name: 'Liste des cours', to: '/liste-cours', icon: List }, 
    // Remplacé 'User' par 'Settings' ou gardé 'User' si le profil est plus général
    { name: 'Mon Profil', to: '/profil', icon: User }, 
];


const FormateurNavbar = ({ onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    // Fonction de style pour déterminer l'état actif
    const getLinkClasses = (path) => {
        const currentPath = location.pathname;
        const isRootActive = path === '/' && currentPath === '/';
        // Utilisation d'une vérification plus stricte pour éviter que /liste-cours active aussi la racine si elle commence par /
        const isSubPathActive = path !== '/' && currentPath.startsWith(path);
        const isActive = isRootActive || isSubPathActive;

        const baseClasses = "px-4 py-3 rounded-lg text-sm transition duration-150 flex items-center space-x-3 w-full text-left";

        if (isActive) {
            return `${baseClasses} font-bold bg-indigo-100/70 border-l-4 border-indigo-700 ${ACCENT_COLOR_CLASS}`;
        }
        return `${baseClasses} font-medium text-gray-700 ${HOVER_BG_CLASS} hover:${ACCENT_COLOR_CLASS}`;
    };

    const handleNavLinkClick = () => {
        setIsOpen(false);
    };

    return (
        <nav className="bg-white shadow-xl sticky top-0 z-50">
            {/* --- BARRE HORIZONTALE PRINCIPALE (LOGO & HAMBURGER UNIQUEMENT) --- */}
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* 1. Logo / Nom de la Plateforme (Côté Gauche) */}
                    <div className="flex-shrink-0">
                        <Link
                            to="/"
                            className={`text-2xl font-extrabold ${ACCENT_COLOR_CLASS} flex items-center transition duration-150`}
                            onClick={handleNavLinkClick}
                        >
                            <GraduationCap className={`h-7 w-7 mr-2 text-blue-600`} />
                            <span className="hidden sm:inline">Espace Formateur</span>
                            <span className="sm:hidden">Formateur</span>
                        </Link>
                    </div>

                    {/* 2. Boutons de Contrôle (Côté Droit: SEULEMENT Hamburger) */}
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                            aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MENU LATÉRAL (Off-Canvas) --- */}
            {/* Utilise un flex-col et justify-between pour pousser la Déconnexion en bas */}
            <div 
                className={`
                    fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-40 p-6 
                    transform transition-transform duration-300 ease-in-out flex flex-col justify-between
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                `}
            >
                <div> {/* Conteneur pour la Navigation et le bouton Fermer (reste en haut) */}
                    <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800">Navigation</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Liens de Navigation */}
                    <nav className="space-y-2">
                        {trainerNavLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.to}
                                onClick={handleNavLinkClick} // Appelle la fonction simplifiée
                                className={getLinkClasses(link.to)} 
                            >
                                <link.icon className="h-5 w-5" />
                                <span>{link.name}</span>
                            </Link>
                        ))}
                    </nav>
                </div>
                
                {/* --- Bouton de Déconnexion (Poussé en bas du Menu Latéral) --- */}
                <div className="mt-8 pt-4 border-t border-gray-200">
                    <Link to={"/deconnexion"}
                        onClick={() => { setIsOpen(false); if (onLogout) onLogout(); }}
                        // Utilisation d'un bouton au lieu de Link to="/deconnexion" si onLogout gère la redirection
                        className={`flex w-full items-center justify-center px-4 py-3 border border-transparent text-base font-semibold rounded-lg text-white ${LOGOUT_BG_CLASS} transition duration-150 space-x-2 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Déconnexion</span>
                    </Link>
                </div>
            </div>
            
            {/* Overlay pour le fond (cliquer pour fermer) */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-30" 
                    onClick={() => setIsOpen(false)}
                ></div>
            )}
        </nav>
    );
};

export default FormateurNavbar;