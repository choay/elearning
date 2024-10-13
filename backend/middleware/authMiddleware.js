const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    // Vérifier si le token est dans les cookies ou dans le header d'autorisation
    const token = req.cookies.authToken || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

    console.log('Token reçu:', token); // Log le token reçu

    if (!token) {
        console.log('Token manquant');
        return res.status(401).json({ message: 'Accès refusé, veuillez vous connecter.' });
    }

    // Vérification du token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Erreur lors de la vérification du token:', err.message);
            return res.status(403).json({ message: 'Token invalide ou expiré' });
        }

        req.user = user; // Ajouter l'utilisateur vérifié à l'objet req
        next(); // Continuer vers le prochain middleware ou la route
    });
};

module.exports = authenticateJWT;
