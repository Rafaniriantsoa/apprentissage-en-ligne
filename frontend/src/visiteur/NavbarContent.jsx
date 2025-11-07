// NavbarContent.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom'; 
import { Home, LogIn, UserPlus, GraduationCap, Mail, Menu, X, Layers } from 'lucide-react';

// --- Définitions de style cohérentes 
const ACCENT_COLOR_CLASS = 'text-indigo-700';
const LIGHT_ACCENT_CLASS = 'text-blue-600';
const CTA_BG_CLASS = 'bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800';
const CTA_BORDER_CLASS = 'border-indigo-600';

const navLinks = [
    { name: 'Accueil', to: '/', icon: Home },
    { name: 'Formations', to: '/formations', icon: Layers },
    { name: 'A propos', to: '/Apropos', icon: Mail },
];

const NavbarContent = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation(); // Obtient l'URL actuelle

    // 1. Fonction pour déterminer les classes de style pour les liens de navigation
    const getLinkClasses = (path, isMobile = false) => {
        // Supprime l'ancre s'il y en a une pour la comparaison 
        const currentPath = location.pathname;
        const isActive = currentPath === path;

        if (isMobile) {
            // Style ACTIF Mobile: Fond léger et bordure latérale pour une meilleure visibilité
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
    };

    // 3. Fonction pour déterminer les classes de style pour les boutons d'action (plus complexe car les styles d'inactivité sont des dégradés)
    const getButtonClasses = (path, isPrimary = false) => {
        const isActive = location.pathname === path;
        const baseClasses = "flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md transition duration-150 space-x-1";

        if (isActive) {
            // Styles Actifs : Fond solide pour indiquer clairement l'état
            if (isPrimary) { // Bouton S'inscrire (CTA)
                return `${baseClasses} border-transparent bg-blue-800 text-white shadow-lg`;
            } else { // Bouton Se connecter (Secondaire)
                return `${baseClasses} bg-indigo-700 text-white border-indigo-700 shadow-md`;
            }
        } else {
            // Styles Inactifs (standards)
            if (isPrimary) { // Bouton S'inscrire (CTA)
                return `${baseClasses} border-transparent text-white ${CTA_BG_CLASS} shadow-md`;
            } else { // Bouton Se connecter (Secondaire)
                return `${baseClasses} text-indigo-600 hover:text-white hover:bg-indigo-600 ${CTA_BORDER_CLASS}`;
            }
        }
    };


    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex justify-between items-center h-16">

                    {/* 1. LOGO */}
                    <div className="flex-shrink-0">
                        <Link
                            to="/"
                            className={`text-2xl font-bold ${ACCENT_COLOR_CLASS} flex items-center cursor-pointer`}
                            onClick={() => handleNavLinkClick('/')}
                        >
                            <GraduationCap className={`h-6 w-6 mr-2 ${LIGHT_ACCENT_CLASS}`} />
                            Apprendre Facile
                        </Link>
                    </div>

                    {/* 2. Menus de Navigation (Desktop) et Boutons d'Action */}
                    <div className="hidden lg:flex lg:items-center lg:space-x-4 h-full">

                        {/* Liens de Navigation */}
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.to}
                                onClick={() => handleNavLinkClick(link.to)}
                                className={getLinkClasses(link.to)} // Application des styles actifs Desktop
                            >
                                <link.icon className="h-4 w-4" />
                                <span>{link.name}</span>
                            </Link>
                        ))}

                        {/* Boutons d'Action */}
                        <div className="ml-6 flex items-center space-x-4">
                            <Link to="/connexion" className={getButtonClasses('/connexion', false)}>
                                <LogIn className="h-4 w-4" />
                                <span>Se connecter</span>
                            </Link>
                            <Link to="/inscrire" className={getButtonClasses('/inscrire', true)}>
                                <UserPlus className="h-4 w-4" />
                                <span>S'inscrire</span>
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
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.to}
                                onClick={() => handleNavLinkClick(link.to)}
                                className={getLinkClasses(link.to, true)} // Application des styles actifs Mobile
                            >
                                <link.icon className="h-5 w-5" />
                                <span>{link.name}</span>
                            </Link>
                        ))}
                    </div>
                    <div className="pt-4 pb-3 border-t border-blue-100">
                        <div className="flex flex-col px-5 space-y-2">
                            <Link to="/connexion" onClick={() => handleNavLinkClick('/connexion')} className={getButtonClasses('/connexion', false)}>
                                <LogIn className="h-4 w-4" />
                                <span>Se connecter</span>
                            </Link>
                            <Link to="/inscrire" onClick={() => handleNavLinkClick('/inscrire')} className={getButtonClasses('/inscrire', true)}>
                                <UserPlus className="h-4 w-4" />
                                <span>S'inscrire</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}


        </nav>
    );
};

export default NavbarContent;