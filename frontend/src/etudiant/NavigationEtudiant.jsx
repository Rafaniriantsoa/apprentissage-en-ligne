// NavigationVisiteur.jsx (Mis à jour)
import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';

// Import du nouveau composant qui contient la logique de la barre de navigation
import NavbarContent from './NavbarContent'; 

// Import des composants de page
import Accueil from './Accueil';
import AutreFormation from './AutreFormation';
import Profil from './Profil';
import Deconnexion from './Deconnexion'

const NavigationEtudiant = () => {

    return (
        <BrowserRouter>
            {/* REMPLACER LA NAV ENTIÈRE par le composant NavbarContent 
                qui gère l'état actif, le menu mobile, et le Scroll to Top. */}
            <NavbarContent /> 

            {/* Définition des Routes de l'Application */}
            <Routes>
                <Route path="/" element={<Accueil />} />
                <Route path="/autre-formation" element={<AutreFormation />} />
                <Route path="/profil" element={<Profil   />} />
                <Route path="/deconnexion" element={<Deconnexion/>} />

                {/* Ajoutez d'autres routes ici */}
            </Routes>
        </BrowserRouter>
    );
};

export default NavigationEtudiant;