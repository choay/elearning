// models/cursus.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Cursus = sequelize.define('Cursus', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    prix: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    themeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Themes',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  });

  return Cursus;
};
