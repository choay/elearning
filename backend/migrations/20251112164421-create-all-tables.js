// migrations/20251112-create-all-tables.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Themes
    await queryInterface.createTable('Themes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      color: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 2. Cursus
    await queryInterface.createTable('Cursus', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      prix: { type: Sequelize.FLOAT, allowNull: false },
      themeId: { type: Sequelize.INTEGER, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addConstraint('Cursus', {
      fields: ['themeId'],
      type: 'foreign key',
      references: { table: 'Themes', field: 'id' },
      onDelete: 'SET NULL'
    });

    // 3. Lessons
    await queryInterface.createTable('Lessons', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: Sequelize.STRING, allowNull: false },
      content: { type: Sequelize.TEXT },
      prix: { type: Sequelize.FLOAT, allowNull: false },
      cursusId: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addConstraint('Lessons', {
      fields: ['cursusId'],
      type: 'foreign key',
      references: { table: 'Cursus', field: 'id' },
      onDelete: 'CASCADE'
    });

    // 4. Users
    await queryInterface.createTable('Users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      role: { type: Sequelize.STRING, defaultValue: 'user' },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: false },
      activationToken: { type: Sequelize.STRING },
      activationExpires: { type: Sequelize.BIGINT },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 5. Purchases
    await queryInterface.createTable('Purchases', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: Sequelize.INTEGER, allowNull: false },
      totalPrice: { type: Sequelize.FLOAT, allowNull: false },
      paymentIntentId: { type: Sequelize.STRING },
      status: { type: Sequelize.STRING, defaultValue: 'pending' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addConstraint('Purchases', {
      fields: ['userId'],
      type: 'foreign key',
      references: { table: 'Users', field: 'id' },
      onDelete: 'CASCADE'
    });

    // 6. PurchaseItems
    await queryInterface.createTable('PurchaseItems', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      purchaseId: { type: Sequelize.INTEGER, allowNull: false },
      cursusId: { type: Sequelize.INTEGER, allowNull: true },
      lessonId: { type: Sequelize.INTEGER, allowNull: true },
      priceAtPurchase: { type: Sequelize.FLOAT, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addConstraint('PurchaseItems', {
      fields: ['purchaseId'],
      type: 'foreign key',
      references: { table: 'Purchases', field: 'id' },
      onDelete: 'CASCADE'
    });
    await queryInterface.addConstraint('PurchaseItems', {
      fields: ['cursusId'],
      type: 'foreign key',
      references: { table: 'Cursus', field: 'id' },
      onDelete: 'CASCADE'
    });
    await queryInterface.addConstraint('PurchaseItems', {
      fields: ['lessonId'],
      type: 'foreign key',
      references: { table: 'Lessons', field: 'id' },
      onDelete: 'CASCADE'
    });

    // 7. Progresses
    await queryInterface.createTable('Progresses', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: Sequelize.INTEGER, allowNull: false },
      lessonId: { type: Sequelize.INTEGER, allowNull: false },
      completed: { type: Sequelize.BOOLEAN, defaultValue: false },
      completionDate: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addConstraint('Progresses', {
      fields: ['userId'],
      type: 'foreign key',
      references: { table: 'Users', field: 'id' },
      onDelete: 'CASCADE'
    });
    await queryInterface.addConstraint('Progresses', {
      fields: ['lessonId'],
      type: 'foreign key',
      references: { table: 'Lessons', field: 'id' },
      onDelete: 'CASCADE'
    });

    // 8. Certificates
    await queryInterface.createTable('Certificates', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: Sequelize.INTEGER, allowNull: false },
      cursusId: { type: Sequelize.INTEGER, allowNull: false },
      issuedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addConstraint('Certificates', {
      fields: ['userId'],
      type: 'foreign key',
      references: { table: 'Users', field: 'id' },
      onDelete: 'CASCADE'
    });
    await queryInterface.addConstraint('Certificates', {
      fields: ['cursusId'],
      type: 'foreign key',
      references: { table: 'Cursus', field: 'id' },
      onDelete: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Certificates');
    await queryInterface.dropTable('Progresses');
    await queryInterface.dropTable('PurchaseItems');
    await queryInterface.dropTable('Purchases');
    await queryInterface.dropTable('Users');
    await queryInterface.dropTable('Lessons');
    await queryInterface.dropTable('Cursus');
    await queryInterface.dropTable('Themes');
  }
};