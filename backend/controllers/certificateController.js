// controllers/certificateController.js
const { Certificate, User, Cursus } = require('../models');

exports.getCertificatesByUserId = async (req, res) => {
  const { userId } = req.params;
  try {
    const certificates = await Certificate.findAll({
      where: { userId },
      include: [{ model: Cursus }],
    });
    res.status(200).json(certificates);
  } catch (error) {
    console.error('Erreur lors de la récupération des certificats:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des certificats.' });
  }
};

exports.generateCertificate = async (req, res) => {
  const { userId, cursusId } = req.body;
  try {
    const user = await User.findByPk(userId);
    const cursus = await Cursus.findByPk(cursusId);

    if (!user || !cursus) {
      return res.status(400).json({ message: 'ID utilisateur ou cursus invalide.' });
    }

    const existingCertificate = await Certificate.findOne({
      where: { userId, cursusId },
    });

    if (existingCertificate) {
      return res.status(400).json({ message: 'Le certificat existe déjà.' });
    }

    const certificate = await Certificate.create({
      userId,
      cursusId,
      issuedAt: new Date(),
    });

    res.status(201).json(certificate);
  } catch (error) {
    console.error('Erreur lors de la génération du certificat:', error);
    res.status(500).json({ message: 'Erreur lors de la génération du certificat.' });
  }
};
