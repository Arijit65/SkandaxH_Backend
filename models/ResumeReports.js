// import { DataTypes } from 'sequelize';
// import sequelize from '../config/sequelize.js'; // your sequelize instance

module.exports = (sequelize, DataTypes) => {
const ResumeReport = sequelize.define('ResumeReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  job_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  application_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  education_match: DataTypes.FLOAT,
  experience_match: DataTypes.FLOAT,
  percentage_score: DataTypes.FLOAT,
  role_match: DataTypes.FLOAT,
  skill_match: DataTypes.FLOAT,
  total_score: DataTypes.FLOAT,
  years_of_experience: DataTypes.FLOAT,
  full_resume_text: DataTypes.TEXT,
  resume_summary: DataTypes.TEXT,
  job_role: DataTypes.STRING,
  matching_skills: DataTypes.ARRAY(DataTypes.TEXT),
  missing_skills: DataTypes.ARRAY(DataTypes.TEXT),
  section_scores: DataTypes.JSONB,
  scores: DataTypes.JSONB,
  raw_json: DataTypes.JSONB,
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'resume_reports',
  timestamps: false
});
ResumeReport.associate = (models) => {
  ResumeReport.belongsTo(models.User, { foreignKey: 'user_id' });
  ResumeReport.belongsTo(models.Job, { foreignKey: 'job_id' });
};
return ResumeReport;

//export default ResumeReport;
}