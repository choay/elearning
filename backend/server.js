require('dotenv').config();
const http = require('http');
const app = require('./app');
const { sequelize } = require('./models');

const normalizePort = val => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};
const port = normalizePort(process.env.PORT || '5000');
app.set('port', port);

console.log('CORS_ORIGIN →', process.env.CORS_ORIGIN);
console.log('PORT →', process.env.PORT);
console.log('JWT_SECRET →', process.env.JWT_SECRET ? 'OK' : 'MANQUANT !');
console.log('JWT_REFRESH_SECRET →', process.env.JWT_REFRESH_SECRET ? 'OK' : 'MANQUANT !');

let server;

/**
 * Log function to print details from Sequelize errors when available
 */
function logSequelizeError(err) {
  console.error('Error name:', err && err.name);
  if (err && err.message) console.error('Message:', err.message);
  if (err && err.sql) console.error('SQL:', err.sql);
  if (err && err.parameters) console.error('Parameters:', err.parameters);
  if (err && err.parent) {
    const p = err.parent;
    console.error('Parent error details:', {
      code: p.code,
      errno: p.errno,
      syscall: p.syscall,
      sql: p.sql,
      fatal: p.fatal
    });
  }
}

/**
 * Try to authenticate and sync DB with retry/backoff.
 * In production you should NOT use sync({ alter: true }) — use migrations instead.
 */
async function trySyncWithRetry({ maxAttempts = 5, baseDelayMs = 1000 } = {}) {
  let attempt = 0;

  const shouldForceSync =
    process.env.NODE_ENV !== 'production' &&
    process.env.RECREATE_DB === 'true';

  while (attempt < maxAttempts) {
    attempt++;
    try {
      console.log(`DB: tentative de connexion (attempt ${attempt}/${maxAttempts})`);
      await sequelize.authenticate();
      console.log('✅ Connexion à la base de données réussie !');

      if (shouldForceSync) {
        console.log('🔁 RECREATE_DB=true : force sync (force: true)');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        sequelize.sync({ alter: process.env.NODE_ENV !== "production" });

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('🗃️ Base de données recréée avec succès !');
        // Option: seeding area (uncomment if you have seed scripts)
        // const { seedDatabase } = require('./seed');
        // await seedDatabase();
      } else {
        // WARNING: alter can run ALTER TABLE operations; prefer migrations in prod.
        console.log('🔄 Synchronisation Sequelize (alter: true) — si production, remplacez par des migrations.');
        await sequelize.sync({ alter: true });
        console.log('🗃️ Base de données synchronisée (alter: true).');
      }

      // If we get here, sync succeeded
      return;
    } catch (err) {
      console.error(`❌ Erreur DB (attempt ${attempt}):`);
      logSequelizeError(err);

      if (attempt >= maxAttempts) {
        console.error('Nombre max de tentatives atteint. Abandon.');
        throw err;
      }

      // Exponential backoff
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`Attente ${delay}ms avant nouvelle tentative...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

const errorHandler = error => {
  if (error.syscall !== 'listen') throw error;
  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} nécessite des privilèges élevés.`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} est déjà utilisé.`);
      process.exit(1);
      break;
    default:
      throw error;
  }
};

async function initServer() {
  try {
    await trySyncWithRetry({ maxAttempts: 5, baseDelayMs: 1000 });

    server = http.createServer(app);

    server.on('error', errorHandler);
    server.on('listening', () => {
      const address = server.address();
      const bind =
        typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
      console.log(`🚀 Serveur lancé sur ${bind}`);
    });

    server.listen(port);
  } catch (err) {
    console.error('❌ FATAL : Impossible de connecter ou synchroniser la DB. Erreur finale :');
    logSequelizeError(err);
    // On exit pour signaler échec au superviseur (pm2/systemd) :
    process.exit(1);
  }
}

/**
 * Graceful shutdown helpers
 */
async function gracefulShutdown(signal) {
  console.log(`\nReçu ${signal} — arrêt propre en cours...`);
  try {
    if (server && server.close) {
      await new Promise(resolve => server.close(resolve));
      console.log('HTTP server fermé.');
    }
    try {
      await sequelize.close();
      console.log('Connexion Sequelize fermée.');
    } catch (e) {
      console.warn('Erreur lors de la fermeture de Sequelize:', e && e.message);
    }
    process.exit(0);
  } catch (err) {
    console.error('Erreur durant l\'arrêt propre:', err);
    process.exit(1);
  }
}

/**
 * Catch global errors to aid debugging
 */
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
});
process.on('uncaughtException', err => {
  console.error('Uncaught Exception thrown:', err);
});

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

initServer();