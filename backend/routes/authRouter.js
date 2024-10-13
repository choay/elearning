// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware'); // Middleware pour vérifier le token JWT

// Inscription
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  ],
  authController.register
);

// Activation de compte
router.get('/activate/:token', authController.activateAccount);

// Connexion
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').exists().withMessage('Le mot de passe est requis'),
  ],
  authController.login
);

// Obtenir l'utilisateur actuel
router.get('/me', authMiddleware, authController.getCurrentUser);

// Déconnexion
router.post('/logout', authController.logout);

module.exports = router;
