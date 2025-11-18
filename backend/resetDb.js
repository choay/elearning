const db = require('./models');

async function resetDB() {
  try {
    // Désactive les vérifications FK
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Force la synchronisation de tous les modèles
    await db.sequelize.sync({ force: true });

    // Réactive les vérifications FK
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Base de données réinitialisée et tables recréées.');
  } catch (error) {
    console.error('Erreur reset DB:', error);
  } finally {
    process.exit();
  }
}

resetDB();
