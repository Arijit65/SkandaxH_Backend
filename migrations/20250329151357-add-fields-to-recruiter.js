'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // await queryInterface.addColumn('Recruiters', 'company', {
    //   type: Sequelize.STRING,
    //   allowNull: false,
    // });
    await queryInterface.addColumn('Recruiters', 'bussinessTag', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('Recruiters', 'location', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('Recruiters', 'phone', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('Recruiters', 'description', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
   // await queryInterface.removeColumn('Recruiters', 'company');
    await queryInterface.removeColumn('Recruiters', 'bussinessTag');
    await queryInterface.removeColumn('Recruiters', 'location');
    await queryInterface.removeColumn('Recruiters', 'phone');
    await queryInterface.removeColumn('Recruiters', 'description');
  }
};
