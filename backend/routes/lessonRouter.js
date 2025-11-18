// backend/routes/lessonRouter.js
const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { attachUser, protect } = require('../middleware/authMiddleware');

// Public GETs but attachUser attaches req.user if token present
router.get('/', attachUser, lessonController.getAllLessons);
router.get('/:id', attachUser, lessonController.getLessonById);

// Mark as completed requires auth
router.post('/:lessonId/complete', protect, lessonController.markLessonAsCompleted);

module.exports = router;