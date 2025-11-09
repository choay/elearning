const { User } = require('../models'); // Assurez-vous d'importer votre modèle User
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Fonction utilitaire pour générer un token JWT
const generateToken = (id) => {
    // Vérifiez que JWT_SECRET est bien défini dans .env
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET n\'est pas défini dans les variables d\'environnement.');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Enregistrer un nouvel utilisateur
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    // NOTE: Il est crucial que les champs ici (email, password, name) correspondent
    // aux champs envoyés par votre formulaire d'inscription dans le frontend.
    const { email, password, name } = req.body;

    // 1. Validation de base
    if (!email || !password) {
        // Renvoie une erreur JSON claire au frontend
        return res.status(400).json({ message: 'Veuillez fournir un email et un mot de passe.' });
    }

    try {
        // 2. Vérification si l'utilisateur existe déjà
        const userExists = await User.findOne({ where: { email } });

        if (userExists) {
            return res.status(400).json({ message: 'L\'utilisateur existe déjà.' });
        }

        // 3. Chiffrement du mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Création de l'utilisateur dans la BDD
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            // Assurez-vous d'ajouter ici les champs requis par votre modèle (ex: role: 'user')
        });

        if (user) {
            // 5. Réponse réussie avec token
            // Vous pouvez choisir d'utiliser un cookie pour le token au lieu de le renvoyer directement dans le corps
            res.status(201).json({
                id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user.id),
            });
        } else {
            res.status(400).json({ message: 'Données utilisateur invalides lors de la création.' });
        }
    } catch (error) {
        console.error('Erreur d\'enregistrement:', error);
        res.status(500).json({ message: 'Erreur du serveur lors de l\'enregistrement.' });
    }
};

// @desc    Authentifier un utilisateur
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Validation de base
    if (!email || !password) {
        return res.status(400).json({ message: 'Veuillez fournir un email et un mot de passe pour la connexion.' });
    }

    try {
        const user = await User.findOne({ where: { email } });

        // Vérifie l'existence de l'utilisateur ET la correspondance du mot de passe chiffré
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ message: 'Email ou mot de passe invalide.' });
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        res.status(500).json({ message: 'Erreur du serveur lors de la connexion.' });
    }
};

// @desc    Obtenir les données utilisateur
// @route   GET /api/auth/me
// @access  Private (Nécessite le middleware 'protect')
exports.getMe = async (req, res) => {
    // Ici, req.user est défini par le middleware 'protect' après vérification du token
    if (req.user) {
        res.json({
            id: req.user.id,
            name: req.user.name,
            email: req.user.email
        });
    } else {
        res.status(401).json({ message: 'Non autorisé, pas de jeton.' });
    }
};