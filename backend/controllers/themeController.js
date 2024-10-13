// controllers/themeController.js
const { Theme, Cursus } = require('../models');

exports.getAllThemes = async (req, res) => {
  try {
    const themes = await Theme.findAll({
      include: [{ model: Cursus }],
    });
    res.status(200).json(themes);
  } catch (error) {
    console.error('Erreur lors de la récupération des thèmes:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des thèmes.' });
  }
};

exports.getThemeById = async (req, res) => {
  try {
    const { id } = req.params;
    const theme = await Theme.findByPk(id, {
      include: [{ model: Cursus }],
    });
    if (!theme) {
      return res.status(404).json({ message: 'Thème non trouvé.' });
    }
    res.status(200).json(theme);
  } catch (error) {
    console.error('Erreur lors de la récupération du thème:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du thème.' });
  }
};

exports.createTheme = async (req, res) => {
  try {
    const { title, description, color } = req.body;
    const theme = await Theme.create({ title, description, color });
    res.status(201).json(theme);
  } catch (error) {
    console.error('Erreur lors de la création du thème:', error);
    res.status(500).json({ message: 'Erreur lors de la création du thème.' });
  }
};

exports.updateTheme = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, color } = req.body;
    const theme = await Theme.findByPk(id);
    if (!theme) {
      return res.status(404).json({ message: 'Thème non trouvé.' });
    }
    theme.title = title || theme.title;
    theme.description = description || theme.description;
    theme.color = color || theme.color;
    await theme.save();
    res.status(200).json(theme);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du thème:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du thème.' });
  }
};

exports.deleteTheme = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Theme.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Thème non trouvé.' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erreur lors de la suppression du thème:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du thème.' });
  }
};
