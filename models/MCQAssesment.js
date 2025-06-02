module.exports = (sequelize, DataTypes) => {
    const MCQAssessment = sequelize.define('MCQAssessment', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      session_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      candidate_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      candidate_email: {
        type: DataTypes.STRING,
        allowNull: false
      },
      position_applied: {
        type: DataTypes.STRING,
        allowNull: false
      },
      company_applied: {
        type: DataTypes.STRING,
        allowNull: false
      },
      reference_code: {
        type: DataTypes.STRING,
        allowNull: false
      },
      job_description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      total_questions: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      score: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      detailed_results: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    });
  
    return MCQAssessment;
  };