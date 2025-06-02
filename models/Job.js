module.exports = (sequelize, DataTypes) => {
  const Job = sequelize.define("Job", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    company: {
      type: DataTypes.STRING,
      allowNull: false
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    salary: {
      type: DataTypes.STRING,
      allowNull: true
    },
    experience: {
      type: DataTypes.STRING,  // General experience field
      allowNull: true
    },
    skills: {
      type: DataTypes.ARRAY(DataTypes.STRING), // Stores skills as an array of strings
      allowNull: false
    },
    designation: {
      type: DataTypes.STRING, // Job role/title
      allowNull: false
    },
    requirements: {
      type: DataTypes.ARRAY(DataTypes.STRING), // Stores skills as an array of strings
      allowNull: true
    },
    recruiterId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users', // Assuming your recruiter is stored in the Users table
        key: 'id'
      }
    }
  }, {
    timestamps: true
  });

  Job.associate = models => {
    Job.hasMany(models.JobApplication, { foreignKey: "jobId" });
  };

  return Job;
};