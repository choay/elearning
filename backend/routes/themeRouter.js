const express = require('express');
const router = express.Router();
const themeController = require('../controllers/themeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', themeController.getAllThemes);
router.get('/:id', themeController.getThemeById);

router.post('/', protect, authorize('admin'), themeController.createTheme);
router.put('/:id', protect, authorize('admin'), themeController.updateTheme);
router.delete('/:id', protect, authorize('admin'), themeController.deleteTheme);

module.exports = router;
