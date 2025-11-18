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

function logSequelizeError(err) {
  console.error('Error name:', err?.name);
  if (err?.message) console.error('Message:', err.message);
  if (err?.sql) console.error('SQL:', err.sql);
  if (err?.parameters) console.error('Parameters:', err.parameters);
  if (err?.parent) {
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

async function trySyncWithRetry({ maxAttempts = 5, baseDelayMs = 1000 } = {}) {
  let attempt = 0;
  const shouldForceSync = process.env.NODE_ENV !== 'production' && process.env.RECREATE_DB === 'true';

  while (attempt < maxAttempts) {
    attempt++;
    try {
      console.log(`DB: tentative de connexion (attempt ${attempt}/${maxAttempts})`);
      await sequelize.authenticate();
      console.log('✅ Connexion à la base de données réussie !');

      if (shouldForceSync) {
        console.log('🔁 RECREATE_DB=true : force sync (force: true)');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await sequelize.sync({ alter: true });
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('🗃️ Base de données recréée avec succès !');
      } else {
        await sequelize.sync();
        console.log('🗃️ Base de données synchronisée en toute sécurité.');
      }
      return;
    } catch (err) {
      console.error(`❌ Erreur DB (attempt ${attempt}):`);
      logSequelizeError(err);
      if (attempt >= maxAttempts) throw err;
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
      const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
      console.log(`🚀 Serveur lancé sur ${bind}`);
    });
    server.listen(port);
  } catch (err) {
    console.error('❌ FATAL : Impossible de connecter ou synchroniser la DB.');
    logSequelizeError(err);
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  console.log(`\nReçu ${signal} — arrêt propre en cours...`);
  try {
    if (server?.close) await new Promise(resolve => server.close(resolve));
    await sequelize.close();
    console.log('HTTP server et Sequelize fermés.');
    process.exit(0);
  } catch (err) {
    console.error('Erreur durant l\'arrêt propre:', err);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, p) => console.error('Unhandled Rejection at:', p, 'reason:', reason));
process.on('uncaughtException', err => console.error('Uncaught Exception thrown:', err));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

initServer();
