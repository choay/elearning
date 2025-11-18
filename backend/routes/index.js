const express = require('express');
const router = express.Router();

const authRoutes = require('./authRouter');
const themeRoutes = require('./themeRouter');
const cursusRoutes = require('./cursusRouter');
const lessonRoutes = require('./lessonRouter');
const purchaseRoutes = require('./purchaseRoutes');
const certificateRoutes = require('./certificateRouter');
const userRoutes = require('./userRoutes');

router.use('/auth', authRoutes);
router.use('/themes', themeRoutes);
router.use('/cursus', cursusRoutes);
router.use('/lessons', lessonRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/certificates', certificateRoutes);
router.use('/users', userRoutes);

module.exports = router;
