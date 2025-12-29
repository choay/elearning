import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, LogIn as LogInIcon, AlertTriangle, Eye, EyeOff } from 'lucide-react';

function Login() {
  const { login, user, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Redirection automatique si l'utilisateur est déjà connecté
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // Redirige vers la page demandée initialement ou vers l'accueil
      const origin = location.state?.from?.pathname || '/';
      navigate(origin);
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#0074c7]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100">
        
        {/* En-tête */}
        <div className="flex flex-col items-center mb-10">
          <div className="bg-indigo-50 p-4 rounded-full mb-4">
            <LogInIcon className="w-10 h-10 text-[#0074c7]" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#384050] tracking-tight">
            CONNEXION
          </h1>
          <p className="text-gray-500 mt-2 text-center">Heureux de vous revoir !</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Champ Email */}
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              className="w-full p-4 pt-6 text-base border-2 border-indigo-100 rounded-xl focus:border-[#0074c7] outline-none peer transition-all bg-gray-50 focus:bg-white"
              required 
              disabled={loading} 
              id="email"
            />
            <label 
              htmlFor="email" 
              className="absolute left-4 top-1 text-sm text-indigo-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-sm peer-focus:text-[#0074c7] pointer-events-none px-1"
            >
              Email
            </label>
          </div>

          {/* Champ Mot de passe */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              className="w-full p-4 pt-6 text-base border-2 border-indigo-100 rounded-xl focus:border-[#0074c7] outline-none peer transition-all bg-gray-50 focus:bg-white"
              required 
              disabled={loading} 
              id="password"
            />
            <label 
              htmlFor="password" 
              className="absolute left-4 top-1 text-sm text-indigo-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-sm peer-focus:text-[#0074c7] pointer-events-none px-1"
            >
              Mot de passe
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-5 text-gray-400 hover:text-[#0074c7]"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm animate-in fade-in duration-300">
              <AlertTriangle className="w-4 h-4 shrink-0" /> 
              <span>{error}</span>
            </div>
          )}

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#0074c7] text-white font-bold py-4 px-6 rounded-xl hover:bg-[#0062a6] active:scale-[0.98] disabled:opacity-70 transition-all shadow-lg shadow-blue-100"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogInIcon className="w-5 h-5" />}
            <span>Se connecter</span>
          </button>
        </form>

        {/* Liens de navigation */}
        <div className="mt-10 space-y-4 text-center">
          <Link 
            to="/forgot-password" 
            className="text-sm text-gray-500 hover:text-[#0074c7] transition-colors block"
          >
            Mot de passe oublié ?
          </Link>
          
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <Link 
                to="/signup" 
                className="text-[#0074c7] font-bold hover:underline ml-1"
              >
                S'inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;