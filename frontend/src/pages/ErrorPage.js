// ErrorPage.js

import React from 'react';

const ErrorPage = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <h1 className="text-3xl font-bold text-red-500 mb-4">Erreur</h1>
      <p>Les identifiants requis sont manquants ou une erreur est survenue.</p>
      <a href="/" className="mt-4 text-blue-500 underline">Retour à l'accueil</a>
    </div>
  );
};

export default ErrorPage;
