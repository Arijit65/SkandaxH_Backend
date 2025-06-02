// models/interviewModel.js
module.exports = (sequelize, DataTypes) => {
  const Interview = sequelize.define('Interview', {
    sessionId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true }
    },
    jobRole: {
      type: DataTypes.STRING,
      allowNull: false
    },
    questions: {
      type: DataTypes.JSON,
      allowNull: false
    },
    responses: {
      type: DataTypes.JSON,
      allowNull: true
    },
    reportUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending'
    },
    scoring: {
      type: DataTypes.JSON,
      allowNull: true
    },
    overallScore: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    interpretation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });
  
  Interview.associate = models => {
    // if you ever want associations, e.g. Interview.belongsTo(models.User)
  };

  return Interview;
};
