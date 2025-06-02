const { Sequelize } = require('sequelize');
const db = require('../models');
const { Job, Jobseeker,Recruiter,User } = db;
const { Op } = db.Sequelize;
//const db = require('../models');
// console.log("All models in db:", Object.keys(db));
// console.log("Job model:", db.Job);


exports.createJob = async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Only recruiters can post jobs' });
    }

    const { title, description, company, location, salary, skills, designation,requirements,experience } = req.body;

    // Validate required fields
    if (!title || !description || !company || !location || !skills || !designation || !requirements || !experience) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Convert skills to an array if it's sent as a comma-separated string
    const skillsArray = Array.isArray(skills) ? skills : skills.split(',').map(skill => skill.trim());
    const requirementsArray = Array.isArray(requirements) ? requirements : requirements.split(',').map(req => req.trim());
    const job = await Job.create({
      title,
      description,
      company,
      location,
      salary,
      skills: skillsArray,
      experience,
      designation,
      requirements: requirementsArray,
      recruiterId: req.user.id, // Storing the recruiter who created the job
    });

    res.status(201).json({ message: "Job posted successfully", job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllJobs = async (req, res) => {
  try {
    //console.log("Is Job model valid Sequelize Model?", typeof Job.findAll === 'function');

    const jobs = await Job.findAll();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to edit this job' });
    }

    await job.update(req.body);
    res.json({ message: 'Job updated successfully', job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this job' });
    }

    await job.destroy();
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRecommendedJobs = async (req, res) => {
  try {
    const userId = req.user.id;  // Get the user ID from the request parameters
    if(!userId) return res.status(404).json({ message:"provide the user ID"})

    // Fetch the jobseeker record to get their skills
    const jobseeker = await Jobseeker.findOne({
      where: { userId },  // Find the jobseeker using their userId
    });

    if (!jobseeker) {
      return res.status(404).json({ message: 'Jobseeker not found' });
    }

    const jobseekerSkills = jobseeker.skills.split(',').map(skill => skill.trim()); // Assuming skills are stored as a comma-separated string

    // If the jobseeker doesn't have any skills, return an empty response
    if (!jobseekerSkills || jobseekerSkills.length === 0) {
      return res.status(404).json({ message: 'No skills found for this jobseeker' });
    }

    // Get jobs that match the jobseeker's skills
    const jobs = await Job.findAll({
      where: {
        // Match job skills with jobseeker's skills
        skills: {
          [Op.overlap]: jobseekerSkills, // This operator checks for array overlap
        },
      },
    });

    // If no jobs are found, return a message
    if (jobs.length === 0) {
      return res.status(404).json({ message: 'No job recommendations found' });
    }

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getJobsByRecruiterId = async (req,res)=>{
  try {
    const userId = req.user.id
  if(!userId) return res.status(404).json({ message:"provide the user ID"})
    // const recruiter = await User.findOne({
    //   where: { {id:userId} }
    // });
    // if (!recruiter) {
    //   return res.status(404).json({ message: 'Recruiter not found' });
    // }
        // Find the user by ID
    const user = await User.findOne({ where: { id: userId } });
    if (!user || user.role !== 'recruiter') {
      return res.status(404).json({ message: 'Recruiter not found' });
    }
    const recruiterId = userId;
    console.log("recruiterId",recruiterId)
    const jobs = await Job.findAll({
      where: {recruiterId},
    });
    if (jobs.length === 0) {
      return res.status(404).json({ message: 'No jobs found for this recruiter' });
    }
    res.json(jobs);
    
  } catch (error) {
    res.status(401).json({msg:"error in getting the jobs by recruiter id",error: error.message})
    
  }
}
