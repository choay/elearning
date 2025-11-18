const express = require('express');
const router = express.Router();
const cursusController = require('../controllers/cursusController');

// Liste tous les cursus
router.get('/', cursusController.getAllCursus);

// Récupère un cursus par id
router.get('/:id', cursusController.getCursusById);

module.exports = router;