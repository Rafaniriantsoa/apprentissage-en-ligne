// NavigationVisiteur.jsx (Mis à jour)
import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';


import NavbarContent from './NavbarContent'; 

// Import des composants de page
import Accueil from './Accueil';
import Profil from './Profil';
// import Creation from './Creation';
import CreationCours from '../components/cours/CreerCours'
import GestionLecons from '../components/cours/GestionLecons';
import GestionQuiz from '../components/cours/GestionQuiz';
import GestionQuestion from '../components/cours/GestionQuestion';
import ConsulterCours from '../components/cours/ConsulterCours';
// impor
import Deconnexion from './Deconnexion';



const NavigationFormateur = () => {

    return (
        <BrowserRouter>

            <NavbarContent /> 

            <Routes>
                <Route path="/" element={<Accueil />} />
                <Route path="/creer-cours" element={<CreationCours />} />
                <Route path="/gerer-lecon" element={<GestionLecons />} />
                <Route path="/gerer-quiz" element={<GestionQuiz />} />
                <Route path="/gerer-question" element={<GestionQuestion />} />
                <Route path="/consulter-cours" element={<ConsulterCours />} />
                

                <Route path="/profil" element={<Profil />} />
                <Route path="/deconnexion" element={<Deconnexion />} />



                {/* <Route path="/creations" element={<Creation />} /> */}

            </Routes>
        </BrowserRouter>
    );
};

export default NavigationFormateur;