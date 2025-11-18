require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const purchaseRouter = require('./routes/purchaseRouter');
const authRouter = require('./routes/authRouter');
const certificateRouter = require('./routes/certificateRouter');
const cursusRouter = require('./routes/cursusRouter');
const lessonRouter = require('./routes/lessonRouter');
const themeRouter = require('./routes/themeRouter');
const userRouter = require('./routes/userRouter');
const progressRouter = require('./routes/progressRouter');

const app = express();

// Si derrière un proxy (Render, Vercel)
if ((process.env.NODE_ENV || '').trim() === 'production') {
  app.set('trust proxy', 1);
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// Gestion d'origines autorisées
const corsOriginEnv = (process.env.CORS_ORIGIN || '').trim();
const clientUrlEnv = (process.env.CLIENT_URL || process.env.FRONTEND_URL || '').trim();

let allowedOrigins = [];
if (corsOriginEnv) {
  allowedOrigins = corsOriginEnv.split(',').map(s => s.trim()).filter(Boolean);
} else if (clientUrlEnv) {
  allowedOrigins = [clientUrlEnv];
} else {
  allowedOrigins = ['http://localhost:3000'];
}

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Configuration express-session pour cookies (sécurisée en production)
app.use(session({
  name: 'knowledge.sid',
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 // 1 jour
  }
}));

app.use((req, res, next) => {
  console.debug('[incoming headers]', {
    origin: req.headers.origin,
    authorization: req.headers.authorization,
    cookie: req.headers.cookie,
    host: req.headers.host,
  });
  next();
});

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/themes', themeRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/cursus', cursusRouter);
app.use('/api/progress', progressRouter);
app.use('/api/certificates', certificateRouter);
app.use('/api/purchases', purchaseRouter);

app.get('/', (req, res) => {
  res.json({ message: 'API en ligne', environment: process.env.NODE_ENV });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

app.use((err, req, res, next) => {
  console.error('Erreur serveur :', err);
  if (err?.message?.includes('Not allowed by CORS')) {
    return res.status(403).json({ error: 'Origine non autorisée par CORS' });
  }
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

module.exports = app;
