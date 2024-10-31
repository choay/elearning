import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext'; 
import Cookies from 'js-cookie';
import logo from '../assets/images/logo.png';

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, setUserFromToken } = useAuth();
  const { cart } = useCart(); 
  const navigate = useNavigate();
  const isLoggedIn = Boolean(user);
  const isAdmin = user?.role === 'admin';

  const toggleMenu = () => setIsOpen(prev => !prev);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const token = Cookies.get('authToken');
    if (token && !isLoggedIn) {
      setUserFromToken(token);
    }
  }, [isLoggedIn, setUserFromToken]);

  useEffect(() => {
    if (!isLoggedIn) {
      closeMenu();
    }
  }, [isLoggedIn]);

  return (
    <header className="fixed top-0 left-0 w-full bg-[#00497c] text-[#f1f8fc] z-50">
      <nav className="max-w-7xl mx-auto flex items-center justify-between p-4">
        <div className="font-bold text-lg">
          <Link to="/" className="hover:text-gray-300">
            <img className="w-24 h-12"  src={logo} alt='logo'/>
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          aria-expanded={isOpen}
          className="block lg:hidden text-white focus:outline-none"
          onClick={toggleMenu}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>

        <div
          className={`fixed inset-0 bg-[#00497c] transition-transform transform ${
            isOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
          } lg:opacity-100 lg:translate-y-0 lg:relative lg:w-auto lg:bg-transparent`}
        >
          <div className="lg:flex lg:space-x-4 space-y-4 lg:space-y-0 w-full lg:w-auto p-4 lg:p-0">
            <button 
              className="lg:hidden absolute top-4 right-4 text-white" 
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <Link to="/" className="block px-6 py-3 rounded-full text-white transition duration-200" onClick={closeMenu}>
              Accueil
            </Link>

            <button 
              className="block px-6 py-3 rounded-full text-white transition duration-200 relative" 
              onClick={() => {
                console.log("Lien vers le panier cliqué");
                navigate('/cart'); 
              }}
            >
              Panier
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-2 rounded-full">
                  {cart.length}
                </span>
              )}
            </button>

            {isLoggedIn && (
              <Link to="/profile" className="block px-6 py-3 rounded-full text-white transition duration-200" onClick={closeMenu}>
                Mon Profil
              </Link>
            )}

            {isAdmin && (
              <Link to="/admin" className="block px-6 py-3 rounded-full text-white transition duration-200" onClick={closeMenu}>
                ADMINISTRATION
              </Link>
            )}

            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  className="block px-6 py-3 rounded-full text-white bg-[#0074c7] hover:bg-[#005a9e] transition duration-200"
                  onClick={closeMenu}
                >
                  Se connecter
                </Link>
                <Link
                  to="/signup"
                  className="block px-6 py-3 rounded-full text-white bg-[#82b864] hover:bg-[#6aa44b] transition duration-200"
                  onClick={closeMenu}
                >
                  S'enregistrer
                </Link>
              </>
            ) : (
              <button
                className="block px-6 py-3 rounded-full text-white bg-[#e3342f] hover:bg-[#cc1f1a] transition duration-200"
                onClick={() => {
                  logout();
                  closeMenu();
                }}
              >
                Se déconnecter
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
