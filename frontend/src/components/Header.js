// src/components/Header.js
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext'; 
import logo from '../assets/images/logo.png';

function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    console.log("USER CONNECTÉ:", user);
  }, [user]);

  // Fonction utilitaire pour naviguer et fermer le menu
  const handleNavigation = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-[#00497c] text-white z-50 shadow-2xl">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 md:px-6 py-3"> {/* Padding vertical légèrement réduit */}

        {/* LOGO = ACCUEIL */}
        <Link to="/" className="flex items-center transition-transform hover:scale-105">
          <img 
            src={logo} 
            alt="Accueil" 
            className="h-12 md:h-14 w-auto object-contain drop-shadow-lg" // Taille ajustée pour un look plus élégant
          />
        </Link>

        {/* MENU DESKTOP */}
        <nav className="hidden md:flex items-center gap-6 text-base font-medium">
          
          <Link to="/" className="hover:text-[#82b864] transition py-1">Accueil</Link>
          
          {/* PANIER (ICÔNE) AVEC BADGE */}
          <button 
            onClick={() => handleNavigation('/cart')}
            className="relative p-2 rounded-full hover:bg-white/10 transition group"
            aria-label="Panier"
          >
            <span className="text-2xl">🛒</span> 
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg border border-white">
                {cart.length}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-4">
              {/* Profil : mis en évidence avec un fond subtil */}
              <Link 
                to="/profile" 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition"
              >
                {/* Icône de profil */}
                <span className="text-xl">👤</span> 
                <span className="text-yellow-300 font-semibold truncate max-w-28">{user.email}</span>
              </Link>
              
              {/* Bouton de déconnexion : Couleur d'alerte */}
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-full font-bold transition transform hover:scale-105 shadow-md"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {/* Se connecter : Couleur secondaire forte */}
              <Link 
                to="/login" 
                className="bg-[#0074c7] hover:bg-[#005a9e] px-6 py-2 rounded-full font-bold transition hover:scale-105 shadow-md"
              >
                Connexion
              </Link>
              {/* S'inscrire : Couleur d'accentuation (Vert pomme) */}
              <Link 
                to="/signup" 
                className="bg-[#82b864] hover:bg-[#6aa44b] px-6 py-2 rounded-full font-bold transition hover:scale-105 shadow-md"
              >
                Inscription
              </Link>
            </div>
          )}
        </nav>

        {/* MENU MOBILE (BURGER) */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-3xl p-2 rounded-lg hover:bg-white/10 transition"
          aria-label="Menu mobile"
        >
          {isOpen ? '×' : '☰'}
        </button>
      </div>

      {/* MENU MOBILE OUVERT */}
      {isOpen && (
        <div className="md:hidden bg-[#00497c] border-t-2 border-white/20 absolute w-full shadow-xl">
          <div className="flex flex-col gap-4 p-6 text-lg">
            
            <Link to="/" onClick={() => handleNavigation('/')} className="hover:text-[#82b864] py-2">Accueil</Link>
            
            <button 
              onClick={() => handleNavigation('/cart')}
              className="text-left hover:text-[#82b864] relative py-2"
            >
              Panier
              {cart.length > 0 && (
                <span className="absolute right-0 top-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {cart.length}
                </span>
              )}
            </button>

            {user ? (
              <>
                <Link to="/profile" onClick={() => handleNavigation('/profile')} className="hover:text-yellow-300 py-2">
                  👤 Mon Profil
                </Link>
                <div className="text-yellow-300 bg-white/10 px-4 py-2 rounded-full text-center">
                  {user.email}
                </div>
                <button
                  onClick={() => { logout(); handleNavigation('/login'); }}
                  className="bg-red-600 hover:bg-red-700 px-8 py-3 mt-2 rounded-full font-bold shadow-md"
                >
                  SE DÉCONNECTER
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => handleNavigation('/login')} className="bg-[#0074c7] hover:bg-[#005a9e] px-8 py-3 rounded-full font-bold text-center shadow-md">
                  Se connecter
                </Link>
                <Link to="/signup" onClick={() => handleNavigation('/signup')} className="bg-[#82b864] hover:bg-[#6aa44b] px-8 py-3 rounded-full font-bold text-center shadow-md">
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;