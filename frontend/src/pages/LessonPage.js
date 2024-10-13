import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';

function LessonPage() {
    const { lessonId } = useParams();
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(null);

    const userId = Cookies.get('userId');
    const token = Cookies.get('authToken');

    useEffect(() => {
        const fetchLessonAndProgress = async () => {
            try {
                if (!userId || !token) {
                    setError('Vous devez être connecté pour accéder à cette leçon.');
                    setLoading(false);
                    return;
                }

                // Récupérer la leçon
                const lessonResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/lessons/${lessonId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setLesson(lessonResponse.data);

                // Récupérer ou créer la progression
                const progressResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/progress/user/${userId}/lesson/${lessonId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }).catch(async (error) => {
                    if (error.response && error.response.status === 404) {
                        // Créer la progression si elle n'existe pas
                        const newProgress = {
                            userId: parseInt(userId),
                            lessonId: parseInt(lessonId),
                            completed: false,
                            currentTime: 0,
                        };
                        const createProgressResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/progress`, newProgress, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        return createProgressResponse.data;
                    } else {
                        throw error;
                    }
                });

                setProgress(progressResponse?.data || progressResponse);
                setLoading(false);
            } catch (err) {
                console.error('Erreur lors de la récupération de la leçon ou de la progression:', err);
                setError('Erreur lors du chargement de la leçon.');
                setLoading(false);
            }
        };

        fetchLessonAndProgress();
    }, [lessonId, userId, token]);

    const handleMarkAsCompleted = async () => {
        try {
            const updatedProgress = { ...progress, completed: true };
            await axios.put(
                `${process.env.REACT_APP_API_URL}/api/progress/user/${userId}/lesson/${lessonId}`,
                { completed: true },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setProgress(updatedProgress);
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la progression:', error);
            alert('Erreur lors de la mise à jour de la progression.');
        }
    };

    if (loading) return <div>Chargement...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="p-24">
            <h1 className="text-2xl font-bold mb-4">{lesson.title}</h1>
            {/* Afficher le contenu de la leçon */}

            <div className="relative pb-9/16">
                    <video className="w-full h-auto" controls>
                        <source src={lesson.videoUrl} type="video/mp4" />
                        Votre navigateur ne prend pas en charge la vidéo.
                    </video>
            </div>

            <p>{lesson.content}</p>

            {/* Afficher le statut de la leçon */}
            <div className="mt-4">
                <p>
                    Statut :{' '}
                    {progress && progress.completed ? (
                        <span className="text-green-500">Complétée</span>
                    ) : (
                        <span className="text-red-500">Non complétée</span>
                    )}
                </p>
            </div>

            {/* Bouton pour marquer comme complétée */}
            {!progress?.completed && (
                <button
                    onClick={handleMarkAsCompleted}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
                >
                    Marquer comme complétée
                </button>
            )}
        </div>
    );
}

export default LessonPage;
