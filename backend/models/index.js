const sequelize = require('../db');

const User = require('./user');
const Theme = require('./theme');
const Cursus = require('./cursus');
const Lesson = require('./lesson');
const Purchase = require('./purchase');
const PurchaseItem = require('./purchaseItem');
const Progress = require('./progress');

// Exporter tout
module.exports = {
  sequelize,
  User,
  Theme,
  Cursus,
  Lesson,
  Purchase,
  PurchaseItem,
  Progress
};
