import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// L'importation de useAuth a été retirée car elle n'était pas utilisée pour la simple inscription
import { UserPlus, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'; 
// Assurez-vous d'avoir 'lucide-react' installé pour les icônes

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // 1. Validation côté client
    if (!email || !password || !confirmPassword) {
      setError('Tous les champs sont requis');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Mot de passe : 8 caractères min, 1 majuscule, 1 minuscule, 1 chiffre, 1 spécial (@$!%*?&)');
      setIsLoading(false);
      return;
    }

    try {
      // Retiré l'assignation de la variable '_' pour corriger le warning "no-unused-vars"
      await axios.post(
        `${API_URL}/api/auth/register`, 
        { email, password },
        { withCredentials: true }
      );

      setSuccess('Inscription réussie ! Un email de confirmation vous a été envoyé.');
      
      // Redirection après succès
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);

    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de l\'inscription. Réessayez.';
      setError(message);
      console.error('Erreur inscription:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // CONTENEUR GLOBAL: Utilise le même dégradé doux que Login pour la cohérence
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      
      {/* CARTE D'INSCRIPTION: Style uniforme avec la page Login */}
      <div className="bg-white p-10 sm:p-14 rounded-3xl shadow-2xl w-full max-w-md 
                    border border-gray-100 transform transition-all duration-300 hover:shadow-3xl">
        
        {/* TITRE ET ICÔNE */}
        <div className="flex flex-col items-center mb-10">
          <UserPlus className="w-12 h-12 text-indigo-600 mb-4" /> {/* Couleur de la charte */}
          <h1 className="text-4xl font-extrabold text-indigo-700 tracking-tight">
            CRÉER UN COMPTE
          </h1>
        </div>

        {/* FORMULAIRE */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* CHAMP EMAIL (avec style Floating Label) */}
          <div className="relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" " 
              className="w-full p-4 pt-6 text-base border-2 border-indigo-300 rounded-xl 
                         focus:border-purple-600 outline-none peer transition duration-200 
                         disabled:bg-gray-50 disabled:cursor-not-allowed"
              required
              disabled={isLoading}
            />
            <label 
              htmlFor="email" 
              className="absolute left-4 top-1 text-sm text-indigo-500 transition-all 
                         peer-placeholder-shown:top-4 peer-placeholder-shown:text-base 
                         peer-focus:top-1 peer-focus:text-sm peer-focus:text-purple-600 
                         pointer-events-none bg-white px-1">
              Adresse Email
            </label>
          </div>

          {/* CHAMP MOT DE PASSE (avec style Floating Label) */}
          <div className="relative">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              className="w-full p-4 pt-6 text-base border-2 border-indigo-300 rounded-xl 
                         focus:border-purple-600 outline-none peer transition duration-200 
                         disabled:bg-gray-50 disabled:cursor-not-allowed"
              required
              disabled={isLoading}
            />
            <label 
              htmlFor="password" 
              className="absolute left-4 top-1 text-sm text-indigo-500 transition-all 
                         peer-placeholder-shown:top-4 peer-placeholder-shown:text-base 
                         peer-focus:top-1 peer-focus:text-sm peer-focus:text-purple-600 
                         pointer-events-none bg-white px-1">
              Mot de passe
              <span className="ml-2 text-xs text-gray-400">(8+ car., Maj, Min, Chiffre, Spécial)</span>
            </label>
          </div>

          {/* CHAMP CONFIRMER MOT DE PASSE (avec style Floating Label) */}
          <div className="relative">
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder=" "
              className="w-full p-4 pt-6 text-base border-2 border-indigo-300 rounded-xl 
                         focus:border-purple-600 outline-none peer transition duration-200 
                         disabled:bg-gray-50 disabled:cursor-not-allowed"
              required
              disabled={isLoading}
            />
            <label 
              htmlFor="confirmPassword" 
              className="absolute left-4 top-1 text-sm text-indigo-500 transition-all 
                         peer-placeholder-shown:top-4 peer-placeholder-shown:text-base 
                         peer-focus:top-1 peer-focus:text-sm peer-focus:text-purple-600 
                         pointer-events-none bg-white px-1">
              Confirmer le mot de passe
            </label>
          </div>

          {/* BOUTON D'INSCRIPTION (Conservant la couleur verte distinctive) */}
          <button
            type="submit"
            disabled={isLoading}
            // Utilise les couleurs de votre charte (#82b864) avec un style cohérent
            className={`w-full mt-8 py-4 flex items-center justify-center 
                       bg-[#82b864] hover:bg-[#6aa44b] text-white text-lg 
                       font-semibold rounded-xl shadow-md shadow-green-300 hover:shadow-lg 
                       transition-all duration-300 disabled:opacity-50 disabled:shadow-none`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                INSCRIPTION EN COURS...
              </span>
            ) : (
              "S'INSCRIRE GRATUITEMENT"
            )}
          </button>
        </form>

        {/* MESSAGES D'ERREUR/SUCCÈS (Uniformisés avec le style Login) */}
        {error && (
          <div className="mt-6 p-4 flex items-center bg-red-50 border-l-4 border-red-500 rounded-md text-red-700 font-medium">
            <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 flex items-center bg-green-50 border-l-4 border-green-500 rounded-md text-green-700 font-medium">
            <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* LIEN VERS CONNEXION */}
        <p className="mt-8 text-center text-sm text-gray-500">
          Déjà un compte ?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-indigo-600 hover:text-purple-600 font-medium disabled:opacity-50"
            disabled={isLoading}
          >
            Connectez-vous ici
          </button>
        </p>

      </div>
    </div>
  );
}

export default Signup;