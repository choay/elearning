const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');

class Certificate extends Model {}

Certificate.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  cursusId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  issuedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'Certificate',
  tableName: 'Certificates',
});

Certificate.associate = (models) => {
  // 🔹 Relation avec l'utilisateur
  Certificate.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'User', // alias explicite
  });

  // 🔹 Relation avec le cursus
  Certificate.belongsTo(models.Cursus, {
    foreignKey: 'cursusId',
    as: 'Cursus', // alias attendu par ton controller
  });
};

module.exports = Certificate;
