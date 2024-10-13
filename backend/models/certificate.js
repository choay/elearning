// models/certificate.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Certificate = sequelize.define('Certificate', {
    issuedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id',
      },
      allowNull: false,
    },
    cursusId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Cursus',
        key: 'id',
      },
      allowNull: false,
    },
  }, {
    tableName: 'certificates',
    timestamps: false,
  });

  return Certificate;
};
