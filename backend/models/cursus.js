'use strict';
const { Model, DataTypes } = require('sequelize');
const Theme = require('./theme');

class Cursus extends Model {}

Cursus.init({
  title: { type: DataTypes.STRING, allowNull: false },
  prix: { type: DataTypes.FLOAT, allowNull: false }
}, {
  sequelize: require('../db'),
  modelName: 'Cursus',
  tableName: 'Cursus'
});

Cursus.belongsTo(Theme, { foreignKey: 'themeId', onDelete: 'CASCADE' });

module.exports = Cursus;
