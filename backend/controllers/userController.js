// backend/controllers/userController.js
const purchaseController = require('./purchaseController');
const { User } = require('../models');

/**
 * Retourne les informations publiques d'un utilisateur
 */
exports.getUser = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requis.' });
    const u = await User.findByPk(id, { attributes: ['id', 'email', 'name', 'role'] });
    if (!u) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    res.json(u);
  } catch (err) {
    console.error('getUser error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

/**
 * Met à jour un utilisateur (restreindre côté route si besoin)
 */
exports.updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requis.' });
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    const { email, name } = req.body;
    if (email) user.email = email;
    if (name) user.name = name;
    await user.save();
    res.json({ message: 'Utilisateur mis à jour.', user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

/**
 * Supprime un utilisateur (admin)
 */
exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requis.' });
    const deleted = await User.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    res.status(204).send();
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

/**
 * Délégation: retourne le contenu acheté par un utilisateur.
 * Utilisé par la route GET /api/users/:userId/purchased-content
 * On appelle la fonction du purchaseController pour garder la logique au même endroit.
 */
exports.getPurchasedContent = async (req, res) => {
  try {

     if (!req.user || String(req.user.id) !== String(req.params.userId)) {
       return res.status(403).json({ message: 'Accès refusé.' });
     }

    // Délègue la responsabilité au purchaseController
    return purchaseController.getPurchasedContent(req, res);
  } catch (err) {
    console.error('userController.getPurchasedContent error:', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération du contenu.' });
  }
};