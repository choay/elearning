require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'mysql',
  dialectOptions: {
    ssl: { rejectUnauthorized: true }
  }
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion réussie !');
  } catch (err) {
    console.error('❌ Impossible de se connecter :', err);
  } finally {
    await sequelize.close();
  }
})();
