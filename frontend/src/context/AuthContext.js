import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

// --- CONFIGURATION DE L'URL API ---
// Utilise la variable d'environnement Vercel si elle existe, sinon utilise localhost pour le dev local.
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'; 

// --- GESTION DU TOKEN EN MÉMOIRE ---
let inMemoryAccessToken = null;

const setInMemoryToken = (token) => {
    inMemoryAccessToken = token;
};

axios.defaults.withCredentials = true;
axios.defaults.baseURL = BASE_URL; // <-- CORRECTION APPLIQUÉE ICI

// INTERCEPTEUR DE REQUÊTE
axios.interceptors.request.use(
    config => {
        const token = inMemoryAccessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Pour la requête de rafraîchissement, le token est envoyé par cookie HTTP-Only, pas par header d'autorisation.
        if (config.url === '/api/auth/refresh') {
            delete config.headers.Authorization;
        }
        return config;
    },
    error => Promise.reject(error)
);

const handleRefreshFailure = () => {
    console.error("Échec du rafraîchissement du token. Déconnexion forcée.");
    setInMemoryToken(null);
};

// INTERCEPTEUR 401 (Gestion du rafraîchissement du token)
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Si c'est l'appel refresh qui a échoué avec 401, on déconnecte
        if (originalRequest.url === '/api/auth/refresh' && error.response?.status === 401) {
            handleRefreshFailure();
            return Promise.reject(error);
        }

        // Si ce n'est pas une erreur 401 (non autorisé) ou si la requête a déjà été réessayée, on la rejette
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // Marque la requête pour éviter les boucles infinies de rafraîchissement
        originalRequest._retry = true;

        try {
            // Tente de rafraîchir le token
            const res = await axios.post('/api/auth/refresh');
            const newToken = res.data.accessToken;
            setInMemoryToken(newToken);
            
            // Réapplique le nouveau token à la requête originale et la ré-exécute
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
        } catch (refreshError) {
            handleRefreshFailure();
            return Promise.reject(refreshError);
        }
    }
);

// CRÉATION DU CONTEXTE
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const logout = useCallback(async (redirect = true) => {
        try {
            await axios.post('/api/auth/logout');
        } catch (err) {
            console.warn("Erreur lors du logout. Ignoré.", err);
        }
        
        setInMemoryToken(null);
        setUser(null);

        if (redirect && window.location.pathname !== '/login') {
            window.location.replace('/login');
        }
    }, []);

    const fetchUserAndRefresh = useCallback(async () => {
        setIsLoading(true);

        try {
            // 1. Rafraîchissement du token et récupération du nouveau token
            const res = await axios.post('/api/auth/refresh');
            const newToken = res.data.accessToken;
            setInMemoryToken(newToken);

            // 2. Récupération des données utilisateur
            const userRes = await axios.get('/api/auth/me');
            const userData = userRes.data.user;

            // 3. CHARGEMENT DES ACHATS
            let ownedCurricula = [];
            let ownedCourses = [];

            try {
                const purchasesRes = await axios.get(`/api/achats/user/${userData.id}`);
                const achats = purchasesRes.data || [];

                achats.forEach(achat => {
                    achat.PurchaseItems?.forEach(item => {
                        if (item.productType === 'cursus') {
                            ownedCurricula.push(parseInt(item.productId));
                        } else if (item.productType === 'lesson') {
                            ownedCourses.push(parseInt(item.productId));
                        }
                    });
                });

                // Si un cursus est acheté → toutes ses leçons sont possédées
                for (const cursusId of ownedCurricula) {
                    try {
                        const cursusRes = await axios.get(`/api/cursus/${cursusId}`);
                        const lessons = cursusRes.data.CourseLessons || [];
                        lessons.forEach(lesson => {
                            if (!ownedCourses.includes(lesson.id)) {
                                ownedCourses.push(lesson.id);
                            }
                        });
                    } catch (err) {
                        console.warn(`Impossible de charger les leçons du cursus ${cursusId}`, err);
                    }
                }
            } catch (err) {
                console.warn("Impossible de charger les achats", err);
            }

            setUser({
                ...userData,
                accessToken: newToken,
                ownedCurricula,
                ownedCourses
            });

        } catch (err) {
            await logout(false);
        } finally {
            setIsLoading(false);
        }
    }, [logout]);

    const login = async (email, password) => {
        const res = await axios.post('/api/auth/login', { email, password });
        const newToken = res.data.accessToken;
        setInMemoryToken(newToken);

        await fetchUserAndRefresh();
        return res;
    };

    useEffect(() => {
        fetchUserAndRefresh();
    }, [fetchUserAndRefresh]);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <div className="text-gray-700 text-2xl font-bold ml-4">Chargement de la session...</div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);