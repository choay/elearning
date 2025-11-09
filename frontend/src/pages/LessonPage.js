import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios'; 
import { useAuth } from '../context/AuthContext'; 
// Assurez-vous que ces icônes sont importées correctement depuis lucide-react ou votre librairie d'icônes
import { Loader2, Lock, Check, CheckCheck, Clock, ListCheck } from 'lucide-react'; 

// --- Composant de la Page de Leçon ---
function LessonPage() {
    const { lessonId } = useParams(); 
    const { user } = useAuth(); // Récupère l'utilisateur
    
    // 1. États (Déclarés inconditionnellement en haut)
    const [lesson, setLesson] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [isCompleted, setIsCompleted] = useState(false); 
    
    // 2. Récupération des Données de la Leçon et de l'État de Progression
    // Nous désactivons la règle ESLint pour ce bloc afin d'éviter l'erreur
    // "React Hook 'useEffect' is called conditionally" qui est un faux positif
    // pour les checks au début du callback.
    
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        const fetchLessonData = async () => {
            if (!lessonId) {
                setFetchError("ID de leçon manquant.");
                setIsLoading(false);
                return;
            }
            if (!user) {
                setFetchError("Veuillez vous connecter pour accéder au contenu.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setFetchError(null); 

            try {
                // L'API doit renvoyer les détails de la leçon + isCompleted: true/false
                const response = await axios.get(`/api/lessons/${lessonId}`); 
                
                setLesson(response.data);
                setIsCompleted(response.data.isCompleted || false); 
                
            } catch (error) {
                console.error("Erreur lors de la récupération de la leçon:", error);
                
                if (error.response?.status === 401) {
                    setFetchError("Accès non autorisé (401). Vous devez être connecté.");
                } else if (error.response?.status === 403) {
                    setFetchError("Contenu non acheté (403). Veuillez acheter le cours pour y accéder.");
                } else if (error.response?.status === 404) {
                    setFetchError("Leçon non trouvée (404).");
                } else {
                    setFetchError(`Erreur lors du chargement: ${error.message}`);
                }
            } finally {
                setIsLoading(false);
            }
        };

        // Déclencher le fetch uniquement si les dépendances sont présentes
        fetchLessonData();

    }, [lessonId, user]); 
    /* eslint-enable react-hooks/exhaustive-deps */

    
    // 💾 Fonction pour Marquer la Leçon comme Terminée
    const handleCompleteLesson = async () => {
        if (!lesson || isCompleted) return;

        // Utilisez une alerte ou un modal custom, car 'alert()' est déconseillé dans les iframes.
        // Ici, je garde le console.log pour le debug.
        try {
            // Appel API pour mettre à jour la base de données
            await axios.post(`/api/progress/complete`, { 
                lessonId: lesson.id 
            });
            
            setIsCompleted(true);
            console.log("Leçon marquée comme terminée !");

        } catch (error) {
            console.error("Erreur lors de l'enregistrement de la progression:", error);
            // Remplacez 'alert' par une fonction d'affichage de message dans l'interface si possible
            setFetchError("Erreur: Impossible d'enregistrer la progression. Veuillez réessayer.");
        }
    };
    
    
    // --- RENDU DE LA PAGE ---
    
    // Calcul de la progression (Données mockées si non fournies par l'API)
    const mockProgressSteps = lesson?.progressSteps || [
        { id: 1, title: "Regarder la vidéo", isDone: isCompleted },
        { id: 2, title: "Lire les notes", isDone: isCompleted },
        { id: 3, title: "Passer le quiz", isDone: isCompleted },
    ];
    const doneSteps = mockProgressSteps.filter(s => s.isDone).length || 0;
    const totalSteps = mockProgressSteps.length || 1;
    const progressPercent = Math.round((doneSteps / totalSteps) * 100);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50 mt-16 p-6">
                <div className="flex items-center bg-white p-8 rounded-xl shadow-2xl">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="ml-3 text-lg font-medium text-gray-700">Chargement de la leçon...</p>
                </div>
            </div>
        );
    }

    if (fetchError || !lesson) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 mt-16 p-6">
                <div className="text-center bg-white p-12 rounded-2xl shadow-2xl border-t-8 border-red-500 max-w-lg">
                    <Lock className="w-14 h-14 text-red-500 mx-auto mb-6 bg-red-100 p-2 rounded-full" />
                    <h1 className="text-3xl font-extrabold text-red-700 mb-4">Accès Refusé</h1>
                    <p className="text-lg text-gray-600">{fetchError || "Leçon introuvable ou vous n'avez pas les droits d'accès."}</p>
                    {/* Bouton de redirection, à adapter à votre routage */}
                    <button className="mt-8 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition duration-300 shadow-lg">
                        Retour aux Cours
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 mt-16 py-10 min-h-screen font-sans antialiased">
            {/* Si un message d'erreur est présent après le chargement, l'afficher ici */}
            {fetchError && (
                <div className="bg-red-500 text-white p-3 text-center font-medium fixed top-0 left-0 w-full z-50 shadow-xl">
                    {fetchError}
                </div>
            )}
            
            <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
                
                {/* En-tête de la Leçon */}
                <div className="bg-white p-6 rounded-2xl shadow-xl border-t-4 border-indigo-500 mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-3">{lesson.title}</h1>
                    <p className="text-xl text-gray-600">{lesson.description}</p>
                    
                    {/* Barre de Progression */}
                    <div className="mt-5">
                        <div className="flex justify-between items-center mb-1">
                            <span className={`text-sm font-medium ${isCompleted ? 'text-green-600' : 'text-indigo-600'}`}>
                                {isCompleted ? "COMPLÉTÉ" : `Progression : ${progressPercent}%`}
                            </span>
                            <span className="flex items-center text-sm font-medium text-gray-500">
                                <Clock className="w-4 h-4 mr-1"/> {lesson.duration || 'N/A'}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                                className={`h-2.5 rounded-full transition-all duration-700 ease-out ${isCompleted ? 'bg-green-500' : 'bg-indigo-500'}`} 
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Colonne Principale (Vidéo et Contenu) */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Carte Vidéo */}
                        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-2xl border border-gray-200">
                            {lesson.videoUrl && (
                                <div className="relative pt-[56.25%] rounded-xl overflow-hidden shadow-2xl ring-4 ring-indigo-500/50">
                                    <iframe
                                        className="absolute top-0 left-0 w-full h-full"
                                        src={lesson.videoUrl}
                                        title={lesson.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}
                        </div>

                        {/* Contenu (Notes de cours, texte) - Simulation */}
                        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Détails et Exercices</h2>
                            <article className="text-gray-700 space-y-4 leading-relaxed">
                                <p>Cette section contiendrait le texte complet de la leçon, les exemples de code, et les instructions pour les exercices pratiques.</p>
                                <p className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg italic text-sm">
                                    **Objectif :** Après cette leçon, vous devriez être capable de **mettre en œuvre des validations côté client** de manière robuste et sécurisée.
                                </p>
                            </article>
                        </div>
                    </div>
                    
                    {/* Colonne Latérale (Actions et Progression) */}
                    <div className="lg:col-span-1 space-y-8">
                        
                        {/* Carte des Étapes de Progression */}
                        <div className="bg-white p-6 rounded-2xl shadow-2xl border-t-4 border-teal-500">
                            <h3 className="text-xl font-bold text-teal-700 mb-4 flex items-center">
                                <ListCheck className="w-5 h-5 mr-2" /> Votre Check-list
                            </h3>
                            <ul className="space-y-3">
                                {mockProgressSteps.map((step) => (
                                    <li key={step.id} className="flex items-start text-gray-700">
                                        {step.isDone ? (
                                            <CheckCheck className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                                        ) : (
                                            <Check className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                                        )}
                                        <span className={`ml-3 ${step.isDone ? 'line-through text-gray-500 italic' : 'font-medium'}`}>
                                            {step.title}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        {/* Bouton d'Action Principal */}
                        <div className="bg-white p-6 rounded-2xl shadow-2xl">
                            <button
                                onClick={handleCompleteLesson}
                                className={`
                                    w-full py-4 px-6 text-white font-extrabold rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center whitespace-nowrap text-lg 
                                    transform hover:scale-[1.01] active:scale-95
                                    ${isCompleted 
                                        ? 'bg-gradient-to-r from-green-600 to-green-700 cursor-default shadow-green-500/50' 
                                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/50' 
                                    }
                                `}
                                disabled={isCompleted} 
                            >
                                {isCompleted ? (
                                    <>
                                        <CheckCheck className="w-6 h-6 mr-3" /> Terminé & Validé
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-6 h-6 mr-3" /> Valider la Leçon
                                    </>
                                )}
                            </button>
                            <p className="text-center text-sm text-gray-500 mt-4 italic">
                                {isCompleted ? "Bravo pour votre achèvement !" : "Cliquez ici pour enregistrer votre progression."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LessonPage;