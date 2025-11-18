// src/pages/Cart.js
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Mail, X, CheckCircle, Loader } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Cart() {
    const { cart, clearCart, removeFromCart, total } = useCart();
    const { user, fetchUserAndRefresh, api } = useAuth();

    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else {
            setEmail(user.email || '');
        }
    }, [user, navigate]);

    // helper to fetch product price from backend when missing
    const fetchProductPrice = async (id, type) => {
        try {
            const endpoint = type === 'Cursus' ? `/api/cursus/${id}` : `/api/lessons/${id}`;
            if (api) {
                const resp = await api.get(endpoint);
                const data = resp.data;
                return Number(data.price ?? data.prix ?? data.prix_ttc ?? 0);
            } else {
                const resp = await fetch(`${API_URL}${endpoint}`, {
                    credentials: 'include',
                });
                if (!resp.ok) return 0;
                const data = await resp.json();
                return Number(data.price ?? data.prix ?? data.prix_ttc ?? 0);
            }
        } catch (err) {
            console.error('fetchProductPrice err:', err);
            return 0;
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!user || !stripe || !elements || cart.length === 0) {
            setError('Panier vide, utilisateur non connecté ou initialisation du paiement échouée.');
            return;
        }

        if (total <= 0) {
            setError('Le montant total est de 0 €. Veuillez vérifier vos articles.');
            return;
        }

        setLoading(true);

        // Préparer les ids pour create-payment-intent
        const cursusIds = cart.filter(i => i.productType === 'cursus').map(i => Number(i.productId));
        const lessonIds = cart.filter(i => i.productType === 'lesson').map(i => Number(i.productId));

        try {
            // 1) création du PaymentIntent
            const createResp = await (api ? api.post('/api/purchases/create-payment-intent', { cursusIds, lessonIds }) :
                (await fetch(`${API_URL}/api/purchases/create-payment-intent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ cursusIds, lessonIds })
                })).json()
            );

            const clientSecret = createResp.data ? createResp.data.clientSecret : createResp.clientSecret || createResp.client_secret;
            if (!clientSecret) {
                throw new Error('Impossible de créer le Payment Intent (clientSecret manquant).');
            }

            // 2) confirmation côté client avec Stripe
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: { email: user.email }
                }
            });

            if (result.error) {
                setError(result.error.message || 'Erreur lors de la confirmation du paiement.');
                setLoading(false);
                return;
            }

            // 3) préparer les items confirmés avec prix valides
            // itemsToConfirm : inclure id, type et price
            const itemsToConfirm = [];
            for (const item of cart) {
                const id = Number(item.productId);
                const type = item.productType === 'cursus' ? 'Cursus' : 'Lesson';
                let price = Number(item.price ?? item.prix ?? 0);

                if (!price || price <= 0) {
                    // récupérer le prix depuis le backend
                    price = await fetchProductPrice(id, type);
                }

                if (!price || price <= 0) {
                    throw new Error(`Prix invalide pour le produit ${type} ID ${id}. Transaction annulée.`);
                }

                itemsToConfirm.push({ id, type, price });
            }

            // 4) confirmation côté serveur (sauvegarde de la commande)
            if (api) {
                await api.post('/api/purchases/confirm-payment', {
                    paymentIntentId: result.paymentIntent.id,
                    items: itemsToConfirm
                });
            } else {
                await fetch(`${API_URL}/api/purchases/confirm-payment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        paymentIntentId: result.paymentIntent.id,
                        items: itemsToConfirm
                    })
                });
            }

            // refresh user purchases / owned lists
            if (fetchUserAndRefresh) await fetchUserAndRefresh();

            setSuccess(true);
            clearCart();

            setTimeout(() => navigate('/confirmation'), 1200);
        } catch (err) {
            console.error('Erreur paiement:', err);
            setError(err.response?.data?.message || err.message || 'Erreur de paiement. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    const CartItemCard = ({ item }) => (
        <div className="flex justify-between items-center p-4 bg-white border-b hover:bg-gray-50">
            <div className="flex-1 pr-4">
                <h3 className="font-semibold truncate">{item.title}</h3>
                <p className={`text-xs mt-1 ${item.productType === 'lesson' ? 'text-indigo-500' : 'text-purple-600'}`}>
                    {item.productType === 'lesson' ? 'Leçon' : 'Cursus complet'}
                </p>
            </div>
            <div className="flex items-center gap-4">
                <span className="font-bold text-green-600">{(item.price ?? item.prix ?? 0).toFixed(2)} €</span>
                <button onClick={() => removeFromCart(item.cartItemId)} className="text-red-500 hover:text-red-700">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );

    return (
        <div className="pt-20 min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-6">
                <div className="mb-8 flex justify-between items-center">
                    <h1 className="text-4xl font-bold flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-indigo-600" /> Finaliser l'achat
                    </h1>
                    {cart.length > 0 && (
                        <button onClick={clearCart} className="text-red-500 flex items-center gap-1 hover:text-red-700 transition">
                            <Trash2 className="w-4 h-4" /> Vider le panier
                        </button>
                    )}
                </div>

                {cart.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow">
                        <p className="text-2xl font-bold">Votre panier est vide</p>
                        <button onClick={() => navigate('/')} className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                            Découvrir les cours
                        </button>
                    </div>
                ) : (
                    <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                        <div className="lg:col-span-2 bg-white rounded-xl shadow divide-y">
                            {cart.map(item => <CartItemCard key={item.cartItemId} item={item} />)}
                        </div>

                        <div className="mt-10 lg:mt-0">
                            <div className="sticky top-24 bg-white p-6 rounded-xl shadow-2xl border-t-4 border-indigo-600">
                                <h2 className="text-xl font-bold mb-6">Résumé de la commande</h2>
                                <div className="border-t pt-4 mb-6">
                                    <div className="flex justify-between text-2xl font-bold">
                                        <span>Total</span>
                                        <span className="text-indigo-600">{total.toFixed(2)} €</span>
                                    </div>
                                </div>

                                <form onSubmit={handlePayment} className="space-y-6">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                            <Mail className="w-4 h-4" /> Email
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            required
                                            readOnly
                                            className="w-full p-3 border border-gray-300 bg-gray-100 rounded-lg mt-2 cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700">Informations de carte</label>
                                        <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg mt-2">
                                            <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !stripe || total <= 0}
                                        className="w-full py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 flex justify-center items-center gap-3 transition"
                                    >
                                        {loading ? <Loader className="w-5 h-5 animate-spin" /> : `PAYER ${total.toFixed(2)} €`}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 z-50">
                        <X className="w-6 h-6" /> {error}
                    </div>
                )}

                {success && (
                    <div className="fixed bottom-4 right-4 bg-green-600 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 z-50">
                        <CheckCircle className="w-6 h-6" /> Paiement réussi ! Redirection...
                    </div>
                )}
            </div>
        </div>
    );
}

export default Cart;