const sequelize = require('../db');
const { Sequelize } = require('sequelize'); // Importez Sequelize pour la portée globale si nécessaire

const User = require('./user');
const Theme = require('./theme');
const Cursus = require('./cursus');
const Lesson = require('./lesson');
const Purchase = require('./purchase');
const PurchaseItem = require('./purchaseItem');
const Progress = require('./progress');

// --- Définition des Associations ---

// 1. Cursus et Theme
Cursus.belongsTo(Theme, { 
    foreignKey: 'themeId', 
    onDelete: 'CASCADE', 
    as: 'Theme' 
});
Theme.hasMany(Cursus, { 
    foreignKey: 'themeId', 
    onDelete: 'CASCADE', 
    as: 'Cursus' 
});

// 2. Autres associations

// User et Progress/Purchase
User.hasMany(Progress, { foreignKey: 'userId', onDelete: 'CASCADE', as: 'UserProgresses' }); 
User.hasMany(Purchase, { foreignKey: 'userId', onDelete: 'CASCADE', as: 'UserPurchases' }); 

// Purchase et PurchaseItem (un achat a plusieurs articles)
Purchase.hasMany(PurchaseItem, { foreignKey: 'purchaseId', onDelete: 'CASCADE', as: 'Items' });
PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchaseId', as: 'ParentPurchase' });

// Cursus et PurchaseItem (un article d'achat référence un cursus)
PurchaseItem.belongsTo(Cursus, { foreignKey: 'cursusId', as: 'CursusItem' });
Cursus.hasMany(PurchaseItem, { foreignKey: 'cursusId', as: 'PurchaseItems' });

// Cursus et Lesson (un cursus a plusieurs leçons)
Cursus.hasMany(Lesson, { foreignKey: 'cursusId', onDelete: 'CASCADE', as: 'CourseLessons' });
Lesson.belongsTo(Cursus, { foreignKey: 'cursusId', as: 'Cursus' });

// Lesson et Progress (un utilisateur progresse dans une leçon)
Progress.belongsTo(User, { foreignKey: 'userId', as: 'Student' }); 
Progress.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'TrackedLesson' }); 
// CORRECTION APPLIQUÉE ICI : L'alias 'Progresses' est renommé en 'LessonProgresses'
Lesson.hasMany(Progress, { foreignKey: 'lessonId', as: 'LessonProgresses' });


// Exporter tout
module.exports = {
  sequelize,
  Sequelize, // Ajout de Sequelize pour l'accès aux types, si nécessaire
  User,
  Theme,
  Cursus,
  Lesson,
  Purchase,
  PurchaseItem,
  Progress
};