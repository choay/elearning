// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Obtenir un utilisateur (admin ou utilisateur connecté)
router.get('/:id', authMiddleware, userController.getUser);

// Mettre à jour un utilisateur (admin ou utilisateur connecté)
router.put('/:id', authMiddleware, userController.updateUser);

// Supprimer un utilisateur (admin)
router.delete('/:id', authMiddleware, userController.deleteUser);

module.exports = router;
