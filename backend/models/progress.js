const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');

class Progress extends Model {}
Progress.init({
  userId: { type: DataTypes.INTEGER, allowNull: false },
  lessonId: { type: DataTypes.INTEGER, allowNull: false },
  // Champs utilisés par les controllers : completed, currentTime, completionDate
  completed: { type: DataTypes.BOOLEAN, defaultValue: false },
  currentTime: { type: DataTypes.INTEGER, allowNull: true },
  completionDate: { type: DataTypes.DATE, allowNull: true }
}, {
  sequelize,
  modelName: 'Progress',
  tableName: 'Progresses', 
  timestamps: true
});

Progress.associate = (models) => {
  Progress.belongsTo(models.User, { foreignKey: 'userId' });
  Progress.belongsTo(models.Lesson, { foreignKey: 'lessonId' });
};

module.exports = Progress;