const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { protect } = require('../middleware/authMiddleware');

// 🧾 Récupérer tous les certificats d’un utilisateur
router.get('/user/:userId', protect, certificateController.getCertificatesByUserId);

// 🪪 Générer un certificat pour un cursus
router.post('/generate', protect, certificateController.generateCertificate);

module.exports = router;
