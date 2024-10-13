// models/progress.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Progress = sequelize.define('Progress', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    lessonId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Lessons',
        key: 'id',
      },
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  return Progress;
};
