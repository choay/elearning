// routes/cursusRoutes.js
const express = require('express');
const router = express.Router();
const cursusController = require('../controllers/cursusController');
const authMiddleware = require('../middleware/authMiddleware');


// Obtenir tous les cursus
router.get('/', cursusController.getAllCursuses);

// Obtenir un cursus par ID
router.get('/:id', cursusController.getCursusById);

// Créer un nouveau cursus (admin)
router.post('/', authMiddleware, cursusController.createCursus);

// Mettre à jour un cursus (admin)
router.put('/:id', authMiddleware, cursusController.updateCursus);

// Supprimer un cursus (admin)
router.delete('/:id', authMiddleware, cursusController.deleteCursus);

module.exports = router;
