// backend/models/Cursus.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');

class Cursus extends Model {}
Cursus.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  themeId: { type: DataTypes.INTEGER, allowNull: true },
  // colonne canonique en DB : 'prix'
  prix: { type: DataTypes.DECIMAL(10,2), allowNull: true }
}, {
  sequelize,
  modelName: 'Cursus',
  tableName: 'Cursus',
  timestamps: true,
  getterMethods: {
    // compatibilité JS : this.price retourne la même valeur que prix
    price() {
      return this.getDataValue('prix');
    }
  }
});

Cursus.associate = (models) => {
  Cursus.belongsTo(models.Theme, { foreignKey: 'themeId', onDelete: 'SET NULL', onUpdate: 'CASCADE', as: 'theme' });
  // explicit alias pour correspondre au controller/frontend
  Cursus.hasMany(models.Lesson, { foreignKey: 'cursusId', as: 'CourseLessons' });
  Cursus.hasMany(models.Certificate, { foreignKey: 'cursusId', as: 'Certificates' });
};

module.exports = Cursus;