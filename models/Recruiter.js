module.exports = (sequelize, DataTypes) => {
  const Recruiter = sequelize.define("Recruiter", {
    company: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bussinessTag:{
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description:{
      type: DataTypes.STRING,
      allowNull: false,
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  });

  Recruiter.associate = models => {
    Recruiter.belongsTo(models.User, { foreignKey: "userId" });
  };

  return Recruiter;
};