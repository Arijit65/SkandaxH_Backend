'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('resume_reports', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      job_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      education_match: Sequelize.FLOAT,
      experience_match: Sequelize.FLOAT,
      percentage_score: Sequelize.FLOAT,
      role_match: Sequelize.FLOAT,
      skill_match: Sequelize.FLOAT,
      total_score: Sequelize.FLOAT,
      years_of_experience: Sequelize.FLOAT,
      full_resume_text: Sequelize.TEXT,
      resume_summary: Sequelize.TEXT,
      job_role: Sequelize.STRING,
      matching_skills: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: [],
      },
      missing_skills: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: [],
      },
      section_scores: Sequelize.JSONB,
      scores: Sequelize.JSONB,
      raw_json: Sequelize.JSONB,
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('resume_reports');
  },
};
