// src/pages/ProfilePage.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Trophy } from 'lucide-react';

function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [purchasedCursus, setPurchasedCursus] = useState([]); // array returned by /api/users/:id/purchased-content
  const [certificates, setCertificates] = useState([]);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (uid) => {
    setLoading(true);
    setError(null);
    try {
      const [pResp, cResp] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/users/${uid}/purchased-content`, { withCredentials: true }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/certificates/user/${uid}`, { withCredentials: true })
      ]);
      setPurchasedCursus(Array.isArray(pResp.data) ? pResp.data : []);
      setCertificates(Array.isArray(cResp.data?.data || cResp.data) ? (cResp.data?.data ?? cResp.data) : []);
    } catch (err) {
      console.error('ProfilePage: fetch error', err);
      setError(err.response?.data?.message ?? err.message ?? 'Erreur lors du chargement du profil.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user?.id) {
      fetchData(user.id);
    }
  }, [user, authLoading, fetchData]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
        <p className="ml-3 text-gray-700">Chargement du profil...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-600 bg-red-50">{error}</div>;
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p>Vous n'êtes pas connecté.</p>
        <button onClick={() => navigate('/login')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded">Se connecter</button>
      </div>
    );
  }

  // Compute summary numbers
  const totalCursusPurchased = purchasedCursus.length;
  const totalLessonsCompleted = purchasedCursus.reduce((sum, cursus) => {
    const lessons = cursus.CourseLessons || [];
    const completed = lessons.filter(l => Array.isArray(l.Progresses) && l.Progresses.length > 0).length;
    return sum + completed;
  }, 0);
  const totalCertificates = Array.isArray(certificates) ? certificates.length : 0;

  return (
    <div className="max-w-5xl mx-auto p-6 sm:p-10 bg-gray-50">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Bienvenue, {user.name ?? user.email ?? 'utilisateur'}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <div className="text-right">
            <Link to="/profile/edit" className="text-indigo-600 hover:underline mr-4">Modifier</Link>
            <button onClick={() => navigate('/logout')} className="text-sm text-red-500">Déconnexion</button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-indigo-50 p-4 rounded">
            <p className="text-sm text-gray-600">Cursus achetés</p>
            <p className="text-2xl font-bold">{totalCursusPurchased}</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded">
            <p className="text-sm text-gray-600">Leçons complétées</p>
            <p className="text-2xl font-bold">{totalLessonsCompleted}</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded">
            <p className="text-sm text-gray-600">Certificats obtenus</p>
            <p className="text-2xl font-bold">{totalCertificates}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Mes Cursus</h3>

            {purchasedCursus.length === 0 && <p className="text-gray-500">Vous n'avez pas de cursus pour le moment.</p>}

            <div className="space-y-4">
              {purchasedCursus.map((cursus) => {
                const lessons = Array.isArray(cursus.CourseLessons) ? cursus.CourseLessons : [];
                const totalLessons = lessons.length;
                const completedCount = lessons.filter(l => Array.isArray(l.Progresses) && l.Progresses.length > 0).length;

                const nextLesson = lessons.find(l => !(Array.isArray(l.Progresses) && l.Progresses.length > 0));

                const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
                const completedAll = totalLessons > 0 && completedCount >= totalLessons;

                return (
                  <div key={cursus.id} className="border rounded p-4 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-semibold">{cursus.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{cursus.description ?? 'Aucune description.'}</p>
                        <p className="text-sm text-gray-600 mt-2">{completedCount}/{totalLessons} leçons • {percent}%</p>
                      </div>

                      <div className="text-right">
                        {completedAll ? (
                          <>
                            <div className="text-green-600 font-semibold flex items-center">
                              <Trophy className="w-5 h-5 mr-2" /> Cursus terminé ✅
                            </div>
                            <Link to={`/lessons/${lessons[0]?.id ?? ''}`} className="inline-flex items-center mt-3 px-4 py-2 bg-indigo-600 text-white rounded">
                              Revoir la première leçon <ChevronRight className="w-4 h-4 ml-2" />
                            </Link>
                          </>
                        ) : (
                          <>
                            <div className="text-sm text-gray-700 mb-2">
                              {nextLesson ? `Continuer : ${nextLesson.title}` : 'Commencer le cursus'}
                            </div>
                            {nextLesson ? (
                              <Link to={`/lessons/${nextLesson.id}`} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded">
                                Continuer <ChevronRight className="w-4 h-4 ml-2" />
                              </Link>
                            ) : (
                              <Link to={`/cursus/${cursus.id}`} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded">
                                Accéder au cursus <ChevronRight className="w-4 h-4 ml-2" />
                              </Link>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white shadow rounded-lg p-6 mb-4">
            <h3 className="text-xl font-bold mb-3">Mes Certificats</h3>
            {Array.isArray(certificates) && certificates.length > 0 ? (
              <ul className="space-y-2">
                {certificates.map(cert => (
                  <li key={cert.id} className="border rounded p-3">
                    <div className="font-semibold">{cert.Cursus?.title ?? `Cursus #${cert.cursusId}`}</div>
                    <div className="text-sm text-gray-500">Émis le {new Date(cert.issuedAt ?? cert.createdAt ?? Date.now()).toLocaleDateString()}</div>
                    <Link to={`/cursus/${cert.cursusId}`} className="text-indigo-600 text-sm hover:underline">Voir le cursus</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Aucun certificat pour le moment.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;