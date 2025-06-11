const db = require('../models');
const { JobApplication,Job,User,MCQAssessment } = db;
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { saveResumeReport } = require('./Ai_Controllers/resumeanalysisController');
const { createMCQAssessment } = require('./Ai_Controllers/mcq-assignController');
const { createInterview } = require('./Ai_Controllers/interviewAPiController');

// Create a temporary directory for downloaded files if it doesn't exist
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Helper to get latest completed assessment by email
async function getLatestCompletedAssessmentByEmail(email, referenceCode = null) {
  const whereClause = {
    candidate_email: email,
    completed: true
  };
  
  // If reference code is provided, use it to find the specific assessment
  if (referenceCode) {
    whereClause.reference_code = referenceCode;
  }
  
  return await MCQAssessment.findOne({
    where: whereClause,
    order: [['updatedAt', 'DESC']]
  });
}

// After assessment is triggered, poll for completion and score(20 mins int)
async function waitForAssessmentScore(email, referenceCode = null, maxAttempts = 30, intervalMs = 1*60*1000) {
  console.log(`Polling for assessment score. Email: ${email}, Reference: ${referenceCode}`);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Get the assessment
    const assessment = await getLatestCompletedAssessmentByEmail(email, referenceCode);
    
    console.log(`Attempt ${attempt + 1}/${maxAttempts}: Found assessment:`, assessment ? 
      `ID: ${assessment.id}, Completed: ${assessment.completed}, Score: ${assessment.score}` : 'No assessment found');
    
    if (assessment && assessment.completed === true && assessment.score !== null) {
      console.log(`Found completed assessment with score: ${assessment.score}`);
      return assessment.score;
    }
    
    // If assessment exists but score is null, try to fetch the latest score from the API
    if (assessment && assessment.session_id) {
      try {
        console.log(`Checking API for latest score for session ${assessment.session_id}`);
        const apiUrl = `${process.env.MCQ_API_URL || 'http://127.0.0.1:8001'}/results/${assessment.session_id}`;
        const response = await axios.get(apiUrl);
        
        if (response.data && response.data.score) {
          // Update assessment score in database
          await assessment.update({
            completed: true,
            score: response.data.score.percentage,
            completed_at: new Date()
          });
          console.log(`Updated assessment score from API: ${response.data.score.percentage}`);
          return response.data.score.percentage;
        }
      } catch (error) {
        console.log(`Error checking API for score: ${error.message}`);
      }
    }
    
    // Wait before next check
    console.log(`Waiting ${intervalMs}ms before next check...`);
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  console.log('Assessment polling timed out without finding a score');
  return null; // Timed out
}

exports.applyForJob = async (req, res) => {
  try {
    // if (req.user.role !== 'job_seeker') {
    //   return res.status(403).json({ message: 'Only job seekers can apply for jobs' });
    // }

    const { jobId, resume } = req.body;
    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if(!resume) return res.status(400).json({ message: 'Resume is required' });

    const application = await JobApplication.create({
      jobId,
      userId: req.user.id,
      resume,
    });

     // Respond to the user immediately
    res.status(201).json(application);
     // Prepare data for resume analysis

  // ---- Background analysis (does not block user) ----
  setImmediate(async () => {
    // Initialize progress steps
    await application.update({ 
      progressDetails: [
        { step: 1, stepName: "Resume Analysis", stepStatus: "Pending" },
        { step: 2, stepName: "Assessment", stepStatus: "Pending" },
        { step: 3, stepName: "Interview", stepStatus: "Pending" }
      ]
    });
    
    // Step 1: Resume Analysis
    try {
      // Update step status to In Progress
      await application.update({ 
        progressDetails: application.progressDetails.map(step => 
          step.step === 1 ? { ...step, stepStatus: "In Progress" } : step
        )
      });
      
      const form = new FormData();
      
      // Handle resume - could be a Cloudinary URL or a local file path
      if (resume.startsWith('http')) {
        // If it's a Cloudinary URL, download the file first
        try {
          const response = await axios.get(resume, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(response.data, 'binary');
          
          // Create a temporary file in the temp directory
          const tempFilePath = path.join(tempDir, `resume-${Date.now()}.pdf`);
          fs.writeFileSync(tempFilePath, buffer);
          
          // Append the file to the form
          form.append('resume', fs.createReadStream(tempFilePath));
          
          // Set up cleanup of temp file after request
          setTimeout(() => {
            try {
              if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
              }
            } catch (err) {
              console.error('Error cleaning up temp file:', err);
            }
          }, 60000); // Clean up after 1 minute
        } catch (error) {
          console.error('Error downloading resume from Cloudinary:', error);
          throw new Error('Could not download resume from cloud storage');
        }
      } else {
        // If it's a local file path, use it directly
        form.append('resume', fs.createReadStream(path.resolve(resume)));
      }
      
      form.append('job_description', job.description);
      form.append('job_role', job.title);

      // Call Flask API
      const flaskResponse = await axios.post(
        `${process.env.RESUME_ANALYSIS_URL}/analyze-resume`, // or your deployed Flask API URL
        form,
        { headers: form.getHeaders(), timeout: 120000 } // increase timeout if needed
      );
      
      // Save Resume Analysis Report
      const resumeReport = await saveResumeReport({
        body: {
          applicationId: application.id,
          userId: req.user.id,
          jobId: job.id,
          report: flaskResponse.data.report,
          scores: flaskResponse.data.scores,
        }
      }, { status: () => ({ json: () => {} }) }); // Dummy res object for controller
      
      console.log('Resume analysis report saved:', resumeReport);
      
      // Update step status to Completed
      await application.update({ 
        progressDetails: application.progressDetails.map(step => 
          step.step === 1 ? { ...step, stepStatus: "Completed", score: flaskResponse.data.report.percentage_score } : step
        )
      });
      
      // Store score for next step
      const score = flaskResponse.data.report.percentage_score;
      
      // Step 2: Assessment
      try {
        // Update step status to In Progress
        await application.update({ 
          progressDetails: application.progressDetails.map(step => 
            step.step === 2 ? { ...step, stepStatus: "In Progress" } : step
          )
        });
        
        let assessmentSent = false;
        if (score >= 30) {
          console.log('Score is 30% or higher. Sending assessment...');
          const referenceCode = `APP-${application.id}`;
          await createMCQAssessment({
            body: {
              full_name: req.user.name,
              position_applied: job.title,
              company_applied: job.company,
              reference_code: referenceCode,
              job_description: job.description,
              email: req.user.email,
              num_job_questions: 5,
              num_soft_questions: 5,
              num_aptitude_questions: 5,
            }
          }, { status: () => ({ json: () => {} }) }); // Dummy res object for controller
          assessmentSent = true;
        } else {
          console.log('Score is below 30%. No assessment sent.');
        }
        
        // Wait for assessment score if assessment was sent
        let assessmentScore = null;
        if (assessmentSent) {
          assessmentScore = await waitForAssessmentScore(req.user.email, `APP-${application.id}`);
          console.log('Assessment score:', assessmentScore);
        }
        
        // Update step status to Completed
        await application.update({ 
          progressDetails: application.progressDetails.map(step => 
            step.step === 2 ? { 
              ...step, 
              stepStatus: "Completed", 
              assessmentSent, 
              assessmentScore 
            } : step
          )
        });
        
        // Step 3: Interview
        try {
          // Update step status to In Progress
          await application.update({ 
            progressDetails: application.progressDetails.map(step => 
              step.step === 3 ? { ...step, stepStatus: "In Progress" } : step
            )
          });
          
          let interviewCreated = false;
          if (assessmentScore !== null && assessmentScore >= 5) {
            console.log('Score is 5% or higher. Creating interview...');
            const interviewResponse = await createInterview({
              body: {
                full_name: req.user.name,
                email: req.user.email,
                job_role: job.title
              }
            }, { status: () => ({ json: () => {} }) // Dummy res object for controller
            });
            console.log('Interview created:', interviewResponse);
            interviewCreated = true;
          } else {
            console.log('Score is below 5% or assessment not taken. No interview created.');
          }
          
          // Update step status to Completed
          await application.update({ 
            progressDetails: application.progressDetails.map(step => 
              step.step === 3 ? { 
                ...step, 
                stepStatus: "Completed", 
                interviewCreated 
              } : step
            )
          });
          
        } catch (interviewError) {
          console.error('Interview step failed:', interviewError.message);
          // Mark only the interview step as error
          await application.update({ 
            progressDetails: application.progressDetails.map(step => 
              step.step === 3 ? { 
                ...step, 
                stepStatus: "Error", 
                error: interviewError.message 
              } : step
            )
          });
        }
        
      } catch (assessmentError) {
        console.error('Assessment step failed:', assessmentError.message);
        // Mark assessment step as error and leave interview as pending
        await application.update({ 
          progressDetails: application.progressDetails.map(step => {
            if (step.step === 2) {
              return { ...step, stepStatus: "Error", error: assessmentError.message };
            } else if (step.step === 3) {
              return { ...step, stepStatus: "Pending" }; // Keep interview pending
            }
            return step;
          })
        });
      }
      
    } catch (resumeError) {
      console.error('Resume analysis step failed:', resumeError.message);
      // Mark resume step as error and leave other steps as pending
      await application.update({ 
        progressDetails: application.progressDetails.map(step => {
          if (step.step === 1) {
            return { ...step, stepStatus: "Error", error: resumeError.message };
          } else {
            return { ...step, stepStatus: "Pending" }; // Keep other steps pending
          }
        })
      });
    }
  });

    // ---- End of background analysis ----

 } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getApplicationsByJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to view applications' });
    }

    const applications = await JobApplication.findAll({ where: { jobId: req.params.jobId } });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getApplicationsByUser = async (req, res) => {
  try {
    const applications = await JobApplication.findAll({ where: { userId: req.user.id } });
    if (!applications) return res.status(404).json({ message: 'No applications found' });
    
      // Fetch user details
    const user = await User.findByPk(req.user.id);

    const jobIds = applications.map(app => app.jobId);
    const jobs = await Job.findAll({ where: { id: jobIds } });
    const applicationsData = applications.map(app => {
      const job = jobs.find(job => job.id === app.jobId);
      return {
        ...app.toJSON(),
        jobTitle: job ? job.title : null,
        companyName: job ? job.company : null,
        location: job ? job.location : null,
        status: app.status,
        dateApplied: app.createdAt,
        progressDetails: app.progressDetails,
        userName: user ? user.name : null,
        userEmail: user ? user.email : null,
      };
    });

    res.json(applicationsData);
    //res.json(applications, jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.getApplicationsByRecruiter = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const jobs = await Job.findAll({ where: { recruiterId } });
    if (!jobs) return res.status(404).json({ message: 'No jobs found for this recruiter' });
    const jobIds = jobs.map(job => job.id); 
    const applications = await JobApplication.findAll({ 
      where: { jobId: jobIds } 
    });

    // Group applications by jobId and include jobTitle
    const groupedApplications = {};
    await Promise.all(applications.map(async (app) => {
      let id = app.userId;
      const user = await User.findByPk(id);
      const job = jobs.find(job => job.id === app.jobId);

      const appData = {
        id: app.id,
        jobId: app.jobId,
        jobTitle: job ? job.title : null,
        status: app.status,
        progressDetails: app.progressDetails,
        dateApplied: app.createdAt,
        applicant: {
          name: user ? user.name : null,
          email: user ? user.email : null,
          phone: user ? user.phone : null,
          resume: app.resume,
          skills: user ? user.skills : [],
          education: user ? user.education : null,
          experience: user ? user.experience : null,
          location: user ? user.location : null
        }
      };

      if (!groupedApplications[app.jobId]) {
        groupedApplications[app.jobId] = {
          jobId: app.jobId,
          jobTitle: job ? job.title : null,
          applications: []
        };
      }
      groupedApplications[app.jobId].applications.push(appData);
    }));

    res.json(Object.values(groupedApplications));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}



exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await JobApplication.findByPk(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const job = await Job.findByPk(application.jobId);
    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update application' });
    }

    await application.update({ status });
    res.json({ message: 'Application status updated', application });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getApplicationStatus = async (req, res) => {
  try {
    const application = await JobApplication.findByPk(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json({
      status: application.status,
      progressDetails: application.progressDetails,
      // add more fields if needed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
