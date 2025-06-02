'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('resume_reports', 'application_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      // If you want to set a default value for existing rows, add: defaultValue: 0,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('resume_reports', 'application_id');
  },
};
