const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');

class Theme extends Model {}
Theme.init({
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT }
}, { sequelize, modelName: 'Theme' });

Theme.associate = (models) => {
  Theme.hasMany(models.Cursus, { foreignKey: 'themeId', as: 'cursusList' })
};

module.exports = Theme;
