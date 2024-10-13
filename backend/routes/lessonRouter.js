// routes/lessonRoutes.js
const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const authMiddleware = require('../middleware/authMiddleware');

// Obtenir toutes les leçons
router.get('/', lessonController.getAllLessons);

// Obtenir une leçon par ID
router.get('/:id', lessonController.getLessonById);

// Créer une nouvelle leçon (admin)
router.post('/', authMiddleware, lessonController.createLesson);

// Mettre à jour une leçon (admin)
router.put('/:id', authMiddleware, lessonController.updateLesson);

// Supprimer une leçon (admin)
router.delete('/:id', authMiddleware, lessonController.deleteLesson);

module.exports = router;
