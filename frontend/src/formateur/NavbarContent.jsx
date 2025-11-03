// NavbarContent.jsx (Espace Formateur)
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
// Icônes Lucide-React
import { Home, User, BookOpen, GraduationCap, Menu, X, LogOut } from 'lucide-react';

// --- Définitions de style cohérentes ---
// Utilisation d'une couleur d'accent forte (ex: Indigo)
const ACCENT_COLOR_CLASS = 'text-indigo-700';
const HOVER_BG_CLASS = 'hover:bg-indigo-50'; // Fond très clair pour le survol
const LOGOUT_BG_CLASS = 'bg-red-600 hover:bg-red-700';

// NOUVEAUX LIENS POUR L'ESPACE FORMATEUR
const trainerNavLinks = [
    { name: 'Tableau de bord', to: '/', icon: Home },
    { name: 'Créer un cours', to: '/creer-cours', icon: BookOpen },
    { name: 'Mon Profil', to: '/profil', icon: User },
];


const NavbarContent = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    // 1. Fonction pour déterminer les classes de style pour les liens de navigation
    const getLinkClasses = (path, isMobile = false) => {
        const currentPath = location.pathname;
        // La page active est détectée si le chemin commence par le lien 
        // La racine '/' doit correspondre uniquement à '/'
        const isRootActive = path === '/' && currentPath === '/';
        const isSubPathActive = path !== '/' && currentPath.startsWith(path);

        const isActive = isRootActive || isSubPathActive;

        if (isMobile) {
            // Style ACTIF Mobile: Fond léger, texte accentué, et bordure latérale (UX d'un menu latéral)
            if (isActive) {
                return `block px-4 py-2 rounded-lg text-base font-bold transition duration-150 flex items-center space-x-3 w-full text-left bg-indigo-100/70 border-l-4 border-indigo-700 ${ACCENT_COLOR_CLASS}`;
            }
            // Style INACTIF Mobile
            return `block px-4 py-2 rounded-lg text-base font-medium transition duration-150 flex items-center space-x-3 w-full text-left text-gray-700 ${HOVER_BG_CLASS} hover:${ACCENT_COLOR_CLASS}`;
        }

        // Style ACTIF Desktop: Bordure inférieure marquée et texte gras
        const baseClasses = "px-3 py-4 text-sm font-medium transition duration-150 flex items-center space-x-1 border-b-2";

        if (isActive) {
            return `${baseClasses} ${ACCENT_COLOR_CLASS} border-indigo-600 font-semibold`;
        }
        // Style INACTIF Desktop
        return `${baseClasses} text-gray-700 hover:text-indigo-800 hover:border-indigo-300 border-transparent`;
    };

    // 2. Fonction pour gérer le clic sur un lien (fermeture du menu + Scroll to Top)
    const handleNavLinkClick = (to) => {
        setIsOpen(false);
        // Si on clique sur le lien du tableau de bord et qu'on est déjà sur cette page, on scroll en haut.
        if (location.pathname === to) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };


    return (
        <nav className="bg-white shadow-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* 1. Logo / Nom de la Plateforme */}
                    <div className="flex-shrink-0">
                        <Link
                            to="/" // Redirige vers la racine (tableau de bord)
                            className={`text-2xl font-extrabold ${ACCENT_COLOR_CLASS} flex items-center transition duration-150`}
                            onClick={() => handleNavLinkClick('/')}
                        >
                            <GraduationCap className={`h-7 w-7 mr-2 text-blue-600`} />
                            <span className="hidden sm:inline">Espace Formateur</span>
                        </Link>
                    </div>

                    {/* 2. Menus de Navigation (Desktop) et Bouton Déconnexion */}
                    <div className="hidden md:flex md:items-center md:space-x-4 h-full">

                        {/* Liens de Navigation du Formateur */}
                        {trainerNavLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.to}
                                onClick={() => handleNavLinkClick(link.to)}
                                className={getLinkClasses(link.to)}
                            >
                                <link.icon className="h-4 w-4" />
                                <span>{link.name}</span>
                            </Link>
                        ))}

                        {/* Bouton de Déconnexion (CTA Rouge) */}
                        <div className="ml-6 flex items-center">
                            <Link to={"/deconnexion"}
                                className={`flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white ${LOGOUT_BG_CLASS} transition duration-150 space-x-1 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
                            >
                                <LogOut className="h-4 w-4" /> {/* Icône ajoutée */}
                                <span>Déconnexion</span>
                            </Link>
                        </div>
                    </div>

                    {/* 3. Bouton Menu Hamburger (Mobile) */}
                    <div className="flex md:hidden">
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

            {/* 4. Menu Mobile Déroulant */}
            {isOpen && (
                <div className="md:hidden transition-all duration-300 ease-in-out border-t border-gray-100">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {/* Liens de Navigation Mobile */}
                        {trainerNavLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.to}
                                onClick={() => handleNavLinkClick(link.to)}
                                className={getLinkClasses(link.to, true)} 
                            >
                                <link.icon className="h-5 w-5" />
                                <span>{link.name}</span>
                            </Link>
                        ))}
                    </div>
                    {/* Bouton de Déconnexion Mobile */}
                    <div className="py-4 px-5 border-t border-gray-200">
                        <Link to={"/deconnexion"}
                            onClick={() => setIsOpen(false)} // Ferme le menu après le clic
                            className={`flex w-full items-center justify-center px-4 py-2 border border-transparent text-base font-semibold rounded-lg text-white ${LOGOUT_BG_CLASS} transition duration-150 space-x-2 shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
                        >
                            <LogOut className="h-5 w-5" />
                            <span>Déconnexion</span>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default NavbarContent;