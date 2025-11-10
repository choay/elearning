import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

// --- CONFIGURATION DE L'URL API ---
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'; 

// --- GESTION DU TOKEN EN MÉMOIRE ---
let inMemoryAccessToken = null;

const setInMemoryToken = (token) => {
    inMemoryAccessToken = token;
};

axios.defaults.withCredentials = true;
axios.defaults.baseURL = BASE_URL;

// INTERCEPTEUR DE REQUÊTE
axios.interceptors.request.use(
    config => {
        const token = inMemoryAccessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
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
        
        if (originalRequest.url === '/api/auth/refresh' && error.response?.status === 401) {
            handleRefreshFailure();
            return Promise.reject(error);
        }

        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            const res = await axios.post('/api/auth/refresh');
            const newToken = res.data.accessToken;
            setInMemoryToken(newToken);
            
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
            const res = await axios.post('/api/auth/refresh');
            const newToken = res.data.accessToken;
            setInMemoryToken(newToken);

            const userRes = await axios.get('/api/auth/me');
            const userData = userRes.data.user;

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

    // ✅ Seul changement ici : ajout de fetchUserAndRefresh dans la valeur du contexte
    return (
        <AuthContext.Provider value={{ user, login, logout, fetchUserAndRefresh }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
