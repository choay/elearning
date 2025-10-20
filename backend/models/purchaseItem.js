'use strict';
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db');
const Purchase = require('./purchase');

class PurchaseItem extends Model {}

PurchaseItem.init({
  productType: { type: DataTypes.ENUM('lesson','cursus'), allowNull: false },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false }
}, {
  sequelize,
  modelName: 'PurchaseItem',
  tableName: 'PurchaseItems',
  timestamps: true
});

PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchaseId', onDelete: 'CASCADE' });
Purchase.hasMany(PurchaseItem, { foreignKey: 'purchaseId', onDelete: 'CASCADE' });

module.exports = PurchaseItem;
