'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Jobseekers', 'certificates', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Jobseekers', 'education', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Jobseekers', 'experienceYears', {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    });
    await queryInterface.addColumn('Jobseekers', 'jobDetails', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Jobseekers', 'resume', {
      type: Sequelize.STRING,
      allowNull: true, // Store the file path of the resume
    });
    await queryInterface.addColumn('Jobseekers', 'githubLink', {
      type: Sequelize.STRING,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Jobseekers', 'certificates');
    await queryInterface.removeColumn('Jobseekers', 'education');
    await queryInterface.removeColumn('Jobseekers', 'experienceYears');
    await queryInterface.removeColumn('Jobseekers', 'jobDetails');
    await queryInterface.removeColumn('Jobseekers', 'resume');
    await queryInterface.removeColumn('Jobseekers', 'githubLink');
  }
};
