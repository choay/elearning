const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');

class Purchase extends Model {}
Purchase.init({
  userId: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('pending','paid','completed'), defaultValue: 'pending' },
  paymentIntentId: { type: DataTypes.STRING, allowNull: true },
  totalPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true }
}, {
  sequelize,
  modelName: 'Purchase',
  tableName: 'Purchases',
  timestamps: true
});

Purchase.associate = (models) => {
  Purchase.belongsTo(models.User, { foreignKey: 'userId' });
  // alias 'items' attendu par les includes dans les controllers
  Purchase.hasMany(models.PurchaseItem, { foreignKey: 'purchaseId', as: 'items' });
};

module.exports = Purchase;