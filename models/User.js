module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("recruiter", "jobseeker"),
      defaultValue: "jobseeker",
    },
  });

  User.associate = models => {
    User.hasOne(models.Jobseeker, { foreignKey: "userId" });
    User.hasOne(models.Recruiter, { foreignKey: "userId" });
    User.hasMany(models.JobApplication, { foreignKey: "userId" });
  };

  return User;
};