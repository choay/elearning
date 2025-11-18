// backend/models/Lesson.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');

class Lesson extends Model {}
Lesson.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  videoUrl: { type: DataTypes.STRING, allowNull: true },
  cursusId: { type: DataTypes.INTEGER, allowNull: true },
  // colonne canonique en DB : 'prix'
  prix: { type: DataTypes.DECIMAL(10,2), allowNull: true },
  position: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 }
}, {
  sequelize,
  modelName: 'Lesson',
  tableName: 'Lessons',
  timestamps: true,
  getterMethods: {
    price() {
      return this.getDataValue('prix');
    }
  }
});

Lesson.associate = (models) => {
  // alias inverse (cohérent avec CourseLessons)
  Lesson.belongsTo(models.Cursus, { foreignKey: 'cursusId', as: 'Cursus' });
  Lesson.hasMany(models.Progress, { foreignKey: 'lessonId', as: 'Progresses' });
};

module.exports = Lesson;