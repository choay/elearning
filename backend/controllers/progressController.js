// backend/controllers/progressController.js
const { Progress, Lesson } = require('../models');
const { Op } = require('sequelize');
const certificateController = require('./certificateController'); // expose createCertificate

exports.getProgressByUserAndLesson = async (req, res) => {
  try {
    const { userId, lessonId } = req.params;
    if (!userId || !lessonId) return res.status(400).json({ message: 'userId et lessonId requis.' });

    const progress = await Progress.findOne({ where: { userId: Number(userId), lessonId: Number(lessonId) } });
    if (!progress) return res.status(404).json({ message: 'Progression non trouvée.' });
    return res.status(200).json(progress);
  } catch (err) {
    console.error('Erreur getProgressByUserAndLesson:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.createProgress = async (req, res) => {
  try {
    const { userId, lessonId, completed = false, currentTime = 0 } = req.body;
    if (!userId || !lessonId) return res.status(400).json({ message: 'userId et lessonId requis.' });

    let progress = await Progress.findOne({ where: { userId: Number(userId), lessonId: Number(lessonId) } });
    if (progress) return res.status(200).json(progress);

    progress = await Progress.create({ userId: Number(userId), lessonId: Number(lessonId), completed: !!completed, currentTime: Number(currentTime) });
    return res.status(201).json(progress);
  } catch (err) {
    console.error('Erreur createProgress:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const { userId, lessonId } = req.params;
    const { completed, currentTime } = req.body;
    if (!userId || !lessonId) return res.status(400).json({ message: 'userId et lessonId requis.' });

    const progress = await Progress.findOne({ where: { userId: Number(userId), lessonId: Number(lessonId) } });
    if (!progress) return res.status(404).json({ message: 'Progression non trouvée.' });

    progress.completed = (completed !== undefined) ? !!completed : progress.completed;
    progress.currentTime = (currentTime !== undefined) ? Number(currentTime) : progress.currentTime;
    await progress.save();
    return res.status(200).json(progress);
  } catch (err) {
    console.error('Erreur updateProgress:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Marque la leçon comme complétée, puis crée un certificat si l'utilisateur a complété toutes les leçons du cursus parent.
exports.handleCompleteLesson = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { lessonId } = req.body;
    if (!userId || !lessonId) return res.status(400).json({ message: 'userId et lessonId requis.' });

    // 1) create or update progress
    const [progress, created] = await Progress.findOrCreate({
      where: { userId, lessonId },
      defaults: { userId, lessonId, completed: true, completionDate: new Date() }
    });
    if (!created && !progress.completed) {
      progress.completed = true;
      progress.completionDate = new Date();
      await progress.save();
    }

    // 2) get cursusId
    const lesson = await Lesson.findByPk(lessonId, { attributes: ['cursusId'] });
    if (!lesson || !lesson.cursusId) {
      return res.status(200).json({ message: 'Leçon complétée (pas de cursus associé)', progress });
    }
    const cursusId = lesson.cursusId;

    // 3) compute completion status
    const cursusLessons = await Lesson.findAll({ where: { cursusId }, attributes: ['id'] });
    const totalLessonIds = cursusLessons.map(l => l.id);
    const total = totalLessonIds.length;

    const completedCount = await Progress.count({
      where: { userId, completed: true, lessonId: { [Op.in]: totalLessonIds } }
    });

    if (total > 0 && completedCount === total) {
      // createCertificate returns Certificate instance or null if exists
      const cert = await certificateController.createCertificate(userId, cursusId);
      if (cert) {
        return res.status(201).json({ message: 'Cursus terminé et certificat généré.', progress, certificate: cert });
      } else {
        return res.status(200).json({ message: 'Cursus déjà complété (certificat existant).', progress });
      }
    }

    const remaining = total - completedCount;
    return res.status(200).json({ message: `Leçon complétée. Il reste ${remaining} leçon(s).`, progress });
  } catch (err) {
    console.error('Erreur handleCompleteLesson:', err);
    return res.status(500).json({ message: 'Erreur interne lors de la complétion.' });
  }
};