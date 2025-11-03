// NavigationVisiteur.jsx (Mis à jour)
import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';

// Import du nouveau composant qui contient la logique de la barre de navigation
import NavbarContent from './NavbarContent'; 

// Import des composants de page
import Accueil from './Accueil';
import Connexion from './Connexion';
import Formations from './Formations';
import Contact from './Contact';
import Inscrire from './Inscrire';

const NavigationVisiteur = () => {

    return (
        <BrowserRouter>
            {/* REMPLACER LA NAV ENTIÈRE par le composant NavbarContent 
                qui gère l'état actif, le menu mobile, et le Scroll to Top. */}
            <NavbarContent /> 

            {/* Définition des Routes de l'Application */}
            <Routes>
                <Route path="/" element={<Accueil />} />
                <Route path="/formations" element={<Formations />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/connexion" element={<Connexion />} />
                <Route path="/inscrire" element={<Inscrire />} />
                {/* Ajoutez d'autres routes ici */}
            </Routes>
        </BrowserRouter>
    );
};

export default NavigationVisiteur;