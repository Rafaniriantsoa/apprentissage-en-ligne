import React from 'react';
import { Home, Zap, Heart, UserCheck, CheckCircle, Globe } from 'lucide-react';
import { Link } from 'react-router-dom'; 

const APropos = () => {

    const platformName = "Apprendre Facile";

    const mission = "Notre mission est de démolir les barrières financières et géographiques pour l'éducation. Nous connectons la connaissance aux apprenants du monde entier, sans jamais facturer un centime. L'accès au savoir est un droit, pas un privilège.";

    const avantages = [
        {
            icone: <Globe className="h-8 w-8 text-white" />,
            titre: "Accès Universel",
            description: "Tous les cours sont et resteront 100% gratuits. Pas de frais cachés, pas d'abonnements."
        },
        {
            icone: <UserCheck className="h-8 w-8 text-white" />, 
            titre: "Accessibilité Totale ", 
            description: "Accédez instantanément au savoir de professionnels sans contraintes d'horaire, de lieu ou de coût." // Nouvelle description
        },
        {
            icone: <Zap className="h-8 w-8 text-white" />,
            titre: "Plateforme Ouverte",
            description: "Publiez votre propre cours en toute liberté. C'est votre savoir, votre communauté."
        }
    ];

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 mt-8">

            <header className="text-center mb-16 p-8 bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl shadow-2xl">
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 flex items-center justify-center">
                    Notre Histoire : {platformName}
                </h1>
                <p className="text-xl text-indigo-200 font-light">
                    Libérer le savoir, c'est la seule voie.
                </p>
            </header>

            {/* Section Mission et Promesse */}
            <section className="mb-16">
                <h2 className="text-3xl font-bold text-indigo-700 mb-6 border-b-4 border-gray-200 inline-block pb-1">
                    La Promesse du Sans Barrière
                </h2>
                <div className="bg-gray-50 p-6 md:p-10 rounded-lg shadow-inner border-l-4 border-indigo-500">
                    <p className="text-gray-700 text-xl leading-relaxed font-medium">
                        "{mission}"
                    </p>
                    <p className="mt-6 text-sm text-gray-500 flex items-center">
                        <CheckCircle className='h-4 w-4 mr-2 text-green-500' /> Notre modèle est basé sur le partage et l'engagement communautaire.
                    </p>
                </div>
            </section>

            <hr className="my-10" />

            {/* Section Avantages */}
            <section>
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                    Nos Trois Piliers Fondamentaux
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {avantages.map((avantage, index) => (
                        <div
                            key={index}
                            className="bg-white p-6 rounded-2xl shadow-xl hover:shadow-indigo-300 transition duration-300 transform hover:-translate-y-1 text-center border-t-4 border-indigo-600"
                        >
                            <div className="mx-auto mb-4 bg-indigo-600 p-3 rounded-full inline-block shadow-lg">
                                {avantage.icone}
                            </div>
                            <h3 className="text-xl font-bold text-indigo-700 mb-3">
                                {avantage.titre}
                            </h3>
                            <p className="text-gray-600">
                                {avantage.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <hr className="my-10" />

            {/* Appel à l'action (CTA) Harmonisé */}
            <div className="text-center mt-16 p-8 bg-gray-200 rounded-lg shadow-xl">
                <h3 className="text-3xl font-bold text-indigo-800 mb-4">
                    Rejoignez le Mouvement de l'Éducation Libre !
                </h3>
                <p className="text-indigo-700 mb-6 max-w-2xl mx-auto font-medium">
                    Que vous souhaitiez apprendre ou enseigner, votre place est parmi nous.
                </p>
                <Link
                    to="/inscrire"
                    className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition duration-300 shadow-2xl transform hover:scale-105"
                >
                    <Heart className="mr-3 h-5 w-5" /> Je m'inscris GRATUITEMENT !
                </Link>
            </div>

        </div>
    );
};

export default APropos;