// src/context/CartContext.js
// TU NE TOUCHES À RIEN ICI → IL EST PARFAIT

import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext'; 

const CartContext = createContext();

// --- Fonctions utilitaires pour les vérifications ---

const normalizeItem = (item) => {
    const isCursus = !!item.cursusId && !item.lessonId;
    const isLesson = !!item.lessonId;

    if (!isCursus && !isLesson) {
        throw new Error("Erreur de normalisation : L'article doit avoir un cursusId ou un lessonId.");
    }

    const itemPrice = item.price || item.prix; 
    
    if (typeof Number(itemPrice) !== 'number' || Number(itemPrice) <= 0) {
        throw new Error(`Prix invalide ou manquant (${itemPrice}).`);
    }

    let finalLessonIds = [];
    
    if (isCursus) {
        if (Array.isArray(item.lessonIds)) {
            finalLessonIds = item.lessonIds;
        } else if (Array.isArray(item.lessons)) {
            finalLessonIds = item.lessons.map(lesson => lesson.lessonId || lesson.id).filter(Boolean);
        }
    }

    return { 
        ...item, 
        productType: isCursus ? 'cursus' : 'lesson',
        productId: isCursus ? item.cursusId : item.lessonId,
        price: Number(itemPrice),
        lessonIds: isCursus ? finalLessonIds : undefined,
    };
};

const checkItemExistence = (normalizedItem, currentCart) => {
    return currentCart.some(cartItem => 
        cartItem.productType === normalizedItem.productType && 
        cartItem.productId === normalizedItem.productId
    );
};

const isParentCurriculumInCart = (normalizedItem, currentCart) => {
    if (normalizedItem.productType === 'lesson' && normalizedItem.cursusId) {
        const parentCurriculumId = normalizedItem.cursusId;
        return currentCart.some(cartItem => 
            cartItem.productType === 'cursus' && cartItem.productId === parentCurriculumId
        );
    }
    return false;
}

const areAllLessonsInCurriculumInCart = (normalizedCurriculumItem, currentCart) => {
    if (normalizedCurriculumItem.productType !== 'cursus') {
        return false;
    }
    
    const requiredLessonIds = normalizedCurriculumItem.lessonIds;

    if (!requiredLessonIds || requiredLessonIds.length === 0) {
        return false;
    }

    const cartLessonIdsForThisCurriculum = currentCart
        .filter(cartItem => 
            cartItem.productType === 'lesson' && 
            cartItem.cursusId === normalizedCurriculumItem.productId
        )
        .map(cartItem => cartItem.productId);
        
    return requiredLessonIds.every(lessonId => cartLessonIdsForThisCurriculum.includes(lessonId));
}

const isItemOwned = (normalizedItem, user) => {
    const ownedCurricula = user?.ownedCurricula || [];
    const ownedCourses = user?.ownedCourses || [];
    
    if (normalizedItem.productType === 'cursus' && ownedCurricula.includes(normalizedItem.productId)) {
         return true; 
    }
    
    if (normalizedItem.productType === 'lesson' && ownedCourses.includes(normalizedItem.productId)) {
        return true;
    }
    
    if (normalizedItem.productType === 'lesson' && normalizedItem.cursusId) {
        const parentCurriculumId = normalizedItem.cursusId; 
        if (ownedCurricula.includes(parentCurriculumId)) {
            return true;
        }
    }

    return false;
};

export const CartProvider = ({ children }) => {
    const { user } = useAuth() || {}; 
    
    const [cart, setCart] = useState([]); 
    const [cartLoading] = useState(false); 
    const [cartMessage, setCartMessage] = useState({ type: '', text: '' }); 

    const clearMessage = () => {
        const duration = cartMessage.type === 'error' || cartMessage.type === 'warning' ? 5000 : 3000;
        setTimeout(() => setCartMessage({ type: '', text: '' }), duration);
    }

    const addToCart = (item) => {
        setCartMessage({ type: '', text: '' }); 

        let newItem;
        try {
            newItem = normalizeItem(item);
        } catch (e) {
            console.error(`Erreur d'ajout au panier: ${e.message}`);
            setCartMessage({ type: 'error', text: e.message.startsWith('Prix') ? e.message : "Erreur interne: ID ou prix manquant." });
            clearMessage();
            return;
        }
        
        if (isItemOwned(newItem, user)) {
            setCartMessage({ 
                type: 'warning', 
                text: `Ce ${newItem.productType === 'cursus' ? 'cursus' : 'leçon'} a déjà été acheté(e).` 
            });
            clearMessage();
            return; 
        }

        if (checkItemExistence(newItem, cart)) {
            setCartMessage({ 
                type: 'warning',
                text: "L'article est déjà dans votre panier." 
            });
            clearMessage();
            return;
        }

        if (newItem.productType === 'cursus' && areAllLessonsInCurriculumInCart(newItem, cart)) {
            setCartMessage({ 
                type: 'warning', 
                text: `Toutes les leçons de ce cursus sont déjà dans votre panier.` 
            });
            clearMessage();
            return; 
        }

        if (newItem.productType === 'lesson' && isParentCurriculumInCart(newItem, cart)) {
            setCartMessage({ 
                type: 'warning', 
                text: `Le cursus parent de cette leçon est déjà dans le panier.` 
            });
            clearMessage();
            return; 
        }

        setCart((prev) => {
            const finalItem = { 
                ...newItem,
                cartItemId: Date.now() + Math.random().toString(36).substring(2, 9) 
            };

            const newCart = [...prev, finalItem];
            
            setCartMessage({ 
                type: 'success', 
                text: `${item.title || 'Produit'} ajouté au panier !` 
            });
            clearMessage();

            return newCart;
        });
    };

    const removeFromCart = (id) => {
        setCart((prev) => {
            const newCart = prev.filter(item => item.cartItemId !== id);
            setCartMessage({ type: 'success', text: 'Élément retiré du panier.' });
            clearMessage();
            return newCart;
        });
    };

    const clearCart = () => {
        setCart([]);
        setCartMessage({ type: 'info', text: 'Le panier a été vidé.' });
        clearMessage();
    };
    
    const isExactItemInCart = (itemToCheck) => {
        try {
            const normalizedItem = normalizeItem(itemToCheck);
            return checkItemExistence(normalizedItem, cart);
        } catch (e) {
            console.warn("Erreur lors de la vérification d'existence:", e.message);
            return false;
        }
    };

    const total = cart.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const totalFixed = Math.round(total * 100) / 100;

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            clearCart,
            isExactItemInCart, 
            cartLoading, 
            total: totalFixed,
            cartMessage 
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart doit être utilisé dans CartProvider');
    }
    return context;
};