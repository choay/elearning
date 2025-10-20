'use strict';
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db');
const Cursus = require('./cursus');

class Lesson extends Model {}

Lesson.init({
  title: { type: DataTypes.STRING, allowNull: false },
  prix: { type: DataTypes.FLOAT, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  videoUrl: { type: DataTypes.STRING, allowNull: true }
}, {
  sequelize,
  modelName: 'Lesson',
  tableName: 'Lessons',
  timestamps: true
});

Lesson.belongsTo(Cursus, { foreignKey: 'cursusId', onDelete: 'CASCADE' });
Cursus.hasMany(Lesson, { foreignKey: 'cursusId', onDelete: 'CASCADE' });

module.exports = Lesson;
