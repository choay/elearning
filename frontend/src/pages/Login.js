import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom'; // Ajout de Link et useLocation
import { useAuth } from '../context/AuthContext';
import { Loader2, LogIn as LogInIcon, AlertTriangle, Eye, EyeOff } from 'lucide-react'; // Ajout des icônes d'œil

function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // État pour la visibilité
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Récupère la page d'où vient l'utilisateur ou redirige vers l'accueil
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true }); // Redirection intelligente
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="bg-white p-10 sm:p-14 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100">
        <div className="flex flex-col items-center mb-10">
          <LogInIcon className="w-12 h-12 text-[#0074c7] mb-4" />
          <h1 className="text-4xl font-extrabold text-[#384050] tracking-tight text-center">
            CONNEXION
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              className="w-full p-4 pt-6 text-base border-2 border-indigo-100 rounded-xl focus:border-[#0074c7] focus:ring-0 outline-none peer transition-all"
              required disabled={loading} id="email"
            />
            <label htmlFor="email" className="absolute left-4 top-1 text-sm text-indigo-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-sm peer-focus:text-[#0074c7] pointer-events-none bg-white px-1">
              Email
            </label>
          </div>

          {/* Password Input avec Toggle */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              className="w-full p-4 pt-6 text-base border-2 border-indigo-100 rounded-xl focus:border-[#0074c7] focus:ring-0 outline-none peer transition-all"
              required disabled={loading} id="password"
            />
            <label htmlFor="password" className="absolute left-4 top-1 text-sm text-indigo-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-sm peer-focus:text-[#0074c7] pointer-events-none bg-white px-1">
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

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm animate-pulse">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#0074c7] text-white font-bold py-4 px-6 rounded-xl hover:bg-[#0062a6] active:scale-[0.98] disabled:opacity-70 transition-all shadow-lg shadow-blue-200"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Se connecter"}
          </button>
        </form>

        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-gray-500">
            <a href="#" className="hover:text-[#0074c7] underline transition-colors">Mot de passe oublié ?</a>
          </p>
          <p className="text-sm text-gray-600">
            Pas encore de compte ? <a href="#" className="text-[#0074c7] font-bold hover:underline">S'inscrire</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;