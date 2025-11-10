const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const { User } = require('../models');
require('dotenv').config();

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
    tls: { rejectUnauthorized: false }
});

const sendActivationEmail = async (email, activationToken) => {
    const link = `${process.env.API_URL}/api/auth/activate/${activationToken}`;
    await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Activez votre compte',
        html: `<p>Cliquez <a href="${link}">ici</a> pour activer votre compte.</p>`
    });
};

exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    if (await User.findOne({ where: { email } })) {
        return res.status(400).json({ message: 'Email déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const activationToken = crypto.randomBytes(32).toString('hex');

    await User.create({
        email,
        password: hashedPassword,
        activationToken,
        activationExpires: Date.now() + 3600000,
        isActive: false
    });

    await sendActivationEmail(email, activationToken);
    res.status(201).json({ message: 'Inscription OK. Vérifiez vos emails.' });
};

exports.activateAccount = async (req, res) => {
    const { token } = req.params;
    const user = await User.findOne({
        where: { activationToken: token, activationExpires: { [Op.gt]: Date.now() } }
    });

    if (!user) return res.status(400).json({ message: 'Lien invalide ou expiré.' });

    user.isActive = true;
    user.activationToken = null;
    user.activationExpires = null;
    await user.save();

    res.json({ message: 'Compte activé ! Vous pouvez vous connecter.' });
};

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
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // <-- CORRECTION ICI
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
        message: 'Connexion réussie',
        accessToken,
        user: { id: user.id, email: user.email }
    });
};

exports.refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: 'Non autorisé.' });

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findByPk(decoded.userId);
        if (!user || !user.isActive) throw new Error();

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // <-- CORRECTION ICI
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        // En cas d'échec de vérification (token expiré/invalide)
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // <-- CORRECTION ICI
        });
        res.status(403).json({ message: 'Session expirée. Reconnectez-vous.' });
    }
};

exports.getCurrentUser = async (req, res) => {
    // req.user est disponible grâce au authMiddleware
    res.json({ user: req.user });
};

exports.logout = (req, res) => {
    res.clearCookie('refreshToken');
    res.json({ message: 'Déconnexion réussie.' });
};