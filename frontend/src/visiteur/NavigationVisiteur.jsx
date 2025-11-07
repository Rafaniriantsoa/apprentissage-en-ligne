// NavigationVisiteur.jsx (Finalisé)
import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';

// Import du nouveau composant qui contient la logique de la barre de navigation
import NavbarContent from './NavbarContent';

// Import des composants de page
import Accueil from './Accueil';
import Connexion from './Connexion';
// import Contact from './Contact';
import APropos from './APropos';
import Inscrire from './Inscrire';

// IMPORT DES COMPOSANTS DE COURS PUBLICS
import ListeCoursPublics from './ListeCoursPublics';
import ConsultationCours from './ConsultationCours';

const NavigationVisiteur = () => {

    return (
        <BrowserRouter>
            <NavbarContent />

            {/*les routes Routes de l'Application */}
            <Routes>
                <Route path="/" element={<Accueil />} />

                {/* Catalogue des Formations */}
                <Route path="/formations" element={<ListeCoursPublics />} />

                {/* Consultation détaillée */}
                <Route path="/cours/:idCours" element={<ConsultationCours />} />

                <Route path="/Apropos" element={<APropos />} />
                <Route path="/connexion" element={<Connexion />} />
                <Route path="/inscrire" element={<Inscrire />} />
            </Routes>
        </BrowserRouter>
    );
};

export default NavigationVisiteur;