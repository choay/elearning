'use strict';
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db');

class Cursus extends Model {
  static associate(models) {
    Cursus.belongsTo(models.Theme, { foreignKey: 'themeId', onDelete: 'CASCADE' });
    Cursus.hasMany(models.Lesson, { foreignKey: 'cursusId', onDelete: 'CASCADE' });
  }
}

Cursus.init({
  title: { type: DataTypes.STRING, allowNull: false },
  prix: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
  description: { type: DataTypes.TEXT, allowNull: true }, // 🔹 Ajouté : pour enrichir les cursus
  themeId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  sequelize,
  modelName: 'Cursus',
  tableName: 'Cursus',
  timestamps: true
});

module.exports = Cursus;
