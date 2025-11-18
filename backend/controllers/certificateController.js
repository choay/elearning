// controllers/certificateController.js
const { Certificate, Cursus } = require('../models');

/**
 * 📜 Crée un certificat pour un utilisateur et un cursus donné.
 * (Utilisé en interne — ne renvoie pas de réponse HTTP directement)
 * @param {number} userId 
 * @param {number} cursusId 
 * @returns {Promise<Certificate|null>}
 */
const createCertificate = async (userId, cursusId) => {
  try {
    // Vérifie si un certificat existe déjà
    const existing = await Certificate.findOne({ where: { userId, cursusId } });
    if (existing) return null;

    // Crée un nouveau certificat
    return await Certificate.create({ userId, cursusId, issuedAt: new Date() });
  } catch (error) {
    console.error('Erreur lors de la création du certificat :', error);
    throw error;
  }
};

/**
 * 🪪 Génère un certificat via requête HTTP
 * (route POST /api/certificates/generate)
 */
const generateCertificate = async (req, res) => {
  const { userId, cursusId } = req.body;

  if (!userId || !cursusId) {
    return res.status(400).json({ status: 'error', message: 'userId et cursusId sont requis.' });
  }

  try {
    const certificate = await createCertificate(userId, cursusId);

    if (!certificate) {
      return res.status(400).json({ status: 'error', message: 'Certificat déjà existant.' });
    }

    // Récupère les infos complètes avec le Cursus associé
    const fullCert = await Certificate.findByPk(certificate.id, {
      include: [{ model: Cursus, as: 'Cursus', attributes: ['title'] }]
    });

    res.status(201).json({
      status: 'success',
      message: 'Certificat généré avec succès.',
      data: fullCert
    });
  } catch (error) {
    console.error('Erreur lors de la génération du certificat :', error);
    res.status(500).json({ status: 'error', message: 'Erreur serveur lors de la génération du certificat.' });
  }
};

/**
 * 👤 Récupère tous les certificats pour un utilisateur donné
 * (route GET /api/certificates/user/:userId)
 */
const getCertificatesByUserId = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ status: 'error', message: 'userId est requis.' });
  }

  try {
    const certificates = await Certificate.findAll({
      where: { userId },
      include: [{ model: Cursus, as: 'Cursus', attributes: ['title'] }]
    });

    res.status(200).json({
      status: 'success',
      data: certificates
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des certificats :', error);
    res.status(500).json({ status: 'error', message: 'Erreur serveur lors de la récupération des certificats.' });
  }
};

// 🧩 Export des fonctions contrôleur
module.exports = {
  getCertificatesByUserId,
  generateCertificate,
  createCertificate,
};
