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

// 🏆 FONCTION handleCompleteLesson (AJOUTÉE ET CORRIGÉE) 🏆
// Cette fonction utilise req.user.id injecté par authMiddleware.
exports.handleCompleteLesson = async (req, res) => {
  // CORRECTION CRITIQUE : L'ID utilisateur vient du token (req.user.id), pas du corps (req.body)
  const userId = req.user.id; 
  // L'ID de la leçon vient toujours du corps de la requête client
  const { lessonId } = req.body; 

  if (!lessonId) {
    // Le userId est garanti par authMiddleware (ou devrait avoir renvoyé 401/403)
    return res.status(400).json({ message: "L'ID de la leçon est requis dans le corps de la requête." });
  }
  
  // Vérification de sécurité (bien que peu probable si authMiddleware passe)
  if (!userId) { 
     return res.status(401).json({ message: "Utilisateur non identifié après l'authentification." });
  }
  
  try {
    // Chercher la progression existante ou en créer une si elle n'existe pas
    const [progress, created] = await Progress.findOrCreate({
        where: { userId, lessonId },
        defaults: { completed: true, completionDate: new Date() }
    });
    
    // Si la progression existait déjà, on s'assure qu'elle est marquée comme terminée
    if (!created && !progress.completed) {
        progress.completed = true;
        progress.completionDate = new Date();
        await progress.save();
        return res.status(200).json({ message: "Leçon marquée comme terminée.", progress });
    } else if (progress.completed) {
        // Déjà complétée
        return res.status(200).json({ message: "Leçon déjà marquée comme terminée.", progress });
    }

    // Progression nouvellement créée
    return res.status(201).json({ message: "Progression créée et leçon marquée comme terminée.", progress });

  } catch (error) {
    console.error("Erreur lors de la complétion de la leçon:", error);
    res.status(500).json({ message: "Erreur interne du serveur lors de la complétion de la leçon." });
  }
};
// FIN DU FICHIER : controllers/progressController.js