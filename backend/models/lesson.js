'use strict';
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db');

class Lesson extends Model {
  static associate(models) {
    Lesson.belongsTo(models.Cursus, { foreignKey: 'cursusId', onDelete: 'CASCADE' });
  }
}

Lesson.init({
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  videoUrl: { type: DataTypes.STRING, allowNull: true },
  prix: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 }, // 🔹 Champ prix ajouté ici
  cursusId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  sequelize,
  modelName: 'Lesson',
  tableName: 'Lessons',
  timestamps: true
});

module.exports = Lesson;
