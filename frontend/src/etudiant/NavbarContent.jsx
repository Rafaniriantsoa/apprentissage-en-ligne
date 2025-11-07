// NavbarContent.jsx (Espace Formateur)
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
// NOUVELLES ICÔNES : User, BookOpen, LogOut
import { Home, User, BookOpen, GraduationCap, Menu, X, LogOut } from 'lucide-react';

// --- Définitions de style cohérentes ---
const ACCENT_COLOR_CLASS = 'text-indigo-700';
const LIGHT_ACCENT_CLASS = 'text-blue-600';
// Le CTA devient le bouton Déconnexion
const LOGOUT_BG_CLASS = 'bg-blue-600 hover:bg-blue-700';
const CTA_BORDER_CLASS = 'border-indigo-600';


// 🚀 NOUVEAUX LIENS POUR L'ESPACE FORMATEUR
const trainerNavLinks = [
    { name: 'Accueil', to: '/', icon: Home }, // L'accueil devient le tableau de bord
    { name: 'Autres formations', to: '/formations', icon: BookOpen },
    { name: 'Mon Profil', to: '/profil', icon: User },
];


const NavbarContent = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    // 1. Fonction pour déterminer les classes de style pour les liens de navigation
    const getLinkClasses = (path, isMobile = false) => {
        const currentPath = location.pathname;
        // La page active est détectée si le chemin commence par le lien (utile pour /creations/edit/1)
        // Pour les liens exacts comme /profil, on utilise une vérification stricte
        const isActive = path === currentPath || (path !== '/' && currentPath.startsWith(path));

        if (isMobile) {
            // Style ACTIF Mobile: Fond léger et bordure latérale (Espace Formateur)
            if (isActive) {
                return `block px-5 py-2 rounded-md text-base font-semibold transition duration-150 flex items-center space-x-2 w-full text-left bg-indigo-50 border-l-4 border-indigo-700 ${ACCENT_COLOR_CLASS}`;
            }
            // Style INACTIF Mobile
            return `block px-5 py-2 rounded-md text-base font-medium transition duration-150 flex items-center space-x-2 w-full text-left text-gray-700 hover:bg-blue-50 hover:text-indigo-700`;
        }

        // Style ACTIF Desktop: Bordure inférieure
        const baseClasses = "px-3 py-4 text-sm font-medium transition duration-150 flex items-center space-x-1 border-b-2";

        if (isActive) {
            return `${baseClasses} ${ACCENT_COLOR_CLASS} border-indigo-600 font-semibold`;
        }
        // Style INACTIF Desktop
        return `${baseClasses} text-gray-700 hover:text-indigo-800 hover:border-indigo-200 border-transparent`;
    };

    // 2. Fonction pour gérer le clic sur un lien (fermeture du menu + Scroll to Top)
    const handleNavLinkClick = (to) => {
        setIsOpen(false);

        // La logique Scroll to Top est maintenue pour le Tableau de bord (/)
        if (location.pathname === '/formateur' && to === '/formateur') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // 3. Fonction de Déconnexion (simulée)
    const handleLogout = () => {
        setIsOpen(false);
        // Ici, vous ajouteriez la vraie logique de déconnexion (effacement du token, blueirection, etc.)
        alert('Déconnexion simulée. blueirection vers la page d’accueil...');
        // blueirection vers la page d'accueil après déconnexion (ou page de connexion)
        // window.location.href = '/'; 
    };


    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* 1. Logo / Nom de la Plateforme (Adapté) */}
                    <div className="flex-shrink-0">
                        <Link
                            to="/formateur"
                            className={`text-2xl font-bold ${ACCENT_COLOR_CLASS} flex items-center cursor-pointer`}
                            onClick={() => handleNavLinkClick('/formateur')}
                        >
                            <GraduationCap className={`h-6 w-6 mr-2 ${LIGHT_ACCENT_CLASS}`} />
                            <span className="hidden sm:inline">Espace Etudiant</span>
                            <span className="sm:hidden">Formateur</span>
                        </Link>
                    </div>

                    {/* 2. Menus de Navigation (Desktop) et Bouton Déconnexion */}
                    <div className="hidden lg:flex lg:items-center lg:space-x-4 h-full">

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
                                onClick={() => setIsOpen(false)} // Ferme le menu après le clic
                                className={`flex w-full items-center justify-center px-4 py-2 border border-transparent text-base font-semibold rounded-lg text-white ${LOGOUT_BG_CLASS} transition duration-150 space-x-2 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                            >
                                <LogOut className="h-5 w-5" />
                                <span>Déconnexion</span>
                            </Link>
                        </div>
                    </div>

                    {/* 3. Bouton Menu Hamburger (Mobile) */}
                    <div className="flex lg:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Ouvrir le menu principal</span>
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. Menu Mobile Déroulant */}
            {isOpen && (
                <div className="lg:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {/* Liens de Navigation Mobile */}
                        {trainerNavLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.to}
                                onClick={() => handleNavLinkClick(link.to)}
                                className={getLinkClasses(link.to, true)} // Styles actifs mobile appliqués
                            >
                                <link.icon className="h-5 w-5" />
                                <span>{link.name}</span>
                            </Link>
                        ))}
                    </div>
                    {/* Bouton de Déconnexion Mobile */}
                    <div className="pt-4 pb-3 border-t border-blue-100">
                        <div className="flex px-5">
                            <Link to={"/deconnexion"}
                                onClick={() => setIsOpen(false)} // Ferme le menu après le clic
                                className={`flex w-full items-center justify-center px-4 py-2 border border-transparent text-base font-semibold rounded-lg text-white ${LOGOUT_BG_CLASS} transition duration-150 space-x-2 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                            >
                                <LogOut className="h-5 w-5" />
                                <span>Déconnexion</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default NavbarContent;