// routes/achats.js (REPRISE DE LA VERSION CORRIGÉE)

const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const protect = require('../middleware/authMiddleware');

// Pas de routes /cart

router.post('/create-payment-intent', protect, purchaseController.createPaymentIntent);
router.post('/confirm-payment', protect, purchaseController.confirmPayment);
router.get('/user/:userId', protect, purchaseController.getPurchasesByUserId);

module.exports = router;