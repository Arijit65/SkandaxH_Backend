'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Jobs', 'skills', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
    });

    await queryInterface.addColumn('Jobs', 'designation', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Jobs', 'recruiterId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Users', // Assuming the recruiter is in the 'Users' table
        key: 'id',
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Jobs', 'skills');
    await queryInterface.removeColumn('Jobs', 'designation');
    await queryInterface.removeColumn('Jobs', 'recruiterId');
  }
};
