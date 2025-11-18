// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

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
import ActivationHandler from './pages/ActivationHandler';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const ProtectedRoute = ({ element: Component, ...rest }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <div className="text-gray-700 text-2xl font-bold ml-4">Vérification de la session...</div>
            </div>
        );
    }

    if (user) {
        return <Component {...rest} />;
    }

    return <Navigate to="/login" replace />;
};

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <Header />
                    <main className="pt-20 min-h-screen bg-gray-50">
                        <Elements stripe={stripePromise}>
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/signup" element={<Signup />} />
                                <Route path="/activate/:token" element={<ActivationHandler />} />
                                <Route path="/themes/:themeId" element={<Theme />} />
                                <Route path="/cursus/:cursusId" element={<CursusPage />} />
                                <Route path="/lessons/:lessonId" element={<LessonPage />} />
                                <Route path="/cart" element={<Cart />} />
                                <Route path="/admin" element={<AdminPage />} />
                                <Route path="/profile" element={<ProtectedRoute element={ProfilePage} />} />
                                <Route path="/mentions-legales" element={<LegalMentions />} />
                                <Route path="/politique-de-confidentialite" element={<PrivacyPolicy />} />
                                <Route path="/confirmation" element={<Confirmation />} />
                                <Route path="/error" element={<ErrorPage />} />
                                <Route path="*" element={<Navigate to="/error" />} />
                            </Routes>
                        </Elements>
                    </main>
                    <Footer />
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;