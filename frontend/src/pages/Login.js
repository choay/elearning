import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie'; // Gestion des cookies
import { useAuth } from '../context/AuthContext';

function Login() {
  const { setUserFromToken, setPurchasedCourses, setCompletedLessons } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get('authToken');
    if (token) {
      setUserFromToken(token);
      navigate('/');
    }
  }, [navigate, setUserFromToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Tous les champs sont requis');
      return;
    }

    try {
      console.log('Tentative de connexion avec :', email, password);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      console.log('Réponse de l\'API :', response);
      setSuccess('Connexion réussie ! Redirection...');

      const { token, userId, courses, completedLessons } = response.data;

      Cookies.set('authToken', token, { expires: 7, secure: true, sameSite: 'Strict' });
      Cookies.set('userId', userId, { expires: 7, secure: true, sameSite: 'Strict' });

      setUserFromToken(token);
      setPurchasedCourses(courses); // Stocker les cours dans le contexte
      setCompletedLessons(completedLessons); // Stocker les leçons complétées

      console.log('Utilisateur mis à jour avec le token.');

      setTimeout(() => {
        navigate('/');
      }, 2000);

      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      if (error.response) {
        if (error.response.status === 401) {
          setError('Email ou mot de passe incorrect');
        } else if (error.response.status === 403) {
          setError('Votre compte n\'est pas activé.');
        } else {
          setError('Erreur lors de la connexion. Veuillez réessayer.');
        }
      } else {
        setError('Erreur réseau. Veuillez vérifier votre connexion.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f8fc]">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-[#384050] mb-6 text-center">Se connecter</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[#384050] text-sm font-bold mb-2" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 border rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0074c7]"
              placeholder="Entrez votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-[#384050] text-sm font-bold mb-2" htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              className="w-full px-3 py-2 border rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0074c7]"
              placeholder="Entrez votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full py-2 px-4 bg-[#0074c7] text-white font-bold rounded-full hover:bg-[#005a9c]">
            Se connecter
          </button>
          {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
          {success && <p className="mt-4 text-green-500 text-center">{success}</p>}
        </form>
      </div>
    </div>
  );
}

export default Login;
