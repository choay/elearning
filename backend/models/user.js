const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');

class User extends Model {}
User.init({
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: true },
  name: { type: DataTypes.STRING },
  role: { type: DataTypes.STRING, defaultValue: 'user' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: false },
  refreshToken: { type: DataTypes.TEXT },
  activationToken: { type: DataTypes.STRING, allowNull: true },
  activationExpires: { type: DataTypes.BIGINT, allowNull: true }
}, { sequelize, modelName: 'User' });

User.associate = (models) => {
  User.hasMany(models.Purchase, { foreignKey: 'userId' });
  User.hasMany(models.Progress, { foreignKey: 'userId' });
  User.hasMany(models.Certificate, { foreignKey: 'userId' });
};

module.exports = User;