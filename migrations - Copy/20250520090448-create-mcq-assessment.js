'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MCQAssessments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      session_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      candidate_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      candidate_email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      position_applied: {
        type: Sequelize.STRING,
        allowNull: false
      },
      company_applied: {
        type: Sequelize.STRING,
        allowNull: false
      },
      reference_code: {
        type: Sequelize.STRING,
        allowNull: false
      },
      job_description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      total_questions: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      score: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('MCQAssessments');
  }
};