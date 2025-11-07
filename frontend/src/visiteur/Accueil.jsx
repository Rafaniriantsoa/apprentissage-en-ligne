// src/components/AccueilAlternatif.jsx

// (Le reste des imports et la fonction LinkToInscription restent inchangés)
import React from 'react';
import {
  ArrowRight, GraduationCap, Presentation, Zap, Heart, Users, Mail,
  Phone,
  MessageCircle,
  Facebook
} from 'lucide-react';

// NOTE : Ceci reste une implémentation simplifiée du lien
const LinkToInscription = ({ children, to, className }) => (
  <a href={to} className={className}>
    {children}
  </a>
);

const contactInfo = {
  phone: "+261 38 05 796 48",
  whatsapp: "+261 32 73 898 98",
  email: "rafaniriantsoaavotra9@gmail.com",
  facebook: "https://web.facebook.com/rafaniriantsoa.avotra/"
};

const AccueilAlternatif = () => {
  const platformName = "Apprendre Facile";
  const mainDomain = "l'apprentissage en ligne";

  return (
    // Conteneur global (fond blanc cassé)
    <div className="home-page-alternative bg-white"> {/* J'ai retiré min-h-screen du container général pour le mettre sur le header */}
      <div className="mx-auto">
        {/* --- 1. Section Principale (Hero) --- */}
        <header
          className="hero-section text-center min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-indigo-700 via-indigo-200 to-white mb-16 px-4">

          {/* Le contenu est enveloppé pour assurer le centrage */}
          <div className="">
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-4 tracking-tight">
              APPRENDRE ET ENSEIGNER  <br />
              <span className="text-indigo-700 text-2xl font-bold sm:text-4xl">100% Gratuit et Illimité.</span>
            </h1>
            <p className="text-md sm:text-xl text-gray-700 font-light max-w-3xl mx-auto mb-8">
              Bienvenue sur {platformName}, la plateforme qui supprime la barrière du coût et la distance pour l'éducation. Créez des cours ou suivez-les, sans jamais payer.
            </p>

            {/* CTA Unique et puissant */}
            <LinkToInscription
              to="/inscrire"
              className="inline-flex items-center justify-center tracking-wide
                                       px-10 py-4 sm:text-lg font-bold 
                                       text-white text-sm bg-indigo-600 rounded-full 
                                       shadow-lg transition duration-300 ease-in-out 
                                       hover:bg-indigo-700 transform hover:scale-105 ring-4 ring-indigo-300"
              aria-label="Démarrer l'inscription gratuite"
            >
              <Zap className="mr-3 h-5 w-5" />
              Commencez Gratuitement !
              <ArrowRight className="ml-3 h-5 w-5" />
            </LinkToInscription>
          </div>
        </header>

        {/* --- 2. Avantages Rôles Détaillés --- */}
        <section className="p-8 mb-16">
          <h2 className="text-4xl font-bold text-indigo-700 mb-12 text-center">
            Pourquoi choisir {platformName} ?
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Carte Formateur */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-indigo-500">
              <Presentation className="h-12 w-12 text-indigo-600 mb-4" />
              <h3 className="text-3xl font-bold text-indigo-700 mb-4">Formateurs : Partagez sans contraintes</h3>
              <p className="text-lg text-gray-700 mb-6">
                Monétisez votre passion ailleurs, mais partagez-la ici. Nous vous fournissons les outils, vous apportez le savoir.
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-start text-gray-800"><ArrowRight className="h-5 w-5 mr-1 text-indigo-500" /> <span className='font-bold'>Création facile</span>: Interface intuitive pour téléverser et organiser vos contenus.</li>
                <li className="flex items-center justify-start text-gray-800"><ArrowRight className="h-5 w-5 mr-1 text-indigo-500" /> <span className='font-bold'>Zéro Commission</span>: Gardez 100% de la propriété de vos supports.</li>
              </ul>
            </div>

            {/* Carte Étudiant */}
            <div className="p-8 rounded-2xl shadow-xl border-t-4 border-indigo-500">
              <GraduationCap className="h-12 w-12 text-indigo-600 mb-4" />
              <h3 className="text-3xl font-bold text-indigo-700 mb-4">Étudiants : Accès au Savoir Universel</h3>
              <p className="text-lg text-gray-700 mb-6">
                Oubliez les murs payants. Notre bibliothèque est ouverte 24h/24, 7j/7, pour tous, sans limite.
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center text-gray-800"><ArrowRight className="h-5 w-5 mr-3 text-indigo-500" /> <span className='font-bold'>Toute la Bibliothèque</span> : Accès illimité à tous les cours sans restrictions.</li>
                <li className="flex items-center text-gray-800"><ArrowRight className="h-5 w-5 mr-3 text-indigo-500" /> <span className='font-bold'>Mises à Jour Constantes</span> : Bénéficiez des nouveaux contenus sans frais additionnels.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* --- 3. Promesse (Reste inchangé) --- */}
        {/* -------------------------------------- */}
        <section className="cta-final text-center bg-indigo-700 text-white p-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            La connaissance ne devrait pas avoir de prix, et être accessible sans se déplacer.</h2>
          <p className="text-xl mb-10 text-indigo-200">
            C'est notre promesse. Cliquez ci-dessous pour commencer à apprendre ou à enseigner gratuitement.
          </p>

          <LinkToInscription
            to="/inscrire"
            className="inline-flex items-center justify-center 
                                   px-10 py-4 text-lg font-bold 
                                   text-indigo-800 bg-gray-200 rounded-full 
                                   shadow-xl transition duration-300 ease-in-out 
                                   hover:bg-gray-300 transform hover:scale-105"
            aria-label="S'inscrire gratuitement maintenant (bas de page)"
          >
            <Heart className="mr-3 h-5 w-5" />
            Oui, je veux l'accès GRATUIT !
            <ArrowRight className="ml-3 h-5 w-5" />
          </LinkToInscription>
        </section>

        {/* -------------------------------------- */}
        {/* --- 4. Pied de page (Note) (Reste inchangé) --- */}
        {/* -------------------------------------- */}
        <footer className=" bg-gray-900 text-white p-12 shadow-inner">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-sm border-b border-gray-700 pb-8 mb-8">

            {/* Colonne 1: Mention Légale/Statut */}
            <div>
              <h4 className="text-lg font-bold text-indigo-400 mb-4">{platformName}</h4>

              <p className="text-gray-400 leading-relaxed">
                Notre mission est simple : Tout est gratuit et accessible. <br />
                La plateforme est propulsée par l'engagement de notre communauté de formateurs bénévoles.
              </p>
            </div>

            {/* Colonne 2: Coordonnées de Contact */}
            <div>
              <h4 className="text-lg font-bold text-indigo-400 mb-4">Nous Contacter</h4>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-300 hover:text-indigo-300 transition">
                  <Mail className="h-5 w-5 mr-3 text-gray-400" />
                  <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
                </li>
                <li className="flex items-center text-gray-300 hover:text-indigo-300 transition">
                  <Phone className="h-5 w-5 mr-3 text-gray-400" />
                  <a href={`tel:${contactInfo.phone}`}>{contactInfo.phone}</a>
                </li>
              </ul>
            </div>

            {/* Colonne 3: Réseaux Sociaux & Support Rapide */}
            <div>
              <h4 className="text-lg font-bold text-indigo-400 mb-4">Support et Communauté</h4>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-300 hover:text-green-400 transition">
                  <MessageCircle className="h-5 w-5 mr-3 text-green-500" />
                  <a href={`https://wa.me/${contactInfo.whatsapp.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp Support</a>
                </li>
                <li className="flex items-center text-gray-300 hover:text-blue-500 transition">
                  <Facebook className="h-5 w-5 mr-3 text-blue-400" />
                  <a href={contactInfo.facebook} target="_blank" rel="noopener noreferrer">Rejoignez-nous sur Facebook</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Mentions Légales Finales (petite police) */}
          <div className="text-center text-gray-500 text-xs">
            <p className="text-gray-400 mb-3">
              © {new Date().getFullYear()} {platformName}.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AccueilAlternatif;