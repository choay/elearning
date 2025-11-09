require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
// const session = require('express-session'); // LIGNE SUPPRIMÉE
const sequelize = require('./db');
require('./models/index');

const app = express();

// MIDDLEWARES OBLIGATOIRES
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(morgan('dev'));
app.use(cookieParser());

// CORS + CREDENTIALS (INDISPENSABLE)
// NOTE : credentials: true est nécessaire pour recevoir les cookies
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// // SESSION (optionnel mais inutile avec JWT tokens) - LIGNE SUPPRIMÉE
// app.use(session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
//         maxAge: 7 * 24 * 60 * 60 * 1000
//     }
// }));

// LOGS DE VÉRIFICATION
console.log('CORS_ORIGIN →', process.env.CORS_ORIGIN);
console.log('PORT →', process.env.PORT);
console.log('JWT_SECRET →', process.env.JWT_SECRET ? 'OK' : 'MANQUANT !');
console.log('JWT_REFRESH_SECRET →', process.env.JWT_REFRESH_SECRET ? 'OK' : 'MANQUANT !');

// SYNC DB
sequelize.sync({ alter: true })
    .then(() => console.log('Base de données synchronisée (alter: true)'))
    .catch(err => console.error('Erreur sync DB:', err));


// =======================================================
// IMPORTS
// =======================================================
// const userController = require('./controllers/userController'); // NON UTILISÉ ICI
// const authMiddleware = require('./middleware/authMiddleware'); // NON UTILISÉ ICI
// =======================================================

// ----------------------------------------------------------------------------------
// DIAGNOSTIC DES IMPORTS (gardé pour référence)
// ----------------------------------------------------------------------------------
// console.log('DIAGNOSTIC 1: Type de authMiddleware →', typeof authMiddleware);
// console.log('DIAGNOSTIC 2: Type de userController.getUser →', typeof userController.getUser);
// ----------------------------------------------------------------------------------


// ROUTES
const purchaseRouter = require('./routes/purchaseRouter');
const authRouter = require('./routes/authRouter');
const certificateRouter = require('./routes/certificateRouter');
const cursusRouter = require('./routes/cursusRouter');
const lessonRouter = require('./routes/lessonRouter');
const themeRouter = require('./routes/themeRouter');
const userRouter = require('./routes/userRouter'); // <--- LIGNE RÉTABLIE
const progressRouter = require('./routes/progressRouter');

app.use('/api/achats', purchaseRouter);
app.use('/api/auth', authRouter);
app.use('/api/certificats', certificateRouter);
app.use('/api/cursus', cursusRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/themes', themeRouter);


// =========================================================================
// CORRECTION : Utilisation standard du routeur utilisateur
// =========================================================================
app.use('/api/users', userRouter); // <--- Utilisation standard du routeur
// =========================================================================


app.use('/api/progress', progressRouter);

// STATIC
app.use(express.static('public'));

// 404
app.use('*', (req, res) => {
    res.status(404).json({ error: `Route non trouvée: ${req.method} ${req.originalUrl}` });
});

// ERREUR GLOBALE
app.use((err, req, res, next) => {
    console.error('ERREUR SERVEUR:', err);
    res.status(500).json({ error: 'Erreur interne', details: err.message });
});

// DEMARRAGE
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`SERVEUR DEMARRE SUR http://localhost:${PORT}`);
    console.log(`API DISPONIBLE SUR ${process.env.API_URL}`);
});