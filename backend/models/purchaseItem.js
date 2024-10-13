// models/purchaseItem.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PurchaseItem = sequelize.define('PurchaseItem', {
    purchaseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Purchases',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    productType: {
      type: DataTypes.ENUM('lesson', 'cursus'),
      allowNull: false,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  });

  return PurchaseItem;
};
