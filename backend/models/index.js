// models/index.js
const sequelize = require('../db');

const User = require('./user')(sequelize);
const Theme = require('./theme')(sequelize);
const Cursus = require('./cursus')(sequelize);
const Lesson = require('./lesson')(sequelize);
const Purchase = require('./purchase')(sequelize);
const PurchaseItem = require('./purchaseItem')(sequelize);
const Certificate = require('./certificate')(sequelize);
const Progress = require('./progress')(sequelize);

const defineAssociations = () => {
  // User - Purchase
  User.hasMany(Purchase, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Purchase.belongsTo(User, { foreignKey: 'userId' });

  // Purchase - PurchaseItem
  Purchase.hasMany(PurchaseItem, { foreignKey: 'purchaseId', onDelete: 'CASCADE' });
  PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchaseId' });

  // Cursus - Lesson
  Cursus.hasMany(Lesson, { foreignKey: 'cursusId', as: 'lessons', onDelete: 'CASCADE' });
  Lesson.belongsTo(Cursus, { foreignKey: 'cursusId' });

  // User - Certificate
  User.hasMany(Certificate, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Certificate.belongsTo(User, { foreignKey: 'userId' });

  // Cursus - Certificate
  Cursus.hasMany(Certificate, { foreignKey: 'cursusId', onDelete: 'CASCADE' });
  Certificate.belongsTo(Cursus, { foreignKey: 'cursusId' });

  // User - Progress
  User.hasMany(Progress, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Progress.belongsTo(User, { foreignKey: 'userId' });

  // Lesson - Progress
  Lesson.hasMany(Progress, { foreignKey: 'lessonId', onDelete: 'CASCADE' });
  Progress.belongsTo(Lesson, { foreignKey: 'lessonId' });

  // Theme - Cursus
  Theme.hasMany(Cursus, { foreignKey: 'themeId', onDelete: 'CASCADE' });
  Cursus.belongsTo(Theme, { foreignKey: 'themeId' });
};

defineAssociations();

const syncModels = async () => {
  try {
    await sequelize.sync({ alter: true }); // Synchroniser les modèles avec la base de données
    console.log('La base de données a été synchronisée avec succès.');
  } catch (error) {
    console.error('Erreur lors de la synchronisation de la base de données :', error);
  }
};

syncModels();

module.exports = {
  User,
  Theme,
  Cursus,
  Lesson,
  Purchase,
  PurchaseItem,
  Certificate,
  Progress,
  sequelize,
};
