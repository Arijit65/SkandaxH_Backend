'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change status from ENUM to STRING
    await queryInterface.changeColumn('JobApplications', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'pending',
    });
    // Add progressDetails column
    await queryInterface.addColumn('JobApplications', 'progressDetails', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert status to ENUM (adjust values as needed)
    await queryInterface.changeColumn('JobApplications', 'status', {
      type: Sequelize.ENUM('pending', 'reviewed', 'rejected', 'accepted'),
      defaultValue: 'pending',
    });
    // Remove progressDetails column
    await queryInterface.removeColumn('JobApplications', 'progressDetails');
  }
};