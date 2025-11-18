// src/components/Signup.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Signup() {
  const [name, setName] = useState('');
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

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Tous les champs sont requis.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setIsLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Mot de passe : 8+ caractères, Majuscule, Minuscule, Chiffre, Spécial (@$!%*?&)');
      setIsLoading(false);
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/auth/register`,
        { name, email, password },
        { withCredentials: true }
      );

      setSuccess('Inscription réussie ! Redirection vers la connexion...');
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de l\'inscription.';
      setError(message);
      console.error('Erreur inscription:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="bg-white p-10 sm:p-14 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 transform transition-all duration-300 hover:shadow-3xl">
        <div className="flex flex-col items-center mb-10">
          <UserPlus className="w-12 h-12 text-indigo-600 mb-4" />
          <h1 className="text-4xl font-extrabold text-indigo-700 tracking-tight">
            CRÉER UN COMPTE
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom */}
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=" "
              className="w-full p-4 pt-6 text-base border-2 border-indigo-300 rounded-xl focus:border-purple-600 outline-none peer"
              required
              disabled={isLoading}
            />
            <label className="absolute left-4 top-1 text-sm text-indigo-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-sm peer-focus:text-purple-600 pointer-events-none bg-white px-1">
              Nom
            </label>
          </div>

          {/* Email */}
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              className="w-full p-4 pt-6 text-base border-2 border-indigo-300 rounded-xl focus:border-purple-600 outline-none peer"
              required
              disabled={isLoading}
            />
            <label className="absolute left-4 top-1 text-sm text-indigo-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-sm peer-focus:text-purple-600 pointer-events-none bg-white px-1">
              Adresse Email
            </label>
          </div>

          {/* Mot de passe */}
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              className="w-full p-4 pt-6 text-base border-2 border-indigo-300 rounded-xl focus:border-purple-600 outline-none peer"
              required
              disabled={isLoading}
            />
            <label className="absolute left-4 top-1 text-sm text-indigo-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-sm peer-focus:text-purple-600 pointer-events-none bg-white px-1">
              Mot de passe
              <span className="ml-2 text-xs text-gray-400">(8+ car., Maj, Min, Chiffre, Spécial)</span>
            </label>
          </div>

          {/* Confirmer */}
          <div className="relative">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder=" "
              className="w-full p-4 pt-6 text-base border-2 border-indigo-300 rounded-xl focus:border-purple-600 outline-none peer"
              required
              disabled={isLoading}
            />
            <label className="absolute left-4 top-1 text-sm text-indigo-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-sm peer-focus:text-purple-600 pointer-events-none bg-white px-1">
              Confirmer le mot de passe
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full mt-8 py-4 flex items-center justify-center bg-[#82b864] hover:bg-[#6aa44b] text-white text-lg font-semibold rounded-xl shadow-md shadow-green-300 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:shadow-none`}
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