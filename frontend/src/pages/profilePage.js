// src/pages/ProfilePage.js

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; 
// 🏆 CORRECTION APPORTÉE : Assurer l'import de toutes les icônes utilisées, y compris Loader.
import { LogOut, BookOpen, Clock, Settings, TrendingUp, Mail, Edit, Loader } from 'lucide-react'; 

// --- Composants Enfants (définis ici pour l'exemple) ---

const StatCard = ({ icon, value, label }) => (
    <div className="flex flex-col items-start bg-gray-50 p-4 rounded-lg border border-gray-100">
        {icon}
        <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
    </div>
);

// Composant pour afficher un item de Cursus acheté (simulé)
function CursusItem({ cursusId }) {
    const [cursus, setCursus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCursus = async () => {
            try {
                const response = await axios.get(`/api/cursus/${cursusId}`);
                setCursus(response.data);
            } catch (err) {
                console.error('Erreur lors de la récupération du cursus:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCursus();
    }, [cursusId]);

    if (loading) return <p className="text-sm text-gray-400">Chargement du cursus...</p>;
    if (!cursus) return <p className="text-sm text-red-400">Cursus introuvable.</p>;

    return (
        <div>
            <h3 className="text-lg font-bold text-gray-900 hover:text-indigo-600 transition">
                {cursus.title || `Cursus #${cursusId}`}
            </h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{cursus.description || 'Description non disponible.'}</p>
            <Link 
                to={`/cursus/${cursusId}`} 
                className="mt-2 inline-flex items-center gap-1 text-indigo-500 text-sm font-semibold hover:text-indigo-600 hover:underline transition"
            >
                Accéder au cursus 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
        </div>
    );
}

// Composant pour afficher un item de Leçon acheté (simulé)
function LessonItem({ lessonId }) {
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                const response = await axios.get(`/api/lessons/${lessonId}`);
                setLesson(response.data);
            } catch (err) {
                console.error('Erreur lors de la récupération de la leçon:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLesson();
    }, [lessonId]);

    if (loading) return <p className="text-sm text-gray-400">Chargement de la leçon...</p>;
    if (!lesson) return <p className="text-sm text-red-400">Leçon introuvable.</p>;

    return (
        <div>
            <h3 className="text-lg font-bold text-gray-900 hover:text-green-600 transition">
                {lesson.title || `Leçon #${lessonId}`}
            </h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{lesson.description || 'Description non disponible.'}</p>
            <Link 
                to={`/lessons/${lessonId}`} 
                className="mt-2 inline-flex items-center gap-1 text-green-500 text-sm font-semibold hover:text-green-600 hover:underline transition"
            >
                Accéder à la leçon
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
        </div>
    );
}


const SectionPurchases = ({ title, items, Component, idKey, emptyMessage }) => (
    <div className="bg-white shadow-lg rounded-xl p-6 border-t-2 border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" /> {title}
        </h2>
        
        {items.length > 0 ? (
            <ul className="divide-y divide-gray-100">
                {items.map((id) => (
                    <li key={id} className="py-4">
                        <Component {...{ [idKey]: id }} />
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg">{emptyMessage}</p>
        )}
    </div>
);

// Composant principal de la page de profil
function ProfilePage() {
    // Les états existants
    const [purchasedLessons, setPurchasedLessons] = useState([]);
    const [purchasedCursus, setPurchasedCursus] = useState([]);
    const [error, setError] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true); 

    const navigate = useNavigate();

    const { user, logout } = useAuth();
    
    const userId = user?.id;

    const handleAuthError = (err) => {
        if (err.response && err.response.status === 401) {
            setError('Session expirée ou non autorisée. Veuillez vous reconnecter.');
            // On ne logout pas ici car c'est géré par l'intercepteur de AuthContext (handleRefreshFailure)
        } else {
            setError('Erreur lors du chargement des données.');
        }
    };

    useEffect(() => {
        // user est vérifié par AuthProvider, on ne navigue pas ici si `user` est `null` 
        // car le `AuthContext` gère la navigation vers `/login` après échec du refresh.
        if (!user || !userId) {
            setLoading(false);
            return; 
        }

        setLoading(true);
        setError(null);

        const fetchUserInfo = async () => {
            try {
                const response = await axios.get(`/api/users/${userId}`);
                setUserInfo(response.data);
            } catch (err) {
                console.error('Erreur lors de la récupération des informations utilisateur:', err);
                handleAuthError(err);
            }
        };

        const fetchUserPurchases = async () => {
            try {
                const purchasesResponse = await axios.get(`/api/achats/user/${userId}`);
                const achats = purchasesResponse.data;
                
                let purchasedLessonIds = [];
                let purchasedCursusIds = [];

                for (const achat of achats) {
                    if (achat.PurchaseItems && achat.PurchaseItems.length > 0) {
                        for (const item of achat.PurchaseItems) {
                            if (item.productType === 'lesson') {
                                purchasedLessonIds.push(item.productId);
                            } else if (item.productType === 'cursus') {
                                purchasedCursusIds.push(item.productId);
                            }
                        }
                    }
                }
                
                setPurchasedLessons([...new Set(purchasedLessonIds)]);
                setPurchasedCursus([...new Set(purchasedCursusIds)]);

            } catch (err) {
                console.error('Erreur lors de la récupération des achats:', err);
                handleAuthError(err);
            } finally {
                setLoading(false); 
            }
        };

        fetchUserInfo();
        fetchUserPurchases();
        
    }, [user, navigate, logout, userId]); 

    // Si user est null (non connecté) et que le chargement initial d'AuthContext est terminé
    if (!user && !loading) {
        navigate('/login');
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen pt-24 bg-gray-50 flex items-center justify-center">
                <p className="text-xl text-gray-600 flex items-center gap-2">
                    <Loader className="animate-spin w-5 h-5 text-indigo-500" /> Chargement du profil...
                </p>
            </div>
        );
    }
    
    const userName = userInfo?.name || userInfo?.email.split('@')[0] || 'Utilisateur';

    return (
        <div className="min-h-screen pt-24 bg-gray-50 font-sans">
            <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
                
                {/* Section 1: En-tête du Profil et Statistiques */}
                <div className="bg-white shadow-xl rounded-xl p-8 mb-10 border-t-4 border-indigo-500">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b pb-6 mb-6">
                        
                        <div className="flex items-center gap-6">
                            {/* Avatar */}
                            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-3xl font-bold border-4 border-white shadow-md">
                                {userName[0]?.toUpperCase() || 'U'}
                            </div>
                            
                            {/* Infos Utilisateur */}
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                                    Bonjour, **{userName}**! 
                                    <span className="text-sm font-medium text-gray-500 ml-2">#{userId}</span>
                                </h1>
                                <p className="text-gray-600 flex items-center gap-1 mt-1">
                                    <Mail className="w-4 h-4 text-indigo-500" /> {userInfo?.email}
                                </p>
                            </div>
                        </div>

                        {/* Actions Profil */}
                        <div className="mt-4 md:mt-0 flex gap-3">
                            <button className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition">
                                <Edit className="w-4 h-4" /> 
                                Éditer Profil
                            </button>
                            <button 
                                onClick={logout} 
                                className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
                            >
                                <LogOut className="w-4 h-4" /> 
                                Déconnexion
                            </button>
                        </div>
                    </div>

                    {/* Statistiques rapides (Simulées) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <StatCard icon={<BookOpen className="w-6 h-6 text-indigo-500" />} value={purchasedCursus.length} label="Cursus Achetés" />
                        <StatCard icon={<Clock className="w-6 h-6 text-green-500" />} value="12h 30m" label="Temps total passé" />
                        <StatCard icon={<TrendingUp className="w-6 h-6 text-purple-500" />} value="75%" label="Progression globale" />
                        <StatCard icon={<Settings className="w-6 h-6 text-yellow-500" />} value={purchasedLessons.length} label="Leçons Individuelles" />
                    </div>
                </div>

                {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-6 border border-red-200">❌ {error}</div>}

                {/* Section 2: Mes Achats */}
                <div className="grid lg:grid-cols-2 gap-8">
                    
                    {/* Colonne Cursus */}
                    <SectionPurchases 
                        title="Mes Cursus Achetés"
                        items={purchasedCursus}
                        Component={CursusItem}
                        idKey="cursusId"
                        emptyMessage="Vous n'avez acheté aucun cursus pour l'instant."
                    />

                    {/* Colonne Leçons */}
                    <SectionPurchases 
                        title="Mes Leçons Achetées"
                        items={purchasedLessons}
                        Component={LessonItem}
                        idKey="lessonId"
                        emptyMessage="Vous n'avez acheté aucune leçon individuelle."
                    />
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;