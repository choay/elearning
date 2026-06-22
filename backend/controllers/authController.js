const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, RefreshToken } = require('../models');
const crypto = require('crypto');
const { Op } = require('sequelize');

// Importation directe et propre de la fonction d'envoi
const sendActivationEmail = require('../utils/sendEmail');

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const accessTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  path: '/',
  maxAge: 15 * 60 * 1000,
};

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email et mot de passe requis' });

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'Utilisateur déjà existant' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const activationToken = crypto.randomBytes(24).toString('hex');
    const activationExpires = Date.now() + 24 * 60 * 60 * 1000;

    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
      role: 'user',
      isActive: process.env.AUTO_ACTIVATE === 'true',
      activationToken,
      activationExpires,
    });

    if (!newUser.isActive && typeof sendActivationEmail === 'function') {
      try { 
        await sendActivationEmail(newUser.email, activationToken); 
        console.log(`[register] ✅ Appel de la fonction d'envoi d'email pour ${newUser.email}`);
      } catch (e) { 
        console.warn('[register] ❌ Erreur lors de l\'envoi :', e.message || e); 
      }
    }

    res.status(201).json({ message: 'Utilisateur créé', user: { id: newUser.id, email: newUser.email } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Erreur serveur lors de l’inscription' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Email ou mot de passe invalide' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Email ou mot de passe invalide' });

    if (user.isActive === false) return res.status(403).json({ message: 'Compte non activé. Vérifiez votre email.' });

    if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
      return res.status(500).json({ message: 'Configuration serveur manquante (JWT secrets).' });
    }

    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    try {
      const expiryDate = new Date(); 
      expiryDate.setDate(expiryDate.getDate() + 7);
      if (RefreshToken) await RefreshToken.create({ token: refreshToken, userId: user.id, expires: expiryDate });
    } catch (e) { console.warn('Impossible de sauvegarder le refresh token en base :', e.message || e); }

    res.cookie('refreshToken', refreshToken, cookieOptions);
    res.cookie('accessToken', accessToken, accessTokenCookieOptions);

    return res.json({ accessToken });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token && RefreshToken) { await RefreshToken.update({ revoked: true }, { where: { token } }); }
    res.clearCookie('refreshToken', { path: '/' });
    res.clearCookie('accessToken', { path: '/' });
    return res.json({ message: 'Déconnecté avec succès' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: 'Erreur lors de la déconnexion' });
  }
};

const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'Pas de refresh token' });

    const stored = RefreshToken ? await RefreshToken.findOne({ where: { token, revoked: false } }) : null;
    if (RefreshToken && !stored) return res.status(401).json({ message: 'Refresh token invalide' });

    if (!REFRESH_TOKEN_SECRET) return res.status(500).json({ message: 'Configuration serveur manquante.' });

    let decoded;
    try { decoded = jwt.verify(token, REFRESH_TOKEN_SECRET); } catch (verifyErr) { return res.status(401).json({ message: 'Refresh token invalide ou expiré' }); }

    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ message: 'Utilisateur non trouvé' });

    if (!ACCESS_TOKEN_SECRET) return res.status(500).json({ message: 'Configuration serveur manquante.' });

    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    res.cookie('accessToken', accessToken, accessTokenCookieOptions);

    return res.json({ accessToken });
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(401).json({ message: 'Refresh token invalide ou expiré' });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ message: 'Non authentifié' });
    const u = await User.findByPk(req.user.id, { attributes: ['id', 'email', 'name', 'role'] });
    res.json({ user: u });
  } catch (err) {
    console.error('getCurrentUser error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const activateAccount = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ message: 'Token requis.' });

    const user = await User.findOne({
      where: {
        activationToken: token,
        activationExpires: { [Op.gt]: Date.now() },
      },
    });

    if (!user) return res.status(400).json({ message: 'Token invalide ou expiré.' });

    user.isActive = true;
    user.activationToken = null;
    user.activationExpires = null;
    await user.save();

    const clientUrl = process.env.CLIENT_URL || '';
    if (clientUrl) { return res.redirect(`${clientUrl}/login?activated=1`); }
    return res.json({ message: 'Compte activé avec succès.' });
  } catch (err) {
    console.error('Activation error:', err);
    res.status(500).json({ message: 'Erreur serveur lors de l’activation.' });
  }
};

module.exports = {
  register,
  login,
  logout,
  refresh,
  getCurrentUser,
  activateAccount,
};