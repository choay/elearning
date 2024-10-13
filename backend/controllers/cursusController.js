// controllers/cursusController.js
const { Cursus, Lesson, Theme } = require('../models');

exports.getAllCursuses = async (req, res) => {
  try {
    const cursuses = await Cursus.findAll({
      include: [
        { model: Lesson, as: 'lessons' },
        { model: Theme },
      ],
    });
    res.status(200).json(cursuses);
  } catch (error) {
    console.error('Erreur lors de la récupération des cursus:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des cursus.' });
  }
};

exports.getCursusById = async (req, res) => {
  try {
    const { id } = req.params;
    const cursus = await Cursus.findByPk(id, {
      include: [
        { model: Lesson, as: 'lessons' },
        { model: Theme },
      ],
    });
    if (!cursus) {
      return res.status(404).json({ message: 'Cursus non trouvé.' });
    }
    res.status(200).json(cursus);
  } catch (error) {
    console.error('Erreur lors de la récupération du cursus:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du cursus.' });
  }
};

exports.createCursus = async (req, res) => {
  try {
    const { title, prix, themeId } = req.body;
    const theme = await Theme.findByPk(themeId);
    if (!theme) {
      return res.status(400).json({ message: 'ID de thème invalide.' });
    }
    const cursus = await Cursus.create({ title, prix, themeId });
    res.status(201).json(cursus);
  } catch (error) {
    console.error('Erreur lors de la création du cursus:', error);
    res.status(500).json({ message: 'Erreur lors de la création du cursus.' });
  }
};

exports.updateCursus = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, prix, themeId } = req.body;
    const cursus = await Cursus.findByPk(id);
    if (!cursus) {
      return res.status(404).json({ message: 'Cursus non trouvé.' });
    }
    if (themeId) {
      const theme = await Theme.findByPk(themeId);
      if (!theme) {
        return res.status(400).json({ message: 'ID de thème invalide.' });
      }
      cursus.themeId = themeId;
    }
    cursus.title = title || cursus.title;
    cursus.prix = prix || cursus.prix;
    await cursus.save();
    res.status(200).json(cursus);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du cursus:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du cursus.' });
  }
};

exports.deleteCursus = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Cursus.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Cursus non trouvé.' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erreur lors de la suppression du cursus:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du cursus.' });
  }
};
