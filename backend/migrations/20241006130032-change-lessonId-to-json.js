'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Supprimer la contrainte de clé étrangère existante sur lessonId
    await queryInterface.removeConstraint('achats', 'achats_ibfk_3'); // Remplacez par le nom correct de la contrainte si nécessaire

    // Changer le type de la colonne lessonId à JSON
    await queryInterface.changeColumn('achats', 'lessonId', {
      type: Sequelize.JSON, // Utilisé pour stocker un tableau
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revenir au type d'origine (LONGTEXT)
    await queryInterface.changeColumn('achats', 'lessonId', {
      type: Sequelize.LONGTEXT, // Revenir au type longtext
      allowNull: true,
    });

    // Vous pouvez réajouter la contrainte si elle était nécessaire
    await queryInterface.addConstraint('achats', {
      fields: ['lessonId'],
      type: 'foreign key',
      name: 'achats_ibfk_3',
      references: {
        table: 'lessons',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },
};
