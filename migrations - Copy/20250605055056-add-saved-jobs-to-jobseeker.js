'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Jobseekers', 'savedJobs', {
      type: Sequelize.ARRAY(Sequelize.UUID),
      defaultValue: [],
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Jobseekers', 'savedJobs');
  }
};
