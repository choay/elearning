const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const sequelize = require('./db');
require('./models/index');
require('dotenv').config();


const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(express.static('public'));
app.use(morgan('combined'));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
}));

// Synchronisation de la base de données
sequelize.sync({ force: false })
  .then(() => console.log('Base de données synchronisée.'))
  .catch((err) => console.error('Erreur lors de la synchronisation de la base de données :', err));

// Import des routeurs
const purchaseRouter = require('./routes/purchaseRouter'); 
const authRouter = require('./routes/authRouter');
const certificateRouter = require('./routes/certificateRouter');
const cursusRouter = require('./routes/cursusRouter');
const lessonRouter = require('./routes/lessonRouter');
const themeRouter = require('./routes/themeRouter');
const userRouter = require('./routes/userRouter');
const progressRouter = require('./routes/progressRouter');

// Utilisation des routeurs
app.use('/api/achats', purchaseRouter);
app.use('/api/auth', authRouter);
app.use('/api/certificats', certificateRouter);
app.use('/api/cursus', cursusRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/themes', themeRouter);
app.use('/api/users', userRouter);
app.use('/api/progress', progressRouter);

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur attrapée par le middleware :', err);
  res.status(500).json({ error: 'Une erreur est survenue' });
});

// Démarrage du serveur HTTP
const PORT = process.env.PORT || 3000;

// Créez le serveur HTTP
const server = app.listen(PORT, () => {
  console.log(`Serveur HTTP démarré sur le port ${PORT}`);
});
