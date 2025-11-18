// routes/progressRouter.js
const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

router.post('/complete', protect, progressController.handleCompleteLesson);
router.post('/', protect, progressController.createProgress);
router.put('/:userId/:lessonId', protect, progressController.updateProgress);
router.get('/:userId/:lessonId', protect, progressController.getProgressByUserAndLesson);

module.exports = router;