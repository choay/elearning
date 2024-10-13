// routes/purchaseRoutes.js
const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const authMiddleware = require('../middleware/authMiddleware');

// Créer un PaymentIntent
router.post('/create-payment-intent', authMiddleware, purchaseController.createPaymentIntent);

// Confirmer le paiement
router.post('/confirm-payment', authMiddleware, purchaseController.confirmPayment);

// Obtenir les achats d'un utilisateur
router.get('/user/:userId', authMiddleware, purchaseController.getPurchasesByUserId);

module.exports = router;
