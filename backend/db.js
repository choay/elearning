require('dotenv').config();
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
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Aiven SSL self-signed
      }
    },
    define: {
      freezeTableName: true,
      timestamps: true
    }
  }
);

// Test de connexion
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base Aiven réussie !');
  } catch (error) {
    console.error('❌ Impossible de se connecter à la base :', error);
  }
})();

module.exports = sequelize;
