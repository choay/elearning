'use strict';
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./user');

class Purchase extends Model {}

Purchase.init({
  paymentIntentId: { type: DataTypes.STRING, allowNull: false },
  totalAmount: { type: DataTypes.FLOAT, allowNull: false }
}, {
  sequelize,
  modelName: 'Purchase',
  tableName: 'Purchases',
  timestamps: true
});

Purchase.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Purchase, { foreignKey: 'userId', onDelete: 'CASCADE' });

module.exports = Purchase;
