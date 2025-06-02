const express = require("express");
const { authenticateUser } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
//const JobApplication = require("../models/JobApplication");
const { applyForJob, getApplicationsByUser, getApplicationsByRecruiter,getApplicationStatus } = require("../controllers/jobApplicationController");

const router = express.Router();

// Apply for a job with resume upload
// router.post("/", authenticateUser, upload.single("resume"), async (req, res) => {
//   try {
//     const { jobId } = req.body;
//     const userId = req.user.id;

//     // Save job application with resume filename
//     const jobApplication = await JobApplication.create({
//       userId,
//       jobId,
//       resume: req.file ? req.file.filename : null,
//     });

//     res.status(201).json({ message: "Application submitted successfully", jobApplication });
//   } catch (error) {
//     res.status(500).json({ error: "Error submitting application", details: error.message });
//   }
// });
router.post("/", authenticateUser,applyForJob)


// Get all job applications for a user
router.get("/user_applications", authenticateUser, getApplicationsByUser)
//   async (req, res) => {
//   try {
//     const applications = await JobApplication.findAll({ where: { userId: req.user.id } });
//     res.json(applications);
//   } catch (error) {
//     res.status(500).json({ error: "Error fetching applications", details: error.message });
//   }
// });

router.get("/recruiters_applications",authenticateUser,getApplicationsByRecruiter)
router.get('/application-status/:id',getApplicationStatus);
// Redirect to Cloudinary resume URL
router.get("/resume/:cloudinaryId", authenticateUser, async (req, res) => {
  try {
    // For Cloudinary, we'll redirect to the URL instead of downloading
    // The cloudinaryId should be the full Cloudinary URL or public ID
    const cloudinaryUrl = req.params.cloudinaryId;
    
    // If it's a public ID, construct the URL
    if (!cloudinaryUrl.startsWith('http')) {
      // Determine if it's a PDF or DOCX file (assume it is for resume)
      const isPdfOrDocx = true; // For resumes, we assume they are PDF or DOCX
      
      // Construct the Cloudinary URL with the appropriate resource type
      const resourceType = isPdfOrDocx ? 'raw' : 'image';
      
      // Add the fl_attachment flag to force download
      const fullUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_NAME}/${resourceType}/upload/fl_attachment/resumes/${cloudinaryUrl}`;
      
      console.log('Redirecting to Cloudinary URL:', fullUrl);
      return res.redirect(fullUrl);
    }
    
    // If it's already a full URL, just redirect
    res.redirect(cloudinaryUrl);
  } catch (err) {
    res.status(500).json({ error: "Error accessing file", details: err.message });
  }
});




module.exports = router;


// const express = require('express');
// const {
//   applyForJob,
//   getApplicationsByJob,
//   getApplicationsByUser,
//   updateApplicationStatus,
// } = require('../controllers/jobApplicationController');
// const authMiddleware = require('../middleware/authMiddleware');

// const router = express.Router();

// router.post('/', authMiddleware, applyForJob);
// router.get('/my-applications', authMiddleware, getApplicationsByUser);
// router.get('/job/:jobId', authMiddleware, getApplicationsByJob);
// router.put('/:id', authMiddleware, updateApplicationStatus);

// module.exports = router;
