// src/components/AccueilHero.jsx
import React from 'react';
// Importez une icône si nécessaire, par exemple :
import { ArrowRight } from 'lucide-react'; 
const Accueil = () => {
  return (
    // La div principale utilise l'ID pour l'ancrage de la navigation
    <section id="accueil" className="relative isolate overflow-hidden pt-14 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-40">
        
        {/* Colonne Gauche : Contenu Texte et CTAs */}
        <div className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto lg:order-1">
          
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            Maîtrisez votre <span className="text-indigo-600">Futur Professionnel</span> dès Aujourd'hui.
          </h1>
          
          <p className="mt-6 text-xl leading-8 text-gray-600">
            Notre plateforme d'e-learning vous offre des **formations certifiantes** et interactives, conçues par des experts pour vous propulser au sommet de votre carrière.
          </p>
          
          {/* Bloc d'Appel à l'Action (CTA) */}
          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-x-6 gap-y-4">
            
            <a
              href="/inscription"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-7 py-3 text-base font-semibold text-white shadow-xl hover:bg-indigo-700 transition duration-300 transform hover:scale-105"
            >
              Démarrer Gratuitement
            </a>
            
            <a 
              href="#formations" 
              className="text-base font-semibold leading-6 text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
            >
              Voir les formations
              <ArrowRight className="h-4 w-4 ml-1 transition duration-200 group-hover:translate-x-1" />
            </a>
          </div>
          
          {/* Statistique de Confiance */}
          <div className="mt-16 border-t pt-8 border-gray-200">
            <p className="text-sm font-semibold text-gray-900">Plus de 10 000 étudiants nous font confiance :</p>
            <div className="mt-2 flex space-x-4 text-sm text-gray-500">
                <span className="font-medium text-indigo-600">⭐ 4.9/5</span>
                <span>|</span>
                <span>🎓 30+ Formations</span>
                <span>|</span>
                <span>✅ Certifications reconnues</span>
            </div>
          </div>

        </div>
        
        {/* Colonne Droite : Illustration du Produit */}
        <div className="mt-16 sm:mt-24 lg:mt-0 lg:flex-shrink-0 lg:flex-grow lg:order-2">
          {/* Remplacez ceci par une capture d'écran de votre dashboard ou une illustration 3D */}
          <div className="relative rounded-2xl shadow-2xl overflow-hidden transform transition duration-500 hover:shadow-indigo-500/50">
             
            <div className="absolute inset-0 bg-indigo-600 opacity-20 pointer-events-none"></div>
          </div>
          <p className="mt-4 text-center text-sm text-gray-500 italic">Interface utilisateur conçue pour l'efficacité et l'apprentissage.</p>
        </div>
      </div>
    </section>
  );
};

export default Accueil;