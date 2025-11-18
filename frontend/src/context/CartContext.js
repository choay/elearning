// src/context/CartContext.js
import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const normalizeItem = (item) => {
  const isCursus = !!(item.cursusId || item.productType === 'cursus') && !item.lessonId;
  const isLesson = !!(item.lessonId || item.productType === 'lesson');

  if (!isCursus && !isLesson) {
    throw new Error('L\'article doit avoir cursusId ou lessonId.');
  }

  const rawPrice = item.price ?? item.prix ?? item.amount ?? 0;
  const parsedPrice = Number(rawPrice);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    throw new Error('Prix invalide ou manquant.');
  }

  const productId = isCursus ? (item.productId ?? item.cursusId) : (item.productId ?? item.lessonId);
  const finalProductId = Number(productId);
  const finalCursusId = item.cursusId ? Number(item.cursusId) : (isLesson && item.cursusId ? Number(item.cursusId) : null);

  return {
    ...item,
    productType: isCursus ? 'cursus' : 'lesson',
    productId: finalProductId,
    cursusId: finalCursusId,
    price: parsedPrice
  };
};

const checkItemExistence = (normalizedItem, currentCart) => {
  return currentCart.some(ci => ci.productType === normalizedItem.productType && Number(ci.productId) === Number(normalizedItem.productId));
};

const isParentCurriculumInCart = (normalizedItem, currentCart) => {
  if (normalizedItem.productType === 'lesson' && normalizedItem.cursusId) {
    return currentCart.some(ci => ci.productType === 'cursus' && Number(ci.productId) === Number(normalizedItem.cursusId));
  }
  return false;
};

const hasAnyLessonInCart = (normalizedItem, currentCart) => {
  if (normalizedItem.productType === 'cursus') {
    return currentCart.some(ci => ci.productType === 'lesson' && Number(ci.cursusId) === Number(normalizedItem.productId));
  }
  return false;
};

const isItemOwned = async (normalizedItem, user, authApi) => {
  if (!user) return false;
  const purchasedLessonIds = Array.isArray(user.purchasedLessonIds) ? user.purchasedLessonIds.map(Number) : [];
  const purchasedCursusIds = Array.isArray(user.purchasedCursusIds) ? user.purchasedCursusIds.map(Number) : [];

  if (normalizedItem.productType === 'cursus') {
    if (purchasedCursusIds.includes(normalizedItem.productId)) return true;
    if (authApi) {
      try {
        const res = await authApi.get(`/api/cursus/${normalizedItem.productId}`);
        const lessons = res.data?.CourseLessons || [];
        const lessonIds = lessons.map(l => Number(l.id)).filter(n => !Number.isNaN(n));
        if (lessonIds.length > 0 && lessonIds.every(id => purchasedLessonIds.includes(id))) return true;
      } catch (err) {
        console.warn('Cart.isItemOwned: impossible de récupérer cursus', err);
      }
    }
    return false;
  }

  if (normalizedItem.productType === 'lesson') {
    if (purchasedLessonIds.includes(normalizedItem.productId)) return true;
    if (normalizedItem.cursusId && purchasedCursusIds.includes(normalizedItem.cursusId)) return true;
    return false;
  }

  return false;
};

export const CartProvider = ({ children }) => {
  const authContext = useAuth();
  const user = authContext?.user ?? null;
  const authApi = authContext?.api ?? null;

  const [cart, setCart] = useState([]);
  const [cartMessage, setCartMessage] = useState({ type: '', text: '' });

  const clearMessage = () => {
    const duration = cartMessage.type === 'error' || cartMessage.type === 'warning' ? 5000 : 3000;
    setTimeout(() => setCartMessage({ type: '', text: '' }), duration);
  };

  const addToCart = async (item) => {
    setCartMessage({ type: '', text: '' });
    let normalized;
    try {
      normalized = normalizeItem(item);
    } catch (e) {
      setCartMessage({ type: 'error', text: e.message });
      clearMessage();
      return;
    }

    if (authContext?.isLoading || authContext?.isPurchasesLoading) {
      setCartMessage({ type: 'info', text: 'Veuillez patienter la vérification utilisateur.' });
      clearMessage();
      return;
    }

    try {
      const owned = await isItemOwned(normalized, user, authApi);
      if (owned) {
        setCartMessage({ type: 'warning', text: 'Vous possédez déjà ce produit.' });
        clearMessage();
        return;
      }
    } catch (err) {
      console.warn('Cart: isItemOwned error', err);
    }

    if (checkItemExistence(normalized, cart)) {
      setCartMessage({ type: 'warning', text: 'Produit déjà dans le panier.' });
      clearMessage();
      return;
    }

    if (normalized.productType === 'lesson' && isParentCurriculumInCart(normalized, cart)) {
      setCartMessage({ type: 'warning', text: 'Le cursus parent est déjà dans le panier.' });
      clearMessage();
      return;
    }

    if (normalized.productType === 'cursus' && hasAnyLessonInCart(normalized, cart)) {
      setCartMessage({ type: 'warning', text: 'Des leçons de ce cursus sont déjà dans le panier.' });
      clearMessage();
      return;
    }

    setCart(prev => {
      const finalItem = { ...normalized, cartItemId: Date.now() + Math.random().toString(36).slice(2,9) };
      const newCart = [...prev, finalItem];
      setCartMessage({ type: 'success', text: `${item.title ?? 'Produit'} ajouté au panier.` });
      clearMessage();
      return newCart;
    });
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => {
      const newCart = prev.filter(i => i.cartItemId !== cartItemId);
      setCartMessage({ type: 'success', text: 'Élément retiré du panier.' });
      clearMessage();
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    setCartMessage({ type: 'info', text: 'Panier vidé.' });
    clearMessage();
  };

  const isExactItemInCart = (itemToCheck) => {
    try {
      const normalized = normalizeItem(itemToCheck);
      return checkItemExistence(normalized, cart);
    } catch (e) {
      console.warn('isExactItemInCart error', e);
      return false;
    }
  };

  const total = cart.reduce((s, it) => s + Number(it.price || 0), 0);
  const totalFixed = Math.round(total * 100) / 100;

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, clearCart, isExactItemInCart,
      cartLoading: false, total: totalFixed, cartMessage
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans CartProvider');
  return ctx;
};