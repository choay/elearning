import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Footer() {
  const { user } = useAuth();

  const BG_COLOR = 'bg-gray-800'; 
  const TEXT_COLOR = 'text-white';
  // CORRECTION : Couleur d'accentuation modifiée pour un bleu clair à fort contraste sur fond sombre (normes WCAG)
  const ACCENT_COLOR = '#62b3ff'; 

  return (
    <footer className={`${BG_COLOR} ${TEXT_COLOR} py-12 shadow-inner`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Principale */}
        <div className="flex flex-col md:flex-row justify-between md:items-start border-b border-white/20 pb-8">
          
          {/* 1. À Propos */}
          <div className="mb-8 md:mb-0 md:w-1/3">
            <h2 className="text-2xl font-bold mb-4" style={{ color: ACCENT_COLOR }}>
              Knowledge
            </h2>
            <p className="text-sm leading-relaxed text-gray-300">
              Votre partenaire pour un apprentissage autonome et accessible, où que vous soyez. 
              Découvrez nos formations en ligne et élargissez vos compétences dès aujourd'hui.
            </p>
          </div>

          {/* 2. Liens */}
          <div className="flex flex-col sm:flex-row space-y-8 sm:space-y-0 sm:space-x-16 md:space-x-12 lg:space-x-24">
            
            {/* Navigation */}
            <div>
              <h3 className="text-lg font-semibold mb-3 border-b border-white/30 pb-1" style={{ color: ACCENT_COLOR }}>
                Navigation
              </h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="hover:text-gray-300 transition duration-200" style={{ color: TEXT_COLOR }}>Accueil</Link></li>

                {!user && (
                  <>
                    <li><Link to="/login" className="hover:text-gray-300 transition duration-200" style={{ color: TEXT_COLOR }}>Se connecter</Link></li>
                    <li><Link to="/signup" className="hover:text-gray-300 transition duration-200" style={{ color: TEXT_COLOR }}>S'enregistrer</Link></li>
                  </>
                )}
                {user && (
                    <li><Link to="/profile" className="hover:text-gray-300 transition duration-200" style={{ color: TEXT_COLOR }}>Mon Profil</Link></li>
                )}

                <li><Link to="/contact" className="hover:text-gray-300 transition duration-200" style={{ color: TEXT_COLOR }}>Contact</Link></li>
              </ul>
            </div>

            {/* Mentions Légales */}
            <div>
              <h3 className="text-lg font-semibold mb-3 border-b border-white/30 pb-1" style={{ color: ACCENT_COLOR }}>
                Légal
              </h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/mentions-legales" className="hover:text-gray-300 transition duration-200" style={{ color: TEXT_COLOR }}>Mentions Légales</Link></li>
                <li><Link to="/politique-de-confidentialite" className="hover:text-gray-300 transition duration-200" style={{ color: TEXT_COLOR }}>Confidentialité</Link></li>
              </ul>
            </div>
            
            {/* Réseaux */}
            <div>
              <h3 className="text-lg font-semibold mb-3 border-b border-white/30 pb-1" style={{ color: ACCENT_COLOR }}>
                Réseaux
              </h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition duration-200" style={{ color: TEXT_COLOR }}>Facebook</a></li>
                <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition duration-200" style={{ color: TEXT_COLOR }}>Twitter</a></li>
                <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition duration-200" style={{ color: TEXT_COLOR }}>Instagram</a></li>
              </ul>
            </div>

          </div>
        </div>
        
        {/* Copyright */}
        <div className="text-center pt-8">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} **Knowledge**. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;