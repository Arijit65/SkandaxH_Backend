'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Interviews', 'updatedAt', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Interviews', 'updatedAt');
  }
};