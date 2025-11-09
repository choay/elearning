import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext'; 

function CursusPage() {
    const { cursusId } = useParams();
    const { user } = useAuth();
    const { cart, addToCart } = useCart(); 
    const [cursus, setCursus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [purchasedLessons, setPurchasedLessons] = useState([]);
    const [purchasedCursus, setPurchasedCursus] = useState([]);
    const navigate = useNavigate();

    const customAlert = (message) => console.log(`NOTIFICATION: ${message}`);

    const userId = user?.id;

    useEffect(() => {
        const fetchCursus = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/cursus/${cursusId}`);
                setCursus(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Erreur lors du chargement du cursus:', err);
                setError('Erreur lors du chargement du cursus');
                setLoading(false);
            }
        };
        fetchCursus();
    }, [cursusId]);

    useEffect(() => {
        if (userId) {
            const fetchUserPurchases = async () => {
                try {
                    const purchasesResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/achats/user/${userId}`);
                    const achats = purchasesResponse.data;
                    let purchasedLessonIds = [];
                    let purchasedCursusIds = [];

                    if (Array.isArray(achats)) {
                         for (const achat of achats) {
                            if (achat.PurchaseItems && achat.PurchaseItems.length > 0) {
                                for (const item of achat.PurchaseItems) {
                                    if (item.productType === 'lesson') {
                                        purchasedLessonIds.push(parseInt(item.productId)); 
                                    } else if (item.productType === 'cursus') {
                                        purchasedCursusIds.push(parseInt(item.productId));
                                    }
                                }
                            }
                        }
                    }

                    for (const cId of purchasedCursusIds) {
                        try {
                            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/cursus/${cId}`);
                            const lessons = response.data.CourseLessons;
                            if (lessons) {
                                lessons.forEach((lesson) => {
                                    if (!purchasedLessonIds.includes(lesson.id)) {
                                        purchasedLessonIds.push(lesson.id);
                                    }
                                });
                            }
                        } catch (err) {
                            console.error(`Erreur lors de la récupération des leçons pour le cursus ID ${cId}:`, err);
                        }
                    }

                    setPurchasedLessons(purchasedLessonIds);
                    setPurchasedCursus(purchasedCursusIds);
                } catch (error) {
                    console.error('Erreur lors de la récupération des achats:', error);
                    setPurchasedLessons([]);
                    setPurchasedCursus([]);
                }
            };
            fetchUserPurchases();
        } else {
            setPurchasedLessons([]);
            setPurchasedCursus([]);
        }
    }, [userId]);

    const handleAddLessonToCart = (lesson) => {
        if (!userId) {
            navigate('/login');
            return;
        }

        if (purchasedLessons.includes(lesson.id)) {
            customAlert('Vous avez déjà accès à cette leçon.');
            return;
        }

        if (cart.some(item => item.lessonId === lesson.id && item.cursusId === parseInt(cursusId))) {
            customAlert('Cette leçon est déjà dans votre panier.');
            return;
        }

        const itemToAdd = {
            id: `lesson-${lesson.id}`, 
            title: lesson.title,
            prix: lesson.prix,
            cursusId: parseInt(cursusId),
            lessonId: lesson.id,
            productType: 'lesson',
            productId: lesson.id,
        };
        addToCart(itemToAdd);
        customAlert(`Leçon "${lesson.title}" ajoutée au panier.`);
    };

    const handleAddCursusToCart = () => {
        if (!userId) {
            navigate('/login');
            return;
        }

        const cursusIdInt = parseInt(cursusId);

        if (purchasedCursus.includes(cursusIdInt)) {
            customAlert('Vous avez déjà acheté ce cursus.');
            return;
        }

        const lessons = cursus?.CourseLessons; 

        if (lessons && Array.isArray(lessons)) {
            const anyLessonPurchased = lessons.some(lesson => purchasedLessons.includes(lesson.id));
            if (anyLessonPurchased) {
                customAlert('Vous avez déjà acheté une ou plusieurs leçons de ce cursus. Vous ne pouvez pas acheter le cursus entier.');
                return;
            }
        }
        
        if (cart.some(item => item.cursusId === cursusIdInt && !item.lessonId)) {
            customAlert('Ce cursus est déjà dans votre panier.');
            return;
        }

        const itemToAdd = {
            id: `cursus-${cursusIdInt}`,
            title: cursus.title,
            prix: cursus.prix,
            cursusId: cursusIdInt,
            lessonId: null,
            productType: 'cursus',
            productId: cursusIdInt,
        };
        addToCart(itemToAdd);
        customAlert(`Cursus "${cursus.title}" ajouté au panier.`);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="ml-3 text-gray-700">Chargement du cursus...</p>
        </div>
    );
    if (error) return <div className="text-red-600 p-8 text-center bg-red-50">{error}</div>;
    if (!cursus) return <div className="p-8 text-center">Aucun cursus trouvé.</div>;

    const lessonsList = cursus?.CourseLessons || []; 
    const cursusIdInt = parseInt(cursusId);
    
    const isCursusInCart = cart.some(item => item.cursusId === cursusIdInt && !item.lessonId);
    const lessonsPurchasedInCursus = lessonsList.some(lesson => purchasedLessons.includes(lesson.id));
    const isPurchased = purchasedCursus.includes(cursusIdInt);
    const disableCursusButton = isPurchased || lessonsPurchasedInCursus || isCursusInCart;

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white shadow-xl rounded-lg mt-10 font-sans">
            <div className="mb-6 border-b pb-4">
                <p className="text-sm font-medium text-indigo-600 mb-1 uppercase tracking-wider">
                    Thème : {cursus?.Theme?.name || 'Général'}
                </p>
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{cursus?.title}</h1>
                <p className="text-gray-600 leading-relaxed">{cursus?.description}</p>
            </div>

            <div className="bg-gray-100 p-5 rounded-lg flex items-center justify-between shadow-inner mb-8">
                <div>
                    <p className="text-xl font-bold text-gray-800">Prix du cursus complet : <span className="text-2xl text-green-700">{cursus.prix} €</span></p>
                    <p className="text-sm text-gray-500 mt-1">Économisez en achetant le pack complet.</p>
                </div>
                <button
                    onClick={handleAddCursusToCart}
                    className={`px-6 py-3 font-semibold transition duration-200 ease-in-out transform hover:scale-105 rounded-full shadow-md
                        ${disableCursusButton ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
                        `}
                    disabled={isPurchased || lessonsPurchasedInCursus || isCursusInCart}
                >
                    {isPurchased ? 'Cursus déjà acheté' : 
                    (lessonsPurchasedInCursus ? 'Leçons individuelles déjà achetées' : 
                    (isCursusInCart ? 'Déjà dans le panier' : 'Acheter le cursus'))}
                </button>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Contenu du Cursus ({lessonsList.length} Leçons)</h2>
            {lessonsList.length === 0 && <p className="text-gray-500 mt-2">Ce cursus ne contient aucune leçon pour le moment.</p>}

            <div className="space-y-4">
                {lessonsList
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((lesson, index) => { 
                    const isLessonPurchased = purchasedLessons.includes(lesson.id) || isPurchased;
                    const isEntireCursusInCart = cart.some(item => item.cursusId === cursusIdInt && !item.lessonId);
                    const isInCart = cart.some(item => item.lessonId === lesson.id) || isEntireCursusInCart; 
                    const disableLessonButton = isLessonPurchased || isInCart;

                    return (
                        <div key={lesson.id} className="border p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition duration-150 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700">
                                    <span className="text-indigo-500 mr-2">#{index + 1}</span> 
                                    {lesson.title}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">{lesson.description}</p>
                                <p className="text-sm font-bold text-green-600 mt-2">
                                    Prix unitaire : {lesson.prix} €
                                </p>
                            </div>
                            
                            <div>
                                {isLessonPurchased ? (
                                    <Link 
                                        to={`/lessons/${lesson.id}`} 
                                        className="inline-block px-4 py-2 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 transition"
                                    >
                                        Accéder à la leçon
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => handleAddLessonToCart(lesson)}
                                        className={`px-4 py-2 font-medium rounded-full transition duration-150
                                            ${disableLessonButton ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}
                                        `}
                                        disabled={isLessonPurchased || isInCart}
                                    >
                                        {isEntireCursusInCart ? 'Cursus complet dans panier' : 
                                        (isInCart ? 'Dans le panier' : 'Acheter la leçon')}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default CursusPage;