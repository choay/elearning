// src/pages/Cart.js
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Mail, X, CheckCircle, Loader } from 'lucide-react';

// URL API (même que AuthContext)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Cart() {
    const { cart, clearCart, removeFromCart, total } = useCart();
    const { user } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) navigate('/login');
        else setEmail(user.email || '');
    }, [user, navigate]);

    const handlePayment = async (e) => {
        e.preventDefault();
        if (!user || !stripe || !elements || cart.length === 0 || total <= 0) {
            setError('Panier vide ou erreur de paiement.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess(false);

        const cursusIds = [...new Set(cart.filter(i => i.productType === 'cursus').map(i => i.productId))];
        const lessonIds = [...new Set(cart.filter(i => i.productType === 'lesson').map(i => i.productId))];

        try {
            const { data } = await axios.post(`${API_URL}/api/achats/create-payment-intent`, 
                { cursusIds, lessonIds },
                { withCredentials: true }
            );

            const result = await stripe.confirmCardPayment(data.clientSecret, {
                payment_method: { 
                    card: elements.getElement(CardElement), 
                    billing_details: { email: user.email } 
                }
            });

            if (result.error) {
                setError(result.error.message);
                setLoading(false);
                return;
            }

            if (result.paymentIntent.status === 'succeeded') {
                await axios.post(`${API_URL}/api/achats/confirm-payment`, {
                    paymentIntentId: result.paymentIntent.id,
                    userId: user.id,
                    cursusIds,
                    lessonIds
                }, { withCredentials: true });

                setSuccess(true);
                clearCart();
                setTimeout(() => navigate('/profile'), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur paiement.');
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
                <span className="font-bold text-green-600">{item.price.toFixed(2)} €</span>
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
                        <ShoppingCart className="w-8 h-8 text-indigo-600" /> Finaliser
                    </h1>
                    {cart.length > 0 && (
                        <button onClick={clearCart} className="text-red-500 flex items-center gap-1">
                            <Trash2 className="w-4 h-4" /> Vider
                        </button>
                    )}
                </div>

                {cart.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow">
                        <p className="text-2xl font-bold">Panier vide</p>
                        <button onClick={() => navigate('/')} className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-lg">
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
                                <h2 className="text-xl font-bold mb-6">Paiement</h2>
                                <div className="border-t pt-4 mb-6">
                                    <div className="flex justify-between text-2xl font-bold">
                                        <span>Total</span>
                                        <span className="text-indigo-600">{total.toFixed(2)} €</span>
                                    </div>
                                </div>

                                <form onSubmit={handlePayment} className="space-y-6">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-bold">
                                            <Mail className="w-4 h-4" /> Email
                                        </label>
                                        <input 
                                            type="email" 
                                            value={email} 
                                            onChange={e => setEmail(e.target.value)} 
                                            required 
                                            className="w-full p-3 border rounded-lg mt-2" 
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold">Carte</label>
                                        <div className="p-3 bg-gray-50 border rounded-lg mt-2">
                                            <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !stripe}
                                        className="w-full py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 flex justify-center items-center gap-3"
                                    >
                                        {loading ? <Loader className="w-5 h-5 animate-spin" /> : `PAYER ${total.toFixed(2)} €`}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-2xl flex items-center gap-3">
                        <X className="w-6 h-6" /> {error}
                    </div>
                )}

                {success && (
                    <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-2xl flex items-center gap-3">
                        <CheckCircle className="w-6 h-6" /> Paiement réussi ! Redirection...
                    </div>
                )}
            </div>
        </div>
    );
}

export default Cart;