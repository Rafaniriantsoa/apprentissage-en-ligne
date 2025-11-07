// NavigationFormateur.jsx
import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';

import NavbarContent from './NavbarContent';

// Import des composants de page
import Accueil from './Accueil';
// import Profil from './Profil';
import CreationCours from '../components/cours/CreerCours'
// import ListeCours from '../components/cours/ListeCours';
import GestionLecons from '../components/cours/GestionLecons';
import GestionQuiz from '../components/cours/GestionQuiz';
import GestionQuestion from '../components/cours/GestionQuestion';
import ConsulterCours from '../components/cours/ConsulterCours';
import Deconnexion from './Deconnexion';
import ListeEtudiants from './ListeEtudiants';       // Assurez-vous du chemin
import ListeCoursFormateur from './ListeCoursFormateur'; // Assurez-vous du chemin
import ListeCours from '../components/cours/ListeCours'; // cours rehetra na mbola tsy publié aza
import ProfilFormateur from './ProfilFormateur'; // profil an'ny formateur
import ModifierCours from '../components/cours/ModifierCours';
const NavigationFormateur = () => {

    return (
        <BrowserRouter>

            <NavbarContent />

            <Routes>
                <Route path="/" element={<Accueil />} />
                <Route path="/creer-cours" element={<CreationCours />} />

                {/* CORRECTION : Routes statiques pour utiliser localStorage */}
                <Route path="/gerer-lecon" element={<GestionLecons />} />
                <Route path="/gerer-quiz" element={<GestionQuiz />} />
                <Route path="/gerer-question" element={<GestionQuestion />} />
                <Route path="/consulter-cours" element={<ConsulterCours />} />

                <Route path="/liste-etudiants" element={<ListeEtudiants />} />
                <Route path="/liste-cours-publies" element={<ListeCoursFormateur />} />
                <Route path="/liste-cours" element={<ListeCours />} />
                <Route path="/modifier-cours" element={<ModifierCours />} />
                <Route path="/profil" element={<ProfilFormateur />} />
                <Route path="/deconnexion" element={<Deconnexion />} />

            </Routes>
        </BrowserRouter>
    );
};

export default NavigationFormateur;