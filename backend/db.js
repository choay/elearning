require('dotenv').config(); // L'appel ici est redondant mais ne fait pas de mal.
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DIALECT || 'mysql',
    logging: false,
    // CORRECTION CRITIQUE : Ajout de l'option SSL pour Aiven/Postgres
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Accepte les certificats auto-signés (important pour certains environnements cloud)
      }
    },
    define: {
      freezeTableName: true,
      timestamps: true
    }
  }
);

// Test de connexion (exécuté au démarrage du module)
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie !');
  } catch (error) {
    console.error('❌ Impossible de se connecter à la base :', error.message);
  }
})();

module.exports = sequelize;