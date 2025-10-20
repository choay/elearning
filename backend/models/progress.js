'use strict';
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./user');
const Lesson = require('./lesson');

class Progress extends Model {}

Progress.init({
  completed: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  sequelize,
  modelName: 'Progress',
  tableName: 'Progress',
  timestamps: true
});

Progress.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Progress, { foreignKey: 'userId', onDelete: 'CASCADE' });

Progress.belongsTo(Lesson, { foreignKey: 'lessonId', onDelete: 'CASCADE' });
Lesson.hasMany(Progress, { foreignKey: 'lessonId', onDelete: 'CASCADE' });

module.exports = Progress;
