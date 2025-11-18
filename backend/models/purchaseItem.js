const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');

class PurchaseItem extends Model {}
PurchaseItem.init({
  purchaseId: { type: DataTypes.INTEGER, allowNull: false },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  // Remplacer l'ENUM par STRING pour éviter les problèmes de troncature / ENUM mismatch
  productType: { type: DataTypes.STRING(50), allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: true }
}, {
  sequelize,
  modelName: 'PurchaseItem',
  tableName: 'PurchaseItems',
  timestamps: true
});

PurchaseItem.associate = (models) => {
  // alias 'ParentPurchase' utilisé dans certains contrôleurs (ex: includes)
  PurchaseItem.belongsTo(models.Purchase, { foreignKey: 'purchaseId', as: 'ParentPurchase' });
};

module.exports = PurchaseItem;