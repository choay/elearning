const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Test simple
router.get('/test', (req, res) => {
  res.json({ status: 'User Router OK' });
});

// Utilisateur
router.get('/:id', protect, userController.getUser);
router.put('/:id', protect, userController.updateUser);
router.delete('/:id', protect, authorize(['admin']), userController.deleteUser);

// Contenu acheté
router.get('/:userId/purchased-content', protect, userController.getPurchasedContent);

module.exports = router;
