import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* About Section */}
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold mb-2">À propos</h2>
            <p className="text-gray-300">
              Notre site offre des informations et des ressources pour vous aider à
              améliorer vos connaissances.
            </p>
          </div>

          {/* Links Section */}
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
            <div>
              <h2 className="text-xl font-bold mb-2">Liens</h2>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:text-gray-400" style={{ color: '#f1f8fc' }}>Accueil</Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-gray-400" style={{ color: '#f1f8fc' }}>Se connecter</Link>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-gray-400" style={{ color: '#f1f8fc' }}>S'enregistrer</Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-gray-400" style={{ color: '#f1f8fc' }}>Contact</Link>
                </li>
              </ul>
            </div>

            {/* Follow Us Section */}
            <div>
              <h2 className="text-xl font-bold mb-2">Suivez-nous</h2>
              <ul className="space-y-2">
                <li>
                  <a href="https://facebook.com" className="hover:text-gray-400" style={{ color: '#f1f8fc' }}>Facebook</a>
                </li>
                <li>
                  <a href="https://twitter.com" className="hover:text-gray-400" style={{ color: '#f1f8fc' }}>Twitter</a>
                </li>
                <li>
                  <a href="https://instagram.com" className="hover:text-gray-400" style={{ color: '#f1f8fc' }}>Instagram</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="text-center mt-8">
          <p className="text-gray-400">&copy; {new Date().getFullYear()} Votre Entreprise. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
