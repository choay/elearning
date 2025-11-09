// routes/progressRoutes.js
const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const authMiddleware = require('../middleware/authMiddleware');

// Obtenir la progression d'un utilisateur pour une leçon
router.get('/user/:userId/lesson/:lessonId', authMiddleware, progressController.getProgressByUserAndLesson);

// Créer une nouvelle progression
router.post('/', authMiddleware, progressController.createProgress);

// 🏆 AJOUT DE LA ROUTE MANQUANTE (Pour marquer une leçon comme complétée)
router.post('/complete', authMiddleware, progressController.handleCompleteLesson);

// Mettre à jour la progression d'un utilisateur pour une leçon
router.put('/user/:userId/lesson/:lessonId', authMiddleware, progressController.updateProgress);

module.exports = router;