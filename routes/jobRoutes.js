const express = require("express");
const router = express.Router();
const  Job  = require("../models/Job"); // Import Job model
const { authenticateUser } = require("../middleware/authMiddleware");
const { createJob, getRecommendedJobs, getAllJobs, getJobById, getJobsByRecruiterId, deleteJob, updateJob } = require("../controllers/jobController");
//const { authenticateUser, authorizeAdmin } = require("../middleware/authMiddleware");

// Create a new job (Admin Only)
router.post("/",authenticateUser,createJob);

// Get all jobs
router.get("/", getAllJobs);
  //async (req, res) => {
//   try {
//     const jobs = await Job.findAll();
//     res.json(jobs);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch jobs", details: error.message });
//   }
// });




//Get a specific job by ID
router.get("/get/:id", getJobById)
  
//   async (req, res) => {
//   try {
//     const job = await Job.findByPk(req.params.id);
//     if (!job) {
//       return res.status(404).json({ error: "Job not found" });
//     }
//     res.json(job);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch job", details: error.message });
//   }
// });
router.get("/recruiter_jobs",authenticateUser,getJobsByRecruiterId)




//get jobseekers recommended jobs

router.get("/recommended_job",authenticateUser ,getRecommendedJobs)

// Update a job (Admin Only)
router.put("/:id",authenticateUser,updateJob) 
//   async (req, res) => {
//   try {
//     const job = await Job.findByPk(req.params.id);
//     if (!job) {
//       return res.status(404).json({ error: "Job not found" });
//     }
//     await job.update(req.body);
//     res.json(job);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to update job", details: error.message });
//   }
// });

// Delete a job (Admin Only)
router.delete("/:id",authenticateUser,deleteJob );
  
  
//   async (req, res) => {
//   try {
//     const job = await Job.findByPk(req.params.id);
//     if (!job) {
//       return res.status(404).json({ error: "Job not found" });
//     }
//     await job.destroy();
//     res.json({ message: "Job deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to delete job", details: error.message });
//   }
// });

module.exports = router;
