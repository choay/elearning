// db.js (petite correction pour utiliser DB_DIALECT si présent)
require('dotenv').config();
const { Sequelize } = require('sequelize');

const dialect = process.env.DB_DIALECT || process.env.DIALECT || 'mysql';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: dialect,
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }
);

module.exports = sequelize;