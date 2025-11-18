// controllers/themeController.js
const { Theme, Cursus, PurchaseItem, Purchase } = require('../models');
const { Op } = require('sequelize');

exports.getAllThemes = async (req, res) => {
  try {
    const themes = await Theme.findAll({
      include: [{ model: Cursus, as: 'cursusList' }],
    });
    res.status(200).json(themes);
  } catch (error) {
    console.error('Erreur lors de la récupération des thèmes:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.getThemeById = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    let theme = await Theme.findByPk(id, {
      include: [{ model: Cursus, as: 'cursusList' }],
    });
    if (!theme) return res.status(404).json({ message: 'Thème non trouvé.' });

    if (userId && theme.cursusList?.length) {
      const cursusIds = theme.cursusList.map(c => c.id);

      const purchasedItems = await PurchaseItem.findAll({
        attributes: ['productId'],
        where: { productType: 'cursus', productId: { [Op.in]: cursusIds } },
        include: [
          { model: Purchase, as: 'ParentPurchase', where: { userId, status: 'paid' }, required: true }
        ],
        raw: true,
        group: ['PurchaseItem.productId']
      });

      const purchasedCursusIds = new Set(purchasedItems.map(i => i.productId));
      theme = theme.toJSON();
      theme.cursusList = theme.cursusList.map(c => ({
        ...c,
        isPurchased: purchasedCursusIds.has(c.id)
      }));
    }

    res.status(200).json(theme);
  } catch (error) {
    console.error('Erreur lors de la récupération du thème:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.createTheme = async (req, res) => {
  try {
    const { title, description, color } = req.body;
    const theme = await Theme.create({ title, description, color });
    res.status(201).json(theme);
  } catch (error) {
    console.error('Erreur création thème:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.updateTheme = async (req, res) => {
  try {
    const { id } = req.params;
    const theme = await Theme.findByPk(id);
    if (!theme) return res.status(404).json({ message: 'Thème non trouvé.' });

    const { title, description, color } = req.body;
    theme.title = title || theme.title;
    theme.description = description || theme.description;
    theme.color = color || theme.color;

    await theme.save();
    res.status(200).json(theme);
  } catch (error) {
    console.error('Erreur mise à jour thème:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.deleteTheme = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Theme.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ message: 'Thème non trouvé.' });

    res.status(204).send();
  } catch (error) {
    console.error('Erreur suppression thème:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};