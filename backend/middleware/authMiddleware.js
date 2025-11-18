// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * attachUser : middleware non‑bloquant qui attache req.user si un token valide est présent.
 * N'empêche pas l'accès si pas de token.
 */
const attachUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const tokenFromCookie = req.cookies?.accessToken || null;
    const token = tokenFromHeader || tokenFromCookie;
    if (!token) return next();

    const secret = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET;
    if (!secret) return next();

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return next();
    }

    const user = await User.findByPk(decoded.id);
    if (!user || user.isActive === false) return next();

    req.user = { id: user.id, email: user.email, role: user.role };
    return next();
  } catch (err) {
    console.error('[attachUser] error', err);
    return next();
  }
};

/**
 * protect (existant) : middleware bloquant (requiert token)
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const tokenFromCookie = req.cookies?.accessToken || null;
    const token = tokenFromHeader || tokenFromCookie;
    if (!token) return res.status(401).json({ message: 'Non autorisé, pas de jeton.' });

    const secret = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET;
    if (!secret) return res.status(500).json({ message: 'Configuration serveur manquante.' });

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ message: 'Token invalide ou expiré.' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ message: 'Utilisateur non trouvé.' });
    if (user.isActive === false) return res.status(403).json({ message: 'Compte non activé.' });

    req.user = { id: user.id, email: user.email, role: user.role };
    return next();
  } catch (err) {
    console.error('[protect] error', err);
    return res.status(500).json({ message: 'Erreur serveur middleware auth.' });
  }
};

const authorize = (roles = []) => {
  if (typeof roles === 'string') roles = [roles];
  return (req, res, next) => {
    if (roles.length && (!req.user || !roles.includes(req.user.role))) {
      return res.status(403).json({ message: 'Accès non autorisé.' });
    }
    next();
  };
};

module.exports = { attachUser, protect, authorize };