import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérifiez si les mots de passe correspondent
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    // Vérifiez si les champs requis sont remplis
    if (!email || !password) {
      setError("Tous les champs sont requis");
      return;
    }

    // Vérification de la complexité du mot de passe
    const passwordValidation = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordValidation.test(password)) {
      setError(
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial"
      );
      return;
    }

    try {
      // Envoyez les données au serveur
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setError(responseData.message || "Erreur lors de l'inscription");
        return;
      }

      // Affiche un message de succès et redirige vers la page de connexion
      setSuccess("Mail d'activation envoyé. Veuillez vérifier votre boîte mail.");
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      setError("Erreur lors de l'inscription");
      console.error("Erreur lors de l'inscription:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f8fc]">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-[#384050] mb-6 text-center">S'enregistrer</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[#384050] text-sm font-bold mb-2" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 border rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0074c7] focus:border-transparent"
              placeholder="Entrez votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#384050] text-sm font-bold mb-2" htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              className="w-full px-3 py-2 border rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0074c7] focus:border-transparent"
              placeholder="Entrez votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-[#384050] text-sm font-bold mb-2" htmlFor="confirmPassword">Confirmez le mot de passe</label>
            <input
              type="password"
              id="confirmPassword"
              className="w-full px-3 py-2 border rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0074c7] focus:border-transparent"
              placeholder="Confirmez votre mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-[#0074c7] text-white font-bold rounded-full hover:bg-[#005a9c] focus:outline-none focus:ring-2 focus:ring-[#005a9c] transition-colors"
          >
            S'enregistrer
          </button>
          {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
          {success && <p className="mt-4 text-green-500 text-center">{success}</p>}
        </form>
      </div>
    </div>
  );
}

export default Signup;
