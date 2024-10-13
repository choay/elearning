const express = require('express');
const router = express.Router();
const themeController = require('../controllers/themeController');
const cursusController = require('../controllers/cursusController');
const lessonController = require('../controllers/lessonController');
const certificatController = require('../controllers/certificatController');
const achatController = require('../controllers/achatController');
const userController = require('../controllers/userController');

// Routes pour les thèmes
router.get('/themes/:id', themeController.getThemeById);

// Routes pour les cursus
router.get('/cursus/:id', cursusController.getCursusById);

// Routes pour les leçons
router.get('/lessons/:id', lessonController.getLessonById);

// Routes pour les certificats
router.get('/certificates/:id', certificatController.getCertificatById);
router.post('/certificates', certificatController.createCertificat);
router.put('/certificates/:id', certificatController.updateCertificat);
router.delete('/certificates/:id', certificatController.deleteCertificat);

// Routes pour les achats
router.get('/achats/:id', achatController.getAchatById);
router.post('/achats', achatController.createAchat);
router.put('/achats/:id', achatController.updateAchat);
router.delete('/achats/:id', achatController.deleteAchat);

// Routes pour les utilisateurs
router.get('/users/:id', userController.getUserById);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

module.exports = router;
