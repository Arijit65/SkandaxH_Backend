module.exports = (sequelize, DataTypes) => {
  const Jobseeker = sequelize.define("Jobseeker", {
    skills: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: DataTypes.STRING,
    certificates: {
      type: DataTypes.JSONB,
      validate: { isArray(value) { if (!Array.isArray(value)) throw new Error("Certificates must be array"); } },
    },
    education: {
      type: DataTypes.JSONB,
      validate: { isArray(value) { if (!Array.isArray(value)) throw new Error("Education must be array"); } },
    },
    experienceYears: DataTypes.STRING,
    jobDetails: {
      type: DataTypes.JSONB,
      validate: { isArray(value) { if (!Array.isArray(value)) throw new Error("Job details must be array"); } },
    },
    location: DataTypes.STRING,
    designation: DataTypes.STRING,
    resume: DataTypes.STRING,
    githubLink: {
      type: DataTypes.STRING,
      validate: { isUrl: true },
    },
  });

  Jobseeker.associate = models => {
    Jobseeker.belongsTo(models.User, { foreignKey: "userId" });
  };

  return Jobseeker;
};