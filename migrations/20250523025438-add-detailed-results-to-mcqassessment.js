'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('MCQAssessments', 'detailed_results', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('MCQAssessments', 'detailed_results');
  }
};