// src/NavigationEtudiant.jsx
import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';

// Import du nouveau composant qui contient la logique de la barre de navigation
import NavbarContent from './NavbarContent'; 

// Import des composants de page
import Accueil from './Accueil';
// import Profil from './Profil';
import Deconnexion from './Deconnexion';
import AutreFormations from './AutreFormations';
import AccesCoursEtudiant from './AccesCoursEtudiant';
// 💡 NOUVEAU : Import du composant pour passer le quiz
import PasserQuiz from '../components/quiz/PasserQuiz'; 
import ProfilEtudiant from './ProfilEtudiant';


const NavigationEtudiant = () => {

    return (
        <BrowserRouter>
            <NavbarContent /> 

            {/* Définition des Routes de l'Application */}
            <main className="pt-16"> 
                <Routes>
                    <Route path="/" element={<Accueil />} />
                    {/* <Route path="/profil" element={<Profil   />} /> */}
                    <Route path="/deconnexion" element={<Deconnexion/>} />
                    <Route path="/formations" element={<AutreFormations />} />
                    <Route path="/profil" element={<ProfilEtudiant/>} />
                    <Route path="/cours/acces/:id_cours" element={<AccesCoursEtudiant />} />
                    
                    {/* 💡 NOUVEAU : Route pour le passage du quiz */}
                    <Route path="/quiz/passer/:idQuiz" element={<PasserQuiz />} />

                    <Route path="*" element={<div>Page non trouvée</div>} />
                </Routes>
            </main>
        </BrowserRouter>
    );
};

export default NavigationEtudiant;