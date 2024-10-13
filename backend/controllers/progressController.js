// controllers/progressController.js
const { Progress } = require('../models');

exports.getProgressByUserAndLesson = async (req, res) => {
  const { userId, lessonId } = req.params;
  try {
    const progress = await Progress.findOne({
      where: { userId, lessonId },
    });

    if (!progress) {
      return res.status(404).json({ message: 'Progression non trouvée.' });
    }
    res.status(200).json(progress);
  } catch (error) {
    console.error('Erreur lors de la récupération de la progression:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la progression.' });
  }
};

exports.createProgress = async (req, res) => {
  const { userId, lessonId, completed = false, currentTime = 0 } = req.body;
  
  try {
    // Vérifiez si la progression existe déjà
    let progress = await Progress.findOne({
      where: { userId, lessonId },
    });

    if (progress) {
      // Si la progression existe déjà, renvoyez-la
      return res.status(200).json(progress);
    }

    // Si la progression n'existe pas, créez-en une nouvelle
    progress = await Progress.create({ userId, lessonId, completed, currentTime });
    res.status(201).json(progress);
  } catch (error) {
    console.error('Erreur lors de la création de la progression:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la progression.' });
  }
};

exports.updateProgress = async (req, res) => {
  const { userId, lessonId } = req.params;
  const { completed, currentTime } = req.body;
  try {
    let progress = await Progress.findOne({
      where: { userId, lessonId },
    });

    if (!progress) {
      return res.status(404).json({ message: 'Progression non trouvée.' });
    }

    progress.completed = completed !== undefined ? completed : progress.completed;
    progress.currentTime = currentTime !== undefined ? currentTime : progress.currentTime;
    await progress.save();

    res.status(200).json(progress);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la progression:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la progression.' });
  }
};
