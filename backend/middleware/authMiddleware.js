// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
  let token;

  // 1. Récupérer le token depuis Authorization: Bearer
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Si pas de token → 401
  if (!token) {
    return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
  }

  try {
    // 3. Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Trouver l'utilisateur
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Compte non activé.' });
    }

    // 5. Ajouter l'utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email
    };

    next();
  } catch (error) {
    console.error('Token invalide:', error.message);
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
};

module.exports = protect;