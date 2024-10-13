// App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
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
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

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

              <Route path="/profile" element={<ProfilePage />} />

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
