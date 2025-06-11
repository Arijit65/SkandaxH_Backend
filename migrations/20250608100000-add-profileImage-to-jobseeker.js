'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Jobseekers', 'profileImage', {
      type: Sequelize.STRING,
      allowNull: true, // Allow null for users who haven't uploaded an image yet
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Jobseekers', 'profileImage');
  }
}; 