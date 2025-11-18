const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

// Protéger /me pour s'assurer que req.user est défini par le middleware
router.get('/me', protect, authController.getCurrentUser);
router.get('/activate/:token', authController.activateAccount);

module.exports = router;