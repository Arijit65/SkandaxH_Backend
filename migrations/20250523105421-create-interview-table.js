'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Interviews', {
      sessionId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      fullName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      jobRole: {
        type: Sequelize.STRING,
        allowNull: false
      },
      questions: {
        type: Sequelize.JSON,
        allowNull: false
      },
      responses: {
        type: Sequelize.JSON,
        allowNull: true
      },
      reportUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending'
      },
      scoring: {
        type: Sequelize.JSON,
        allowNull: true
      },
      overallScore: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      interpretation: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Interviews');
  }
};