module.exports = (sequelize, DataTypes) => {
  const JobApplication = sequelize.define("JobApplication", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    jobId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
   status: {
   type: DataTypes.STRING,
   defaultValue: 'pending', // or 'applied'
   },
   progressDetails: {
     type: DataTypes.JSON,
     allowNull: true,
     } ,
    resume: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  JobApplication.associate = models => {
    JobApplication.belongsTo(models.User, { foreignKey: "userId" });
    JobApplication.belongsTo(models.Job, { foreignKey: "jobId" });
  };

  return JobApplication;
};