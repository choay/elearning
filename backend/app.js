require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const sequelize = require('./db');
require('./models/index');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(morgan('dev'));
app.use(cookieParser());

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

console.log('CORS_ORIGIN →', process.env.CORS_ORIGIN);
console.log('PORT →', process.env.PORT);
console.log('JWT_SECRET →', process.env.JWT_SECRET ? 'OK' : 'MANQUANT !');
console.log('JWT_REFRESH_SECRET →', process.env.JWT_REFRESH_SECRET ? 'OK' : 'MANQUANT !');

// SYNC DB SÉCURISÉ → alter uniquement en dev
if (process.env.NODE_ENV === 'production') {
    sequelize.sync()
        .then(() => console.log('Base de données synchronisée (production)'))
        .catch(err => console.error('Erreur sync DB:', err));
} else {
    sequelize.sync({ alter: true })
        .then(() => console.log('Base de données synchronisée (alter: true)'))
        .catch(err => {
            if (err.original?.code === 'ER_TOO_MANY_KEYS') {
                console.log('Index déjà existant (normal en dev) - ignoré.');
            } else {
                console.error('Erreur sync DB:', err);
            }
        });
}

// ROUTES
const purchaseRouter = require('./routes/purchaseRouter');
const authRouter = require('./routes/authRouter');
const certificateRouter = require('./routes/certificateRouter');
const cursusRouter = require('./routes/cursusRouter');
const lessonRouter = require('./routes/lessonRouter');
const themeRouter = require('./routes/themeRouter');
const userRouter = require('./routes/userRouter');
const progressRouter = require('./routes/progressRouter');

app.use('/api/achats', purchaseRouter);
app.use('/api/auth', authRouter);
app.use('/api/certificats', certificateRouter);
app.use('/api/cursus', cursusRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/themes', themeRouter);
app.use('/api/users', userRouter);
app.use('/api/progress', progressRouter);

app.use(express.static('public'));

app.use('*', (req, res) => {
    res.status(404).json({ error: `Route non trouvée: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
    console.error('ERREUR SERVEUR:', err);
    res.status(500).json({ error: 'Erreur interne', details: err.message });
});

// KEEP-ALIVE POUR RENDER GRATUIT (évite le spin-down)
if (process.env.NODE_ENV === 'production') {
    const https = require('https');
    setInterval(() => {
        https.get('https://elearning-server-4wcs.onrender.com', (res) => {
            console.log('Keep-alive ping →', res.statusCode);
        }).on('error', () => {});
    }, 4 * 60 * 1000); // toutes les 4 minutes
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`SERVEUR DEMARRE SUR http://localhost:${PORT}`);
    console.log(`API DISPONIBLE SUR ${process.env.API_URL || 'http://localhost:' + PORT}`);
});