// controllers/lessonController.js
const { Lesson, Cursus } = require('../models');

exports.getAllLessons = async (req, res) => {
  try {
    const lessons = await Lesson.findAll({
      // CORRECTION : Ajout de l'alias 'Cursus' pour l'Eager Loading (Résout l'erreur 500)
      include: [{ model: Cursus, as: 'Cursus' }], 
    });
    res.status(200).json(lessons);
  } catch (error) {
    console.error('Erreur lors de la récupération des leçons:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des leçons.' });
  }
};

exports.getLessonById = async (req, res) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findByPk(id, {
      // CORRECTION : Ajout de l'alias 'Cursus' pour l'Eager Loading (Résout l'erreur 500)
      include: [{ model: Cursus, as: 'Cursus' }],
    });
    if (!lesson) {
      return res.status(404).json({ message: 'Leçon non trouvée.' });
    }
    res.status(200).json(lesson);
  } catch (error) {
    console.error('Erreur lors de la récupération de la leçon:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la leçon.' });
  }
};

exports.createLesson = async (req, res) => {
  try {
    const { title, prix, videoUrl, description, cursusId } = req.body;
    
    // Vérification de l'existence du Cursus avant la création de la Leçon
    if (cursusId) {
      const cursus = await Cursus.findByPk(cursusId);
      if (!cursus) {
        return res.status(400).json({ message: 'ID de cursus invalide.' });
      }
    }
    
    const lesson = await Lesson.create({ title, prix, videoUrl, description, cursusId });
    res.status(201).json(lesson);
  } catch (error) {
    console.error('Erreur lors de la création de la leçon:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la leçon.' });
  }
};

exports.updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, prix, videoUrl, description, cursusId } = req.body;
    
    const lesson = await Lesson.findByPk(id);
    if (!lesson) {
      return res.status(404).json({ message: 'Leçon non trouvée.' });
    }
    
    // Vérification de l'existence du nouveau Cursus
    if (cursusId) {
      const cursus = await Cursus.findByPk(cursusId);
      if (!cursus) {
        return res.status(400).json({ message: 'ID de cursus invalide.' });
      }
      lesson.cursusId = cursusId;
    }
    
    lesson.title = title || lesson.title;
    lesson.prix = prix || lesson.prix;
    lesson.videoUrl = videoUrl || lesson.videoUrl;
    lesson.description = description || lesson.description;
    
    await lesson.save();
    res.status(200).json(lesson);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la leçon:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la leçon.' });
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Lesson.destroy({ where: { id } });
    
    if (!deleted) {
      return res.status(404).json({ message: 'Leçon non trouvée.' });
    }
    // Réponse 204 (No Content) pour une suppression réussie
    res.status(204).send();
  } catch (error) {
    console.error('Erreur lors de la suppression de la leçon:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la leçon.' });
  }
};