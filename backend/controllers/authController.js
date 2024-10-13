// Importations nécessaires
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const { User } = require('../models');
require('dotenv').config();

// Configuration du transporteur de courrier électronique (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER ,
    pass: process.env.GMAIL_PASS , 
  },
  logger: true,
  debug: true,
  tls: {
    rejectUnauthorized: false 
  }
});

// Fonction d'envoi d'email d'activation
const sendActivationEmail = async (email, activationToken) => {
  const activationLink = `${process.env.API_URL}/api/auth/activate/${activationToken}`;

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER ,
      to: email,
      subject: 'Activation de votre compte',
      html: `<p>Merci pour votre inscription. Veuillez cliquer sur le lien suivant pour activer votre compte :</p><a href="${activationLink}">Activer mon compte</a>`,
    });
    console.log(`Email d'activation envoyé avec succès à : ${email}`);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email d\'activation :', error);
    throw new Error('Erreur lors de l\'envoi de l\'email d\'activation. Veuillez réessayer plus tard.');
  }
};

// Inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    // Hash du mot de passe et génération du token d'activation
    const hashedPassword = await bcrypt.hash(password, 10);
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationExpires = new Date(Date.now() + 3600000); // Expiration dans 1 heure

    // Créer le nouvel utilisateur
    const newUser = await User.create({
      email,
      password: hashedPassword,
      activationToken,
      activationExpires,
      isActive: false, // Par défaut, non activé
    });

    // Envoi de l'email d'activation
    await sendActivationEmail(email, activationToken);
    res.status(201).json({ message: 'Inscription réussie. Veuillez vérifier votre boîte mail pour activer votre compte.' });
  } catch (error) {
    console.error('Erreur lors de l\'inscription :', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'inscription.' });
  }
};

// Activation du compte utilisateur
exports.activateAccount = async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({
      where: {
        activationToken: token,
        activationExpires: { [Op.gt]: Date.now() }, // Le token doit être encore valide
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Le lien d\'activation est invalide ou a expiré.' });
    }

    // Activer le compte et réinitialiser le token d'activation
    user.activationToken = null;
    user.activationExpires = null;
    user.isActive = true;
    await user.save();

    res.json({ message: 'Votre compte a été activé avec succès!' });
  } catch (error) {
    console.error('Erreur lors de l\'activation :', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'activation.' });
  }
};

// Connexion d'un utilisateur
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis.' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Vérifier si le compte est activé
    if (!user.isActive) {
      return res.status(403).json({ message: 'Votre compte n\'est pas activé. Veuillez vérifier votre email pour l\'activer.' });
    }

    // Vérifier le mot de passe
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Mot de passe incorrect.' });
    }

    // Générer un token JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Connexion réussie', token, userId: user.id });
  } catch (error) {
    console.error('Erreur lors de la connexion :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
};

// Obtenir les informations de l'utilisateur connecté
exports.getCurrentUser = async (req, res) => {
  const userId = req.user.id; // Supposons que vous ayez déjà vérifié et décodé le token JWT

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    res.json({ user: { id: user.id, email: user.email } }); // Ne renvoie que les informations nécessaires
  } catch (error) {
    console.error('Erreur lors de la récupération de l’utilisateur :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération de l’utilisateur.' });
  }
};

// Déconnexion de l'utilisateur
exports.logout = (req, res) => {
  res.clearCookie('token'); // Suppression du token s'il est stocké dans un cookie
  res.json({ message: 'Déconnexion réussie.' });
};
