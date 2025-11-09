import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, LogIn as LogInIcon, AlertTriangle } from 'lucide-react'; 

function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // CONTENEUR GLOBAL: Fond dégradé doux et centré (couleurs cohérentes)
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      
      {/* CARTE DE CONNEXION: Nouveau style, plus structuré */}
      <div className="bg-white p-10 sm:p-14 rounded-3xl shadow-2xl w-full max-w-md 
                    border border-gray-100 transform transition-all duration-300 hover:shadow-3xl">
        
        {/* TITRE ET ICÔNE (couleur bleu charte) */}
        <div className="flex flex-col items-center mb-10">
          <LogInIcon className="w-12 h-12 text-[#0074c7] mb-4" /> {/* Changé: text-indigo-600 -> text-[#0074c7] */}
          <h1 className="text-4xl font-extrabold text-[#384050] tracking-tight">
            CONNEXION SÉCURISÉE
          </h1>
        </div>

        {/* FORMULAIRE */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* CHAMP EMAIL (Focus bleu charte) */}
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" " 
              className="w-full p-4 pt-6 text-base border-2 border-indigo-300 rounded-xl 
                         focus:border-[#0074c7] outline-none peer transition duration-200 
                         disabled:bg-gray-50 disabled:cursor-not-allowed"
              required
              disabled={loading}
              id="email"
            />
            <label 
              htmlFor="email" 
              className="absolute left-4 top-1 text-sm text-indigo-500 transition-all 
                         peer-placeholder-shown:top-4 peer-placeholder-shown:text-base 
                         peer-focus:top-1 peer-focus:text-sm peer-focus:text-[#0074c7] 
                         pointer-events-none bg-white px-1">
              Adresse Email
            </label>
          </div>

          {/* CHAMP MOT DE PASSE (Focus bleu charte) */}
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              className="w-full p-4 pt-6 text-base border-2 border-indigo-300 rounded-xl 
                         focus:border-[#0074c7] outline-none peer transition duration-200 
                         disabled:bg-gray-50 disabled:cursor-not-allowed"
              required
              disabled={loading}
              id="password"
            />
            <label 
              htmlFor="password" 
              className="absolute left-4 top-1 text-sm text-indigo-500 transition-all 
                         peer-placeholder-shown:top-4 peer-placeholder-shown:text-base 
                         peer-focus:top-1 peer-focus:text-sm peer-focus:text-[#0074c7] 
                         pointer-events-none bg-white px-1">
              Mot de passe
            </label>
          </div>

          {/* BOUTON DE CONNEXION (Couleur verte charte) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 py-4 flex items-center justify-center 
                       bg-[#82b864] text-white text-lg 
                       font-semibold rounded-xl hover:bg-[#6aa44b] 
                       shadow-md shadow-green-300 hover:shadow-lg transition-all 
                       duration-300 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                CONNEXION...
              </span>
            ) : (
              'SE CONNECTER'
            )}
          </button>
        </form>
        
        {/* MESSAGE D'ERREUR */}
        {error && (
          <div className="mt-6 p-4 flex items-center bg-red-50 border-l-4 border-red-500 rounded-md text-red-700 font-medium">
            <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
            {error}
          </div>
        )}
        
        {/* LIEN VERS INSCRIPTION (Couleur bleu charte) */}
        <p className="mt-8 text-center text-sm text-gray-500">
          Pas encore de compte ? 
          <button onClick={() => navigate('/signup')} 
                  className="text-[#0074c7] hover:text-[#0074c7]/80 font-medium ml-1">
            Inscrivez-vous ici
          </button>
        </p>

      </div>
    </div>
  );
}

export default Login;