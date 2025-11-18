const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Importation du middleware
const purchaseController = require('../controllers/purchaseController');

// Middleware pour restreindre l'accès aux achats de l'utilisateur (optionnel, mais inclus)
const restrictToOwnUser = (req, res, next) => {
    if (req.user && req.params.userId && req.user.id.toString() !== req.params.userId.toString()) {
        return res.status(403).json({ message: "Accès refusé. Vous ne pouvez consulter que vos propres achats." });
    }
    next();
};

// --- ROUTES PRINCIPALES ---

// 1. Création de l'intention de paiement (Nécessite AUTH)
router.post(
    '/create-payment-intent',
    protect,
    purchaseController.createPaymentIntent
);

// 2. Confirmation du paiement (Nécessite AUTH)
router.post(
    '/confirm-payment',
    protect,
    purchaseController.confirmPayment
);

// 3. Récupération des achats de l'utilisateur connecté (Nécessite AUTH)
router.get(
    '/',
    protect,
    purchaseController.getPurchasesByUserId
);

// 4. Ancienne route sécurisée pour récupérer les achats par ID utilisateur (Nécessite AUTH + Restriction)
router.get(
    '/user/:userId',
    protect,
    restrictToOwnUser,
    purchaseController.getPurchasesByUserId
);

// routes/purchaseRoutes.js (ajoute cette ligne)

router.get('/user/:userId/purchased-content', protect, purchaseController.getPurchasedContent);

module.exports = router;