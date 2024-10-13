// routes/certificateRoutes.js
const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const authMiddleware = require('../middleware/authMiddleware');

// Obtenir les certificats d'un utilisateur
router.get('/user/:userId', authMiddleware, certificateController.getCertificatesByUserId);

// Générer un certificat
router.post('/', authMiddleware, certificateController.generateCertificate);

module.exports = router;
