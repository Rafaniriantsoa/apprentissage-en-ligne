// ListeCoursPublics.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
// Importation des icônes pour la recherche
import { Search, BookOpen, AlertCircle, Tag, User } from 'lucide-react'; 

const ListeCoursPublics = () => {

    const PUBLIC_API_BASE = 'http://localhost/projet-plateforme/backend/api/visiteur/';
    const LIST_API_URL = `${PUBLIC_API_BASE}listerCoursPublics.php`; 
    
    const [cours, setCours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchCours = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await axios.get(LIST_API_URL);
                const fetchedCours = response.data.cours || [];
                
                if (fetchedCours.length > 0) {
                    setCours(fetchedCours);
                } else {
                    setError(response.data.message || "Aucun cours public trouvé pour le moment.");
                    setCours([]);
                }
            } catch (err) {
                console.error("Erreur de chargement des cours:", err.response || err);
                // setError(`Impossible de charger le catalogue: Vérifiez le serveur API.`);
                setCours([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCours();
    }, []);
    console.log(cours)
    // Fonction de filtrage des cours
    const filteredCours = useMemo(() => {
        if (!searchTerm) return cours;
        const lowerCaseSearch = searchTerm.toLowerCase();
        
        return cours.filter(course => 
            // Recherche par titre, formateur ou description
            course.titre.toLowerCase().includes(lowerCaseSearch) ||
            (course.formateur && course.formateur.toLowerCase().includes(lowerCaseSearch)) ||
            (course.description && course.description.toLowerCase().includes(lowerCaseSearch))
        );
    }, [cours, searchTerm]);

    const handleCourseClick = (id_cours) => {
        console.log(`Navigation vers les détails du cours ${id_cours}`);
    };

    // --- Rendu des États ---
    if (loading) return <div className="text-center p-10 text-lg  text-indigo-600">Chargement du catalogue en cours...</div>;

    if (error && cours.length === 0) return (
        <div className="text-center p-10 bg-red-50 border border-red-300 rounded-lg max-w-2xl mx-auto mt-10 shadow-lg">
            <h3 className="font-bold text-xl text-red-700 flex items-center justify-center"><AlertCircle className="mr-2"/> Erreur de Connexion</h3>
            <p className="mt-2 text-gray-700">{error}</p>
        </div>
    );

    // --- Rendu Principal ---
    return (
        <div className="max-w-7xl mx-auto p-6 mt-10">
            <div className='flex justify-between items-start flex-col sm:flex-row mb-8'>
                <div className='mb-6 sm:mb-0'>
                    <h1 className="text-2xl font-semibold text-indigo-700 mb-2">
                        Catalogue des Formations Disponibles
                    </h1>
                </div>
                
                {/* Champ de Recherche Amélioré */}
                <div className="w-full sm:w-80 relative flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="search"
                        placeholder="Rechercher..."
                        className="outline-none w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 shadow-md text-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Message si la recherche ne donne rien */}
            {filteredCours.length === 0 && searchTerm && (
                <div className="text-center p-8 bg-yellow-50 border border-yellow-300 rounded-lg max-w-2xl mx-auto mt-10">
                    <p className="text-lg text-gray-700">Aucun cours ne correspond à la recherche **"{searchTerm}"**.</p>
                </div>
            )}
            
            {/* Grille des Cours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pt-4">
                {filteredCours.map((course) => (
                    <Link 
                        key={course.id_cours} 
                        to={`/cours/${course.id_cours}`} 
                        onClick={() => handleCourseClick(course.id_cours)}
                        className="group block bg-white rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:scale-[1.03] overflow-hidden border border-gray-100"
                        aria-label={`Voir les détails du cours : ${course.titre}`}
                    >
                        {/* Image du cours avec tag */}
                        <div className="h-40 w-full overflow-hidden relative">
                            {/* Tag de Catégorie (Retiré/Masqué car non disponible dans l'API) */}
                            {/* NOTE: Le champ `categorie` n'existe pas dans la table COURS selon votre schéma. */}
                            {/* {course.categorie && (
                                <span className="absolute top-2 left-2 px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full flex items-center shadow-md z-10">
                                    <Tag className="h-3 w-3 mr-1" /> {course.categorie}
                                </span>
                            )} */}
                            
                            {course.photo ? (
                                <img 
                                    src={`http://localhost/projet-plateforme/backend/api/formateur/${course.photo}`} 
                                    alt={`Photo du cours ${course.titre}`} 
                                    className="w-full h-full object-cover group-hover:opacity-80 transition duration-300"
                                />
                            ) : (
                                <div className="w-full h-full bg-indigo-100 flex flex-col items-center justify-center text-indigo-700 text-sm font-semibold p-4">
                                    <BookOpen className="h-6 w-6 mb-1"/>
                                    Image non disponible
                                </div>
                            )}
                        </div>

                        {/* Contenu de la carte */}
                        <div className="p-4 flex flex-col justify-between h-auto">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 leading-snug">
                                    {course.titre}
                                </h2>

                                {/* Description courte */}
                                <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                                    {course.description || "Aucune description rapide fournie."}
                                </p>

                                {/* Formateur avec Photo */}
                                <div className="flex items-center space-x-2 border-t pt-2 mt-2">
                                    {/* Utilise photo_formateur (alias de u.photo) */}
                                    {course.photo_formateur ? (
                                        <img 
                                            // Utilisation du chemin formateur pour l'image
                                            src={`http://localhost/projet-plateforme/backend/api/visiteur/${course.photo_formateur}`} 
                                            alt={`Photo de ${course.formateur}`} 
                                            className="w-8 h-8 rounded-full object-cover border-2 border-indigo-300"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border-2 border-indigo-300">
                                            <User className="w-4 h-4 text-gray-600" />
                                        </div>
                                    )}
                                    <p className="text-sm font-medium text-indigo-700">
                                        Par: {course.formateur}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Bouton CTA */}
                            <div className="mt-4">
                                <span className="inline-block w-full text-center p-3 text-sm font-semibold text-white bg-blue-600 rounded-full group-hover:bg-blue-700 transition duration-150">
                                    Voir les Détails →
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
            
            {/* Message si aucun cours n'est publié (sans recherche active) */}
            {cours.length === 0 && !searchTerm && (
                <div className="text-center p-10 text-gray-500 bg-gray-50 rounded-lg max-w-xl mx-auto mt-10 shadow-inner">
                    <p className="text-lg">Aucun cours n'a été publié par les formateurs pour le moment.</p>
                    <p className="text-sm mt-2">Revenez bientôt, de nouveaux cours sont ajoutés régulièrement !</p>
                </div>
            )}
        </div>
    );
};

export default ListeCoursPublics;