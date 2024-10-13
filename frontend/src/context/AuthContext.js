// AuthContext.js
import React, { createContext, useContext, useState } from 'react';
import Cookies from 'js-cookie';
import {jwtDecode} from 'jwt-decode'; // Correction de l'importation

const AuthContext = createContext();

const decodeToken = (token) => {
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error('Token decoding failed:', error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [completedLessons, setCompletedLessons] = useState([]);

  const setUserFromToken = (token) => {
    const decodedUser = decodeToken(token);
    if (decodedUser) {
      setUser(decodedUser);
    }
  };

  const logout = () => {
    setUser(null);
    setPurchasedCourses([]);
    setCompletedLessons([]);
    Cookies.remove('authToken');
    Cookies.remove('userId');
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUserFromToken,
      logout,
      purchasedCourses,
      setPurchasedCourses, // Méthode pour mettre à jour les cursus achetés
      completedLessons,
      setCompletedLessons, // Méthode pour mettre à jour les leçons complétées
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
