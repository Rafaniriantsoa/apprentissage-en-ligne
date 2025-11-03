import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
// Import des icônes Lucide-React
import { Eye, EyeOff, User, Mail, Lock, Camera, Upload, ChevronDown, Loader2, UserPlus} from 'lucide-react';


const InputWithIcon = ({ Icon, ...props }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Icon className="h-5 w-5 text-gray-400" />
    </div>
    <input
      {...props}
      className="mt-1 block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base placeholder-gray-400"
    />
  </div>
);

// Composant pour le champ de mot de passe spécifique
const PasswordInput = ({ value, onChange, showPassword, setShowPassword }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Lock className="h-5 w-5 text-gray-400" />
    </div>
    <input
      type={showPassword ? "text" : "password"}
      id="motDePasse"
      name="motDePasse"
      value={value}
      onChange={onChange}
      placeholder="••••••••"
      className="mt-1 block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base placeholder-gray-400"
    />
    <button
      type="button"
      // Utilise la fonction de bascule passée par les props
      onClick={() => setShowPassword(prev => !prev)}
      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-600 transition-colors"
      aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
    >
      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </button>
  </div>
);


const Inscrire = () => {
  // URL de votre script PHP d'inscription
  const API_URL = 'http://localhost/projet-plateforme/backend/api/visiteur/inscrireUtilisateur.php';

  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  // État pour basculer la visibilité du mot de passe
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    nomComplet: '',
    email: '',
    motDePasse: '',
    photo: null, // Le fichier File
    specialite: '',
    role: 'etudiant',
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Utilisez useCallback pour garantir la stabilité des fonctions passées aux enfants
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prevData => {
      let newData = {
        ...prevData,
        [name]: value,
      };
      if (name === 'role' && value === 'etudiant') {
        newData.specialite = '';
      }
      return newData;
    });
  }, []);

  // Gère le changement de fichier (Photo) et crée l'aperçu
  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    setFormData(prevData => ({
      ...prevData,
      photo: file,
    }));

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  }, []);

  // Fonction pour déclencher le clic sur l'input file caché
  const handleFileUploadClick = () => {
    fileInputRef.current.click();
  };

  // La fonction handleSubmit (inchangée dans sa logique)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrors({});
    setLoading(true);

    if (!formData.nomComplet || !formData.email || !formData.motDePasse) {
      setErrors({ general: "Veuillez remplir tous les champs obligatoires." });
      setLoading(false);
      return;
    }

    const dataToSend = new FormData();
    dataToSend.append('nomComplet', formData.nomComplet);
    dataToSend.append('email', formData.email);
    dataToSend.append('motDePasse', formData.motDePasse);
    dataToSend.append('role', formData.role);

    if (formData.role === 'formateur' && formData.specialite) {
      dataToSend.append('specialite', formData.specialite);
    }

    if (formData.photo) {
      dataToSend.append('photo', formData.photo);
    }

    try {
      const response = await axios.post(API_URL, dataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const userData = response.data.utilisateur;
      setUser(userData);

      if (userData) {
        localStorage.setItem('utilisateur', JSON.stringify(userData));
        setMessage(response.data.message || "Inscription réussie ! Redirection...");

        setTimeout(() => {
          navigate('/');
          window.location.reload();
        }, 300);
      }

      setFormData({
        nomComplet: '', email: '', motDePasse: '', photo: null, specialite: '', role: 'etudiant',
      });
      setPhotoPreview(null);

    } catch (error) {
      console.error("Erreur d'inscription:", error.response || error);
      let errorMessage = "Une erreur inconnue est survenue.";

      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.request) {
        errorMessage = "Impossible de contacter le serveur API. Vérifiez la connexion.";
      }

      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-lg bg-white p-10 rounded-2xl shadow-2xl border border-gray-100 transition-all duration-300 hover:shadow-3xl">

        <h2 className="text-2xl font-bold text-indigo-700 mb-2 text-center tracking-tight">
          Créer un Compte
        </h2>
        <p className="text-center text-sm text-gray-500 mb-8">
          Remplissez les champs pour commencer votre parcours.
        </p>

        {/* Affichage des messages et erreurs */}
        {message && (
          <div className="p-4 mb-4 text-base font-semibold text-green-800 bg-green-100 border border-green-300 rounded-lg animate-fadeIn">
            {message}
          </div>
        )}
        {errors.general && (
          <div className="p-4 mb-4 text-base font-semibold text-red-800 bg-red-100 border border-red-300 rounded-lg animate-fadeIn">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Nom Complet */}
          <div className="group">
            <label htmlFor="nomComplet" className="block text-sm font-medium text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500">Nom Complet</label>
            <InputWithIcon
              Icon={User}
              type="text"
              id="nomComplet"
              name="nomComplet"
              value={formData.nomComplet}
              onChange={handleChange}
              placeholder="Entrer votre nom complet "
            />
          </div>

          {/* Email */}
          <div className="group">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500">Adresse Email</label>
            <InputWithIcon
              Icon={Mail}
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Entrer votre email"
            />
          </div>

          {/* Mot de Passe (avec visibilité) */}
          <div className="group">
            <label htmlFor="motDePasse" className="block text-sm font-medium text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500">Mot de Passe</label>
            <PasswordInput
              value={formData.motDePasse}
              onChange={handleChange}
              showPassword={showPassword} // Passe l'état actuel
              setShowPassword={setShowPassword} // Passe la fonction de mise à jour
            />
          </div>

          {/* Photo (Bouton personnalisé et Aperçu) */}
          <div className="flex items-center space-x-4">
            {/* Aperçu de la photo */}
            <div className="flex-shrink-0">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Aperçu de la photo de profil"
                  className="h-16 w-16 object-cover rounded-full border-2 border-indigo-500 shadow-lg"
                />
              ) : (
                <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500 border border-indigo-300">
                  <Camera className="h-6 w-6" />
                </div>
              )}
            </div>

            {/* Bouton de téléchargement et input caché */}
            <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo de Profil (Optionnel)</label>

              {/* Bouton personnalisé */}
              <button
                type="button"
                onClick={handleFileUploadClick}
                className="w-full flex items-center justify-center py-2 px-4 border border-indigo-600 rounded-xl text-xs font-semibold text-indigo-600 bg-white hover:bg-indigo-50 transition-colors shadow-sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Sélectionner un fichier...
              </button>

              {/* Input de type file caché */}
              <input
                type="file"
                id="photo"
                name="photo"
                accept="image/*"
                ref={fileInputRef} // Lien vers le useRef
                onChange={handleFileChange}
                className="hidden" // Cache l'input par défaut
              />
            </div>
          </div>

          {/* Rôle */}
          <div className="group">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Je suis...</label>
            <div className="relative">
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="appearance-none mt-1 block w-full px-4 py-2 border border-gray-300 bg-white rounded-xl shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-base cursor-pointer"
              >
                <option value="etudiant">Étudiant</option>
                <option value="formateur">Formateur</option>
              </select>
              {/* Icône personnalisée pour le select */}
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Spécialité (Affichage Conditionnel) */}
          {formData.role === 'formateur' && (
            <div className="group">
              <label htmlFor="specialite" className="block text-sm font-medium text-gray-700">Spécialité (Domaine d'expertise)</label>
              <InputWithIcon
                Icon={User}
                type="text"
                id="specialite"
                name="specialite"
                value={formData.specialite}
                onChange={handleChange}
                placeholder="Ex: Développement Web, Marketing Digital..."
              />
            </div>
          )}

          {/* Bouton de Soumission */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300 ease-in-out transform hover:scale-[1.01] disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Inscription en cours...
              </div>
            ) : (
              <span className='flex gap-2 items-center'>
                <UserPlus className='w-5 h-5'/>
                S'inscrire
              </span>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Déjà un compte ? <Link to="/connexion" className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors duration-200">Connectez-vous ici</Link>
        </p>
      </div>
    </div>
  );
};

export default Inscrire;