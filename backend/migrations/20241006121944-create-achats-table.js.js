'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Création de la table achats
    await queryInterface.createTable('achats', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      cursusId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cursus',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      lessonIds: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Ajout de la contrainte de clé étrangère pour userId
    await queryInterface.addConstraint('achats', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'fk_achats_userId', // Nom unique pour la contrainte
      references: {
        table: 'users',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Ajout de la contrainte de clé étrangère pour cursusId
    await queryInterface.addConstraint('achats', {
      fields: ['cursusId'],
      type: 'foreign key',
      name: 'fk_achats_cursusId', // Nom unique pour la contrainte
      references: {
        table: 'cursus',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    // Supprimez les contraintes de clé étrangère
    await queryInterface.removeConstraint('achats', 'fk_achats_userId');
    await queryInterface.removeConstraint('achats', 'fk_achats_cursusId');

    // Supprimez la table achats lors du rollback
    await queryInterface.dropTable('achats');
  },
};
