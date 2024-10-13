// CursusPage.js

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import Cookies from 'js-cookie';

function CursusPage() {
    const { cursusId } = useParams();
    const { cart, addToCart } = useCart();
    const [cursus, setCursus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [purchasedLessons, setPurchasedLessons] = useState([]);
    const [purchasedCursus, setPurchasedCursus] = useState([]);
    const navigate = useNavigate();

    const userId = Cookies.get('userId');

    useEffect(() => {
        const fetchCursus = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/cursus/${cursusId}`);
                setCursus(response.data);
                setLoading(false);
            } catch (err) {
                setError('Erreur lors du chargement du cursus');
                setLoading(false);
            }
        };

        fetchCursus();
    }, [cursusId]);

    useEffect(() => {
        const token = Cookies.get('authToken');
        if (token && userId) {
            const fetchUserPurchases = async () => {
                try {
                    const purchasesResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/achats/user/${userId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const achats = purchasesResponse.data;
                    let purchasedLessonIds = [];
                    let purchasedCursusIds = [];

                    // Collecte des IDs de leçons et de cursus achetés
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

                    // Pour chaque cursus acheté, récupérer ses leçons et ajouter leurs IDs à purchasedLessonIds
                    for (const cursusId of purchasedCursusIds) {
                        try {
                            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/cursus/${cursusId}`);
                            const lessons = response.data.lessons;
                            lessons.forEach((lesson) => {
                                if (!purchasedLessonIds.includes(lesson.id)) {
                                    purchasedLessonIds.push(lesson.id);
                                }
                            });
                        } catch (err) {
                            console.error(`Erreur lors de la récupération des leçons pour le cursus ID ${cursusId}:`, err);
                        }
                    }

                    setPurchasedLessons(purchasedLessonIds);
                    setPurchasedCursus(purchasedCursusIds);
                } catch (error) {
                    console.error('Erreur lors de la récupération des achats:', error);
                }
            };
            fetchUserPurchases();
        }
    }, [userId]);

    const handleAddLessonToCart = (lesson) => {
        if (!userId) {
            navigate('/login');
            return;
        }

        if (purchasedLessons.includes(lesson.id)) {
            alert('Vous avez déjà accès à cette leçon.');
            return;
        }

        if (cart.some(item => item.lessonId === lesson.id)) {
            alert('Cette leçon est déjà dans votre panier.');
            return;
        }

        const itemToAdd = {
            id: lesson.id,
            title: lesson.title,
            prix: lesson.prix,
            cursusId: parseInt(cursusId),
            lessonId: lesson.id,
        };
        addToCart(itemToAdd);
    };

    const handleAddCursusToCart = () => {
        if (!userId) {
            navigate('/login');
            return;
        }

        const cursusIdInt = parseInt(cursusId);

        if (purchasedCursus.includes(cursusIdInt)) {
            alert('Vous avez déjà acheté ce cursus.');
            return;
        }

        const anyLessonPurchased = cursus.lessons.some(lesson => purchasedLessons.includes(lesson.id));
        if (anyLessonPurchased) {
            alert('Vous avez déjà acheté une ou plusieurs leçons de ce cursus. Vous ne pouvez pas acheter le cursus.');
            return;
        }

        if (cart.some(item => item.cursusId === cursusIdInt && !item.lessonId)) {
            alert('Ce cursus est déjà dans votre panier.');
            return;
        }

        const itemToAdd = {
            id: cursusIdInt,
            title: cursus.title,
            prix: cursus.prix,
            cursusId: cursusIdInt,
            lessonId: null,
        };
        addToCart(itemToAdd);
    };

    if (loading) return <div>Chargement...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="p-24">
            <h1 className="text-2xl font-bold mb-4">{cursus?.title}</h1>
            <p>{cursus?.description}</p>

            {/* Bouton pour acheter le cursus entier */}
            <div className="mt-4">
                <p>Prix du cursus : {cursus.prix} €</p>
                <button
                    onClick={handleAddCursusToCart}
                    className={`mt-2 px-4 py-2 ${cart.some(item => item.cursusId === parseInt(cursusId) && !item.lessonId) ? 'bg-gray-300' : 'bg-blue-500'} text-white rounded mr-4`}
                    disabled={
                        purchasedCursus.includes(parseInt(cursusId)) ||
                        cursus.lessons.some(lesson => purchasedLessons.includes(lesson.id)) ||
                        cart.some(item => item.cursusId === parseInt(cursusId) && !item.lessonId)
                    }
                >
                    {purchasedCursus.includes(parseInt(cursusId)) ? 'Cursus déjà acheté' : 'Acheter le cursus'}
                </button>
            </div>

            <h2 className="text-xl font-bold mt-4">Leçons</h2>
            {cursus?.lessons?.map((lesson) => {
                const isPurchased = purchasedLessons.includes(lesson.id);
                const isInCart = cart.some(item => item.lessonId === lesson.id);

                return (
                    <div key={lesson.id} className="border p-4 mb-4 rounded">
                        <h3 className="text-lg font-semibold">{lesson.title}</h3>
                        <p>{lesson.description}</p>
                        {isPurchased ? (
                            <Link to={`/lessons/${lesson.id}`} className="text-blue-500">Accéder à la leçon</Link>
                        ) : (
                            <button
                                onClick={() => handleAddLessonToCart(lesson)}
                                className={`mt-2 px-4 py-2 ${isInCart ? 'bg-gray-300' : 'bg-blue-600'} text-white rounded`}
                                disabled={isInCart}
                            >
                                {isInCart ? 'Déjà dans le panier' : 'Acheter la leçon'}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default CursusPage;
