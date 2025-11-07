import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

// Import des icônes Lucide React
import {
    BookOpen,
    Zap,
    CheckCircle,
    XOctagon,
    Loader2,
    AlertTriangle,
    Bell,
    List,
    Key,
    Unlock,
    FileText,
    Video, // NOUVELLE ICÔNE POUR LES VIDÉOS
    Book,
    Globe,
    ArrowLeft
} from 'lucide-react';

const API_URL_BASE = 'http://localhost/projet-plateforme/backend/api/formateur/';

// Fonction utilitaire pour déterminer l'icône et la couleur en fonction du type de contenu
const getLeconDetails = (contenu) => {
    if (!contenu || typeof contenu !== 'string') {
        return { Icon: FileText, color: 'text-purple-600' };
    }

    // Récupérer l'extension du fichier
    const extension = contenu.toLowerCase().split('.').pop().split('?')[0];

    // Détection Vidéo (extensions courantes)
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'ogg', 'mkv'].includes(extension)) {
        return { Icon: Video, color: 'text-blue-600' }; // Icône Vidéo en bleu
    }

    // Détection PDF
    if (extension === 'pdf') {
        return { Icon: FileText, color: 'text-blue-600' }; // Icône Document/PDF en bleu
    }

    // Par défaut (autres documents ou types non reconnus)
    return { Icon: FileText, color: 'text-purple-600' }; // Icône Document par défaut
};

const ConsulterCours = () => {

    // 1. Récupération de l'ID du cours depuis localStorage
    const id_cours_local = localStorage.getItem('cours_id_courant');

    // 2. États pour la gestion des données et du chargement
    const [cours, setCours] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // NOUVEL ÉTAT: Pour l'aperçu du contenu d'une leçon
    const [selectedLeconForPreview, setSelectedLeconForPreview] = useState(null);

    const API_URL_PUBLICATION = `${API_URL_BASE}modifierStatutPublication.php`;

    useEffect(() => {
        if (!id_cours_local) {
            setError("ID du cours non trouvé. Veuillez sélectionner un cours.");
            setLoading(false);
            return;
        }
        fetchContenuCours(id_cours_local);
    }, [id_cours_local]);

    // Fonction pour récupérer le contenu du cours
    const fetchContenuCours = async (id_cours_to_fetch) => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        // IMPORTANT: Réinitialiser l'aperçu lors du chargement d'un nouveau cours
        setSelectedLeconForPreview(null);

        try {
            const API_URL_CONTENU = `${API_URL_BASE}consulterCours.php?id_cours=${id_cours_to_fetch}`;
            const response = await axios.get(API_URL_CONTENU);

            setCours(response.data.cours);

        } catch (err) {
            console.error("Erreur de chargement du cours:", err.response || err);
            setError(err.response?.data?.message || `Échec du chargement du cours.`);
            setCours(null);
        } finally {
            setLoading(false);
        }
    };

    // Fonction de bascule de publication
    const handlePublicationToggle = async () => {
        if (!cours) return;

        const nouvel_etat = cours.est_publie == 1 ? 0 : 1;
        const action = nouvel_etat === 1 ? 'Publication' : 'Annulation de publication';

        setIsUpdating(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await axios.post(API_URL_PUBLICATION, {
                id_cours: cours.id_cours,
                nouvel_etat: nouvel_etat
            });

            setCours(prevCours => ({
                ...prevCours,
                est_publie: response.data.est_publie
            }));

            setSuccessMessage(response.data.message);

        } catch (err) {
            console.error(`Erreur lors de la ${action.toLowerCase()}:`, err.response || err);
            setError(err.response?.data?.message || `Échec de la ${action.toLowerCase()}.`);
        } finally {
            setIsUpdating(false);
        }
    };

    // NOUVELLE FONCTION: Gérer l'affichage de l'aperçu
    const handlePreviewClick = (lecon) => {
        // Définir la leçon sélectionnée pour afficher l'aperçu
        setSelectedLeconForPreview(lecon);
        // AJOUT: Faire défiler vers le haut de la page pour voir l'aperçu immédiatement
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 3. Gestion de l'affichage (Loading, Erreur)
    if (loading) return <div className="text-center p-10 flex items-center justify-center text-indigo-600"><Loader2 className="animate-spin mr-2" /> Chargement du contenu du cours...</div>;
    if (error) return <div className="text-center p-10 text-red-600 flex items-center justify-center"><AlertTriangle className="mr-2" /> Erreur : {error}</div>;
    if (!cours) return <div className="text-center p-10 text-gray-600 flex items-center justify-center"><BookOpen className="mr-2" /> Aucun cours trouvé ou chargé.</div>;

    const isPublie = cours.est_publie == 1;
    // La base URL doit pointer vers le répertoire où se trouvent les fichiers, 
    // en supposant que le chemin dans `lecon.contenu` est relatif à cette base.
    const FILES_BASE_URL = 'http://localhost/projet-plateforme/backend/api/formateur/';

    // 4. Rendu du contenu du cours
    return (
        <div className="max-w-6xl mx-auto p-6 mt-10">
            <Link to="/liste-cours" className="text-indigo-600 hover:text-indigo-800 font-medium transition duration-150 flex items-center mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la liste des cours
            </Link>

            {/* Notifications */}
            {successMessage && (
                <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg flex items-center" role="alert">
                    <CheckCircle className="w-5 h-5 mr-3" />
                    {successMessage}
                </div>
            )}
            {error && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg flex items-center" role="alert">
                    <XOctagon className="w-5 h-5 mr-3" />
                    {error}
                </div>
            )}

            {/* NOUVEL EMPLACEMENT: SECTION APERÇU */}
            {selectedLeconForPreview && (
                <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-xl">
                    <div className="flex justify-between items-start mb-4 border-b pb-2">
                        <h2 className="text-2xl font-bold text-indigo-700 flex items-center">
                            <BookOpen className="w-6 h-6 mr-3" />
                            {selectedLeconForPreview.titre_lecon}
                        </h2>
                        <button
                            onClick={() => setSelectedLeconForPreview(null)}
                            className="text-red-500 hover:text-red-700 font-semibold p-2 transition duration-150 rounded-full hover:bg-red-50"
                            title="Fermer l'aperçu"
                        >
                            <XOctagon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* L'utilisation d'un iframe permet d'intégrer des documents (PDF, images, vidéos, etc.) */}
                    <div className="w-full" style={{ height: '70vh' }}>
                        <iframe
                            // L'URL est construite en combinant l'URL de base et le chemin relatif du contenu de la leçon
                            src={`${FILES_BASE_URL}${selectedLeconForPreview.contenu}`}
                            title={`Aperçu de ${selectedLeconForPreview.titre_lecon}`}
                            allowFullScreen
                            className="w-full h-full border border-gray-300 rounded-lg"
                        />
                    </div>

                    {/* Le chemin du fichier sur le serveur est retiré pour des raisons de sécurité */}
                </div>
            )}
            {/* FIN SECTION APERÇU */}


            {/* Détails du Cours */}
            <header className="mb-8 p-6 bg-white shadow-xl rounded-lg border-t-4 border-indigo-600">
                <div className="flex flex-col sm:flex-row justify-between  items-start">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center">
                            <BookOpen className="w-8 h-8 mr-3 text-indigo-600" />
                            {cours.titre}
                        </h1>
                        <p className="text-lg text-gray-600 mb-4 ml-11">
                            Formateur: <span className="font-semibold">{cours.nom_formateur}</span>
                        </p>
                    </div>

                    {/* Bouton Publier / Annuler la publication */}
                    <button
                        onClick={handlePublicationToggle}
                        disabled={isUpdating}
                        className={`px-6 py-3 text-white font-bold rounded-full transition duration-300 shadow-lg flex items-center ${isPublie
                            ? 'bg-gray-500 hover:bg-gray-600'
                            : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                    >
                        {isUpdating
                            ? <Loader2 className="animate-spin w-5 h-5 mr-2" />
                            : isPublie ? <XOctagon className="w-5 h-5 mr-2" /> : <Globe className="w-5 h-5 mr-2" />}
                        {isUpdating
                            ? 'Mise à jour...'
                            : isPublie ? 'Annuler la publication' : 'Publier le cours'}
                    </button>
                </div>

                <p className="text-gray-700 italic mt-4 border-l-4 border-gray-200 pl-4">
                    {cours.description}
                </p>
                <div className="mt-4">
                    <span className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full shadow-md ${isPublie
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {isPublie ? <CheckCircle className="w-4 h-4 mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
                        {isPublie ? "Publié (Visible aux étudiants)" : "En brouillon (Non publié)"}
                    </span>
                </div>
            </header>

            {/* Section Contenu (Leçons et Quiz) */}
            <div className="space-y-12">

                {/* 4.1. AFFICHAGE DES LEÇONS */}
                <section>
                    <h2 className="text-3xl font-bold text-indigo-700 mb-6 border-b pb-3 flex items-center">
                        <List className="w-7 h-7 mr-3" />
                        Leçons ({cours.lecons.length})
                    </h2>

                    {cours.lecons.length === 0 ? (
                        <p className="text-gray-500 p-4 bg-white rounded-lg shadow-sm flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" /> Aucune leçon n'a été ajoutée à ce cours.</p>
                    ) : (
                        <ol className="space-y-4">
                            {cours.lecons.map((lecon, index) => {
                                // Récupération dynamique de l'icône et de la couleur
                                const { Icon, color } = getLeconDetails(lecon.contenu);

                                return (
                                    <li
                                        key={lecon.id_lecon}
                                        className={`p-4 bg-white rounded-lg shadow border-l-4 transition duration-150 hover:shadow-lg 
                                            ${selectedLeconForPreview?.id_lecon === lecon.id_lecon ? 'border-indigo-700 **bg-sky-50**' : 'border-blue-500'}`}
                                    >
                                        <h3 className="text-xl font-semibold text-gray-800 mb-1 flex items-center">
                                            {/* UTILISATION DYNAMIQUE DE L'ICÔNE ET DE LA COULEUR */}
                                            <Icon className={`w-5 h-5 mr-2 ${color}`} />
                                            {index + 1}. {lecon.titre_lecon}
                                        </h3>

                                        {/* Modification: Retrait de l'affichage du chemin du fichier pour des raisons de sécurité */}
                                        <div className="text-sm text-gray-600 italic ml-7 flex items-center justify-end">
                                            <button
                                                onClick={() => handlePreviewClick(lecon)}
                                                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition duration-150 flex items-center font-semibold"
                                                title="Afficher l'aperçu du fichier dans la page"
                                            >
                                                <BookOpen className="w-4 h-4 mr-1" /> Aperçu
                                            </button>
                                        </div>

                                        <p className="text-xs text-gray-400 mt-2 ml-7">
                                            Créé le: {new Date(lecon.date_creation).toLocaleDateString()} (Ordre: {lecon.ordre})
                                        </p>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </section>


                {/* --- */}

                {/* 4.2. AFFICHAGE DES QUIZ */}
                <section>
                    <h2 className="text-3xl font-bold text-indigo-700 mb-6 border-b pb-3 flex items-center">
                        <Zap className="w-7 h-7 mr-3" />
                        Quiz / Évaluations
                    </h2>

                    {cours.quiz.length === 0 ? (
                        <p className="text-gray-500 p-4 bg-white rounded-lg shadow-sm flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" /> Aucun quiz n'a été ajouté à ce cours.</p>
                    ) : (
                        <div className="space-y-8">
                            {cours.quiz.map((quiz, quizIndex) => (
                                <div key={quiz.id_quiz} className="p-5 bg-white rounded-lg shadow-lg border-t-4 border-blue-500 transition duration-150 hover:shadow-xl">
                                    <h3 className="text-2xl font-bold text-blue-700 mb-4 flex items-center">
                                        <Book className="w-6 h-6 mr-3" />
                                        Quiz {quizIndex + 1}: {quiz.titre_quiz} (Ordre: {quiz.ordre})
                                    </h3>

                                    {/* Questions du Quiz */}
                                    <div className="space-y-6 ml-4 mt-4">
                                        {quiz.questions.length === 0 ? (
                                            <p className="text-gray-500 italic border-l-2 border-gray-300 pl-4 py-2">Ce quiz n'a pas encore de questions.</p>
                                        ) : (
                                            quiz.questions.map((question, qIndex) => (
                                                <div key={question.id_question} className="border-l-2 border-gray-300 pl-4 py-2">
                                                    <p className="font-medium text-gray-800 mb-2 flex items-center">
                                                        <Key className="w-4 h-4 mr-2 text-gray-500" />
                                                        {qIndex + 1}. {question.texte_question}
                                                    </p>

                                                    {/* Propositions de la Question */}
                                                    <ul className="space-y-1 text-sm ml-6">
                                                        {question.propositions.map((prop) => (
                                                            <li
                                                                key={prop.id_proposition}
                                                                className={`p-2 rounded-md flex items-center ${prop.est_correct === 1
                                                                    ? 'bg-green-100 text-green-800 border border-green-300 font-semibold'
                                                                    : 'bg-red-50 text-gray-700'
                                                                    }`}
                                                            >
                                                                {prop.est_correct === 1
                                                                    ? <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                                                    : <XOctagon className="w-4 h-4 mr-2 text-red-600" />}
                                                                {prop.texte_proposition}
                                                                {prop.est_correct === 1 && <span className="text-xs ml-2 text-green-700">(Réponse Correcte)</span>}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ConsulterCours;