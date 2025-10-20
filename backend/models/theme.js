'use strict';
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db');

class Theme extends Model {}

Theme.init({
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  color: { type: DataTypes.STRING, allowNull: true }
}, {
  sequelize,
  modelName: 'Theme',
  tableName: 'Themes',
  timestamps: true
});

module.exports = Theme;
