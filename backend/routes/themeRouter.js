// routes/themeRoutes.js
const express = require('express');
const router = express.Router();
const themeController = require('../controllers/themeController');
const authMiddleware = require('../middleware/authMiddleware');

// Obtenir tous les thèmes
router.get('/', themeController.getAllThemes);

// Obtenir un thème par ID
router.get('/:id', themeController.getThemeById);

// Créer un nouveau thème (admin)
router.post('/', authMiddleware, themeController.createTheme);

// Mettre à jour un thème (admin)
router.put('/:id', authMiddleware, themeController.updateTheme);

// Supprimer un thème (admin)
router.delete('/:id', authMiddleware, themeController.deleteTheme);

module.exports = router;
