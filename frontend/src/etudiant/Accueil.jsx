// src/components/AccueilHero.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, AlertTriangle } from 'lucide-react';

const Accueil = () => {

  // --- Configuration API et utilisateur ---
  const LIST_API_URL = 'http://localhost/projet-plateforme/backend/api/etudiant/listerCoursEtudiant.php';
  const BASE_URL_FICHIERS = 'http://localhost/projet-plateforme/backend/api/formateur/';

  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}');
  const idEtudiant = utilisateur.id_utilisateur;
  const nomEtudiant = utilisateur.nom_complet || 'Étudiant';

  // --- États du composant ---
  const [mesCours, setMesCours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMesCours = async () => {
    setLoading(true);
    setError('');

    if (!idEtudiant) {
      setError("Impossible de charger les cours. Utilisateur non identifié.");
      setLoading(false);
      return;
    }

    try {
      // On passe l'ID de l'utilisateur à l'API pour le calcul de la progression
      const response = await axios.get(`${LIST_API_URL}?id_utilisateur=${idEtudiant}`);

      if (response.data.cours && response.data.cours.length > 0) {
        // Filtrer pour ne garder QUE les cours où l'étudiant est inscrit
        const coursInscrits = response.data.cours.filter(c => c.est_inscrit);
        setMesCours(coursInscrits);

      } else {
        setMesCours([]); // Aucun cours trouvé
      }
    } catch (err) {
      console.error("Erreur de chargement des cours:", err.response || err);
      setError(`Impossible de charger vos formations : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMesCours();
  }, [idEtudiant]);


  // --- RENDU DU COMPOSANT ---
  return (
    <section id="accueil" className="relative isolate overflow-hidden pt-14 bg-gray-50 min-h-screen">

      {/* Hero Section / Bienvenue */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            Bienvenue, <span className="text-indigo-600">{nomEtudiant} !</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Continuez votre apprentissage là où vous vous êtes arrêté.
          </p>
        </div>
      </div>

      {/* Section des Cours Inscrits */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 border-b pb-3 mb-8 flex items-center">
          <BookOpen className="w-6 h-6 mr-3 text-indigo-600" /> Mes Formations en Cours
        </h2>

        {loading && (
          <div className="text-center p-10 text-lg">
            <Clock className="w-6 h-6 animate-spin inline-block mr-2" /> Chargement de vos cours...
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center">
            <AlertTriangle className="w-5 h-5 mr-3" />
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {!loading && !error && mesCours.length === 0 && (
          <div className="text-center p-10 bg-white rounded-lg shadow-md border-2 border-dashed border-gray-200">
            <p className="text-xl font-semibold text-gray-700 mb-4">
              Vous n'êtes inscrit à aucune formation pour le moment. 😔
            </p>
            <Link
              to="/formations"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150"
            >
              Parcourir le Catalogue <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        )}

        {/* Grille des Cours Inscrits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mesCours.map((course) => (
            <Link
              key={course.id_cours}
              to={`/cours/acces/${course.id_cours}`} // Lien vers l'accès direct au cours
              className="block bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1 overflow-hidden"
            >
              <div className="h-40 w-full overflow-hidden bg-gray-100">
                {course.photo ? (
                  <img
                    src={`${BASE_URL_FICHIERS}${course.photo}`}
                    alt={`Photo du cours ${course.titre}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    [Image non disponible]
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                  {course.titre}
                </h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                  {course.description || "Aucune description fournie."}
                </p>
                <p className="text-sm font-semibold text-indigo-600">
                  Formateur: {course.formateur}
                </p>

                {/* AJOUT DE LA BARRE DE PROGRESSION */}
                {course.progression_pourcentage !== undefined && (
                  <div className="mt-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Progression</span>
                      <span className="text-sm font-semibold text-indigo-600">{course.progression_pourcentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${course.progression_pourcentage}%`,
                          backgroundColor: course.progression_pourcentage === 100 ? '#10B981' : '#4F46E5' // Vert si 100%, Indigo sinon
                        }}
                      ></div>
                    </div>
                  </div>
                )}
                {/* FIN AJOUT PROGRESSION */}

                {/* Mise à jour du bouton d'action */}
                <div className="mt-4 flex justify-end">
                  <span className={`inline-flex items-center px-3 py-1 text-sm font-medium text-white rounded-full transition duration-150 ${course.progression_pourcentage === 100 ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                    {course.progression_pourcentage === 100 ? 'Formation terminée !' : 'Continuer le cours'} <ArrowRight className="w-4 h-4 ml-2" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Accueil;