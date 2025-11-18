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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="bg-white p-10 sm:p-14 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 transform transition-all duration-300 hover:shadow-3xl">
        <div className="flex flex-col items-center mb-10">
          <LogInIcon className="w-12 h-12 text-[#0074c7] mb-4" />
          <h1 className="text-4xl font-extrabold text-[#384050] tracking-tight">CONNEXION SÉCURISÉE</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              className="w-full p-4 pt-6 text-base border-2 border-indigo-300 rounded-xl focus:border-[#0074c7] outline-none peer"
              required disabled={loading} id="email"
            />
            <label htmlFor="email" className="absolute left-4 top-1 text-sm text-indigo-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-sm peer-focus:text-[#0074c7] pointer-events-none bg-white px-1">Email</label>
          </div>

          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              className="w-full p-4 pt-6 text-base border-2 border-indigo-300 rounded-xl focus:border-[#0074c7] outline-none peer"
              required disabled={loading} id="password"
            />
            <label htmlFor="password" className="absolute left-4 top-1 text-sm text-indigo-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-sm peer-focus:text-[#0074c7] pointer-events-none bg-white px-1">Mot de passe</label>
          </div>

          {error && (
            <div className="flex items-center text-red-600 text-sm mt-2">
              <AlertTriangle className="w-4 h-4 mr-1" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#0074c7] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#0062a6] disabled:opacity-70 transition duration-200"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Connexion
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
