import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const PaymentButton = () => {
  const handleCheckout = async () => {
    try {
      const { data } = await axios.post('/api/achats/checkout', {
        items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Produit Exemple',
              },
              unit_amount: 2000, // Amount in cents (20 EUR)
            },
            quantity: 1,
          },
        ],
      });

      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId: data.id });

      if (error) {
        console.error('Erreur lors du redirectionnement vers Stripe Checkout:', error);
      }
    } catch (error) {
      console.error('Erreur lors de la création de la session de paiement:', error);
    }
  };

  return (
    <button onClick={handleCheckout}>
      Payer avec Stripe
    </button>
  );
};

export default PaymentButton;
