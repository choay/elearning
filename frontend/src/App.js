import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from './context/AuthContext'; // ⬅️ IMPORTANT : Importez useAuth ici
import { Loader2 } from 'lucide-react'; // ⬅️ Pour l'écran de chargement

import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Theme from './pages/Theme';
import CursusPage from './pages/CursusPage';
import Cart from './pages/Cart';
import LessonPage from './pages/LessonPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/profilePage';
import Confirmation from './pages/Confirmation';
import ErrorPage from './pages/ErrorPage';
import LegalMentions from './pages/LegalMentions';
import PrivacyPolicy from './pages/PrivacyPolicy';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

// -----------------------------------------------------------
// 📌 Nouveau composant de protection de route
// -----------------------------------------------------------
const ProtectedRoute = ({ element: Component, ...rest }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        // ESSENTIEL : Si la vérification est en cours, affiche un écran de chargement.
        // Ceci empêche la redirection intempestive.
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" /> 
                <div className="text-gray-700 text-2xl font-bold ml-4">Vérification de la session...</div>
            </div>
        );
    }
    
    // Si le chargement est terminé et que l'utilisateur est présent, affiche le composant
    if (user) {
        return <Component {...rest} />;
    }

    // Si le chargement est terminé et qu'il n'y a pas d'utilisateur, redirige vers la page de connexion
    return <Navigate to="/login" replace />;
};
// -----------------------------------------------------------


const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Header />
          <Elements stripe={stripePromise}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/themes/:themeId" element={<Theme />} />

              {/* Theme and Cursus Routes */}
              <Route path="/cursus/:cursusId" element={<CursusPage />} />
              <Route path="/lessons/:lessonId" element={<LessonPage />} />

              {/* Cart Management */}
              <Route path="/cart" element={<Cart />} />
              
              {/* Admin Route */}
              <Route path="/admin" element={<AdminPage />} />

              {/* 🚨 CORRECTION : Utilisation de ProtectedRoute pour bloquer l'accès tant que isLoading est vrai */}
              <Route path="/profile" element={<ProtectedRoute element={ProfilePage} />} />

              <Route path="/mentions-legales" element={<LegalMentions />} />
              <Route path="/politique-de-confidentialite" element={<PrivacyPolicy />} />

              {/* Confirmation and Error Pages */}
              <Route path="/confirmation" element={<Confirmation />} />
              <Route path="/error" element={<ErrorPage />} />

              {/* Redirect for unknown routes */}
              <Route path="*" element={<Navigate to="/error" />} />
            </Routes>
          </Elements>
          <Footer />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;