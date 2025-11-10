const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { User } = require('../models');
const sendActivationEmail = require('../utils/sendEmail'); // NOUVELLE IMPORTATION
require('dotenv').config();

// Génère les tokens JWT
const generateTokens = (userId) => {
    const payload = { userId };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshPayload = { userId, jti: crypto.randomUUID() };
    const refreshToken = jwt.sign(refreshPayload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

// INSCRIPTION
exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    // Vérifie si l'email existe déjà
    if (await User.findOne({ where: { email } })) {
        return res.status(400).json({ message: 'Email déjà utilisé.' });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Génère un token d'activation
    const activationToken = crypto.randomBytes(32).toString('hex');

    // Crée l'utilisateur
    await User.create({
        email,
        password: hashedPassword,
        activationToken,
        activationExpires: Date.now() + 3600000, // 1 heure
        isActive: false
    });

    // ENVOI EMAIL AVEC SENDGRID
    try {
        await sendActivationEmail(email, activationToken);
        res.status(201).json({ 
            message: 'Inscription réussie ! Vérifiez votre email pour activer votre compte.' 
        });
    } catch (error) {
        console.error('Échec envoi email:', error);
        res.status(500).json({ 
            message: 'Inscription enregistrée, mais échec envoi email. Contactez le support.' 
        });
    }
};

// ACTIVATION DE COMPTE
exports.activateAccount = async (req, res) => {
    const { token } = req.params;
    const user = await User.findOne({
        where: { 
            activationToken: token, 
            activationExpires: { [Op.gt]: Date.now() } 
        }
    });

    if (!user) return res.status(400).json({ message: 'Lien invalide ou expiré.' });

    user.isActive = true;
    user.activationToken = null;
    user.activationExpires = null;
    await user.save();

    res.json({ message: 'Compte activé ! Vous pouvez vous connecter.' });
};

// CONNEXION
exports.login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    if (!user.isActive) {
        return res.status(403).json({ message: 'Compte non activé. Vérifiez vos emails.' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
        message: 'Connexion réussie',
        accessToken,
        user: { id: user.id, email: user.email }
    });
};

// REFRESH TOKEN
exports.refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: 'Non autorisé.' });

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findByPk(decoded.userId);
        if (!user || !user.isActive) throw new Error();

        const tokenPayload = jwt.decode(refreshToken);
        if (tokenPayload.jti !== decoded.jti) throw new Error();

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            path: '/'
        });
        res.status(403).json({ message: 'Session expirée. Reconnectez-vous.' });
    }
};

// UTILISATEUR ACTUEL
exports.getCurrentUser = async (req, res) => {
    res.json({ user: req.user });
};

// DÉCONNEXION
exports.logout = (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        path: '/'
    });
    res.json({ message: 'Déconnexion réussie.' });
};