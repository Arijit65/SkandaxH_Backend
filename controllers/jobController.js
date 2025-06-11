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

// exports.getRecommendedJobs = async (req, res) => {
//   try {
//     const userId = req.user.id;  // Get the user ID from the request parameters
//     if(!userId) return res.status(404).json({ message:"provide the user ID"})

//     // Fetch the jobseeker record to get their skills
//     const jobseeker = await Jobseeker.findOne({
//       where: { userId },  // Find the jobseeker using their userId
//     });

//     if (!jobseeker) {
//       return res.status(404).json({ message: 'Jobseeker not found' });
//     }

//     const jobseekerSkills = jobseeker.skills.split(',').map(skill => skill.trim()); // Assuming skills are stored as a comma-separated string

//     // If the jobseeker doesn't have any skills, return an empty response
//     if (!jobseekerSkills || jobseekerSkills.length === 0) {
//       return res.status(404).json({ message: 'No skills found for this jobseeker' });
//     }

//     // Get jobs that match the jobseeker's skills
//     const jobs = await Job.findAll({
//       where: {
//         // Match job skills with jobseeker's skills
//         skills: {
//           [Op.overlap]: jobseekerSkills, // This operator checks for array overlap
//         },
//       },
//     });

//     // If no jobs are found, return a message
//     if (jobs.length === 0) {
//       return res.status(404).json({ message: 'No job recommendations found' });
//     }

//     res.json(jobs);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// Helper function to normalize and clean skills
const normalizeSkill = (skill) => {
  // Handle null, undefined, or non-string values
  if (!skill || typeof skill !== 'string') return '';
  
  return skill
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
    .trim();
};

// Helper function to calculate skill similarity
const calculateSkillSimilarity = (skill1, skill2) => {
  const s1 = normalizeSkill(skill1);
  const s2 = normalizeSkill(skill2);

  // Check exact match
  if (s1 === s2) return 1;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  // Check for word overlap
  const words1 = new Set(s1.split(' '));
  const words2 = new Set(s2.split(' '));
  const intersection = [...words1].filter(word => words2.has(word));
  
  if (intersection.length > 0) {
    return 0.6 * (intersection.length / Math.max(words1.size, words2.size));
  }

  return 0;
};

exports.getRecommendedJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    if(!userId) return res.status(404).json({ message:"provide the user ID" });

    const jobseeker = await Jobseeker.findOne({
      where: { userId },
    });

    if (!jobseeker) {
      return res.status(404).json({ message: 'Jobseeker not found' });
    }

    // Initialize skills with a default empty string if null
    // This ensures we don't get a "Cannot read properties of null" error
    const skills = jobseeker.skills || '';
    console.log("jobseeker skills", skills);

    // If skills is empty after trimming, return early
    if (skills.trim() === '') {
      return res.status(404).json({ message: 'No skills found for this jobseeker' });
    }

    // Safely split the skills
    const jobseekerSkills = skills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill); // Remove empty skills

    if (jobseekerSkills.length === 0) {
      return res.status(404).json({ message: 'No valid skills found for this jobseeker' });
    }

    const allJobs = await Job.findAll();
    
    const matchedJobs = allJobs.map(job => {
      // Handle null or undefined job skills
      const jobSkillsRaw = job.skills || [];
      const jobSkills = Array.isArray(jobSkillsRaw) 
        ? jobSkillsRaw 
        : (typeof jobSkillsRaw === 'string' ? jobSkillsRaw.split(',').map(s => s.trim()) : []);
      
      // Calculate skill matches and their scores
      const skillMatches = jobseekerSkills.map(seekerSkill => {
        // Handle empty jobSkills array
        if (jobSkills.length === 0) return 0;
        
        const bestMatch = Math.max(
          ...jobSkills.map(jobSkill => calculateSkillSimilarity(seekerSkill, jobSkill || ''))
        );
        return bestMatch;
      });

      // Calculate overall match score (0-100)
      const matchScore = Math.round(
        (skillMatches.reduce((sum, score) => sum + score, 0) / jobseekerSkills.length) * 100
      );

      return {
        ...job.toJSON(),
        matchScore,
        relevantSkills: skillMatches.filter(score => score > 0).length
      };
    }).filter(job => job.matchScore > 0);

    // Sort by match score (highest first)
    matchedJobs.sort((a, b) => b.matchScore - a.matchScore);

    if (matchedJobs.length === 0) {
      return res.status(404).json({ message: 'No job recommendations found' });
    }

    res.json(matchedJobs);
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

// Save a job to jobseeker's saved jobs list
exports.saveJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!jobId) {
      return res.status(400).json({ message: "Job ID is required" });
    }

    // Check if the user is a jobseeker
    const user = await User.findOne({ where: { id: userId } });
    if (!user || user.role !== 'jobseeker') {
      return res.status(403).json({ message: 'Only jobseekers can save jobs' });
    }

    // Check if the job exists
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Find the jobseeker
    const jobseeker = await Jobseeker.findOne({
      where: { userId },
    });

    if (!jobseeker) {
      return res.status(404).json({ message: 'Jobseeker profile not found' });
    }

    // Check if the job is already saved
    if (jobseeker.savedJobs && jobseeker.savedJobs.includes(jobId)) {
      return res.status(400).json({ message: 'Job already saved' });
    }

    // Add the job to the saved jobs array
    const updatedSavedJobs = jobseeker.savedJobs ? [...jobseeker.savedJobs, jobId] : [jobId];
    
    // Update the jobseeker record
    await jobseeker.update({ savedJobs: updatedSavedJobs });

    res.status(200).json({ message: 'Job saved successfully', savedJobs: updatedSavedJobs });
  } catch (error) {
    res.status(500).json({ message: 'Error saving job', error: error.message });
  }
};

// Get all saved jobs for a jobseeker
exports.getSavedJobs = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Check if the user is a jobseeker
    const user = await User.findOne({ where: { id: userId } });
    if (!user || user.role !== 'jobseeker') {
      return res.status(403).json({ message: 'Only jobseekers can access saved jobs' });
    }

    // Find the jobseeker
    const jobseeker = await Jobseeker.findOne({
      where: { userId },
    });

    if (!jobseeker) {
      return res.status(404).json({ message: 'Jobseeker profile not found' });
    }

    // If no saved jobs, return empty array
    if (!jobseeker.savedJobs || jobseeker.savedJobs.length === 0) {
      return res.json({ message: 'No saved jobs found', savedJobs: [] });
    }

    // Fetch all saved jobs
    const savedJobs = await Job.findAll({
      where: {
        id: {
          [Op.in]: jobseeker.savedJobs
        }
      }
    });

    res.json({ savedJobs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching saved jobs', error: error.message });
  }
};
