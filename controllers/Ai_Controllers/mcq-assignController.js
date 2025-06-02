const axios = require('axios');
const nodemailer = require('nodemailer');
const db = require('../../models');
const { MCQAssessment } = db;

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// MCQ API URL - Update to use main2.py on port 8001
const MCQ_API_URL = process.env.MCQ_API_URL || 'http://127.0.0.1:8001';

/**
 * Create and send MCQ assessment to candidate
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.createMCQAssessment = async (req, res) => {
  try {
    const {
      full_name,
      position_applied,
      company_applied,
      reference_code,
      job_description,
      num_job_questions = 10,
      num_soft_questions = 10,
      num_aptitude_questions = 10,
      email
    } = req.body;

    // Validate required fields
    if (!full_name || !position_applied || !company_applied || !reference_code || !job_description || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Call the MCQ API to generate assessment - use the new direct assessment endpoint
    const response = await axios.post(`${MCQ_API_URL}/start-interactive-assessment`, {
      full_name,
      position_applied,
      company_applied,
      reference_code,
      job_description,
      num_job_questions,
      num_soft_questions,
      num_aptitude_questions
    });

    if (!response.data || !response.data.session_id) {
      throw new Error('Failed to generate assessment');
    }

    const { session_id, total_questions } = response.data;

    // Create assessment record in database
    const assessment = await MCQAssessment.create({
      session_id,
      candidate_name: full_name,
      candidate_email: email,
      position_applied,
      company_applied,
      reference_code,
      job_description,
      total_questions,
      completed: false,
      created_at: new Date()
    });

    // Generate assessment URL - use the direct question endpoint
    const assessmentUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/mcq-assessment?session_id=${session_id}`;

    // Send email to candidate
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `MCQ Assessment for ${position_applied} at ${company_applied}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>MCQ Assessment Invitation</h2>
          <p>Hello ${full_name},</p>
          <p>You have been invited to take an MCQ assessment for the ${position_applied} position at ${company_applied}.</p>
          <p>The assessment consists of ${total_questions} questions covering job-specific knowledge, soft skills, and aptitude.</p>
          <p>Please click the button below to start your assessment:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${assessmentUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Start Assessment
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p>${assessmentUrl}</p>
          <p>This assessment link will be valid for 20 mins.</p>
          <p>Good luck!</p>
          <p>Best regards,<br>The ${company_applied} Recruitment Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      success: true,
      message: 'Assessment created and email sent successfully',
      data: {
        assessment_id: assessment.id,
        session_id,
        assessment_url: assessmentUrl
      }
    });
  } catch (error) {
    console.error('Error creating MCQ assessment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create assessment',
      error: error.message
    });
  }
};

/**
 * Get assessment status by session ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getAssessmentStatus = async (req, res) => {
  try {
    const { session_id } = req.params;
    
    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Get assessment from database
    const assessment = await MCQAssessment.findOne({
      where: { session_id }
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // If assessment is not completed, check status from MCQ API
    if (!assessment.completed) {
      try {
        const response = await axios.get(`${MCQ_API_URL}/results/${session_id}`);
        
        if (response.data && response.data.score) {
          // Update assessment status in database
          await assessment.update({
            completed: true,
            score: response.data.score.percentage,
            completed_at: new Date()
          });
        }
      } catch (error) {
        // If API call fails, just return current status from database
        console.error('Error checking assessment status from API:', error);
      }
    }

    return res.status(200).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    console.error('Error getting assessment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get assessment status',
      error: error.message
    });
  }
};

/**
 * Get current question for a session
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getQuestion = async (req, res) => {
  try {
    const { session_id } = req.params;
    
    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Check if session exists in database
    const assessment = await MCQAssessment.findOne({
      where: { session_id }
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Get question from MCQ API
    const response = await axios.get(`${MCQ_API_URL}/get-question/${session_id}`);
    
    // Check if assessment is completed
    if (response.data.completed) {
      // Update assessment in database if completed
      if (!assessment.completed) {
        await assessment.update({
          completed: true,
          completed_at: new Date()
        });
      }
      
      return res.status(200).json({
        completed: true,
        message: 'Assessment completed'
      });
    }
    
    // Return question data
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error getting question:', error);
    
    // Check if it's a 404 error from the API
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or expired'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get question',
      error: error.message
    });
  }
};

/**
 * Submit answer for a question
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.submitAnswer = async (req, res) => {
  try {
    const { session_id } = req.params;
    const { answer } = req.body;
    
    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    if (!answer) {
      return res.status(400).json({
        success: false,
        message: 'Answer is required'
      });
    }

    // Check if session exists in database
    const assessment = await MCQAssessment.findOne({
      where: { session_id }
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Submit answer to MCQ API
    const response = await axios.post(`${MCQ_API_URL}/submit-answer`, {
      session_id,
      answer
    });
    
    // Check if assessment is completed
    if (response.data.completed) {
      // Update assessment in database
      await assessment.update({
        completed: true,
        completed_at: new Date()
      });
      
      return res.status(200).json({
        completed: true,
        message: 'Assessment completed'
      });
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Answer submitted successfully',
      completed: false
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    
    // Check if it's a 404 error from the API
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or expired'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to submit answer',
      error: error.message
    });
  }
};

/**
 * Get assessment results
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getResults = async (req, res) => {
  try {
    const { session_id } = req.params;
    
    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Check if session exists in database
    const assessment = await MCQAssessment.findOne({
      where: { session_id }
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Get results from MCQ API
    const response = await axios.get(`${MCQ_API_URL}/results/${session_id}`);
    
    // Update assessment with score if not already set
    if (!assessment.detailed_results && response.data && response.data.score) {
      await assessment.update({
       detailed_results: response.data.results,
       completed: true,
       score: response.data.score.percentage,
       completed_at: new Date()
      });
    }
    
    // Return results
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error getting results:', error);
    
    // Check if it's a 404 error from the API
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or results not available'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get results',
      error: error.message
    });
  }
};

exports.getAssessmentsByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const assessments = await MCQAssessment.findAll({
      where: { candidate_email: email }
    });

    return res.status(200).json({
      success: true,
      data: assessments
    });
  } catch (error) {
    console.error('Error fetching assessments by email:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

exports.getLatestAssessmentByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const assessment = await MCQAssessment.findOne({
      where: { candidate_email: email },
      order: [['updated_at', 'DESC']] // or 'updated_at' if you prefer
    });

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'No assessment found' });
    }

    return res.status(200).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    console.error('Error fetching latest assessment by email:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};