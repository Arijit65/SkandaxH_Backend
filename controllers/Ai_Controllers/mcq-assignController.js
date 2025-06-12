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
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(to bottom, #EEF2FF, #ffffff); border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 28px; font-weight: bold; background: linear-gradient(to right, #3B82F6, #8B5CF6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px;">MCQ Assessment Invitation</h1>
            <p style="color: #6B7280; font-size: 16px;">Comprehensive skill-based evaluation</p>
          </div>
          
          <div style="background: white; border-radius: 12px; padding: 25px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
            <p style="font-size: 16px; color: #374151; margin-bottom: 15px;">Hello <span style="font-weight: bold;">${full_name}</span>,</p>
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">You have been invited to take an MCQ assessment for the <b style="color: #4F46E5;">${position_applied}</b> position at <b style="color: #4F46E5;">${company_applied}</b>.</p>
            
            <div style="background: rgba(79, 70, 229, 0.1); border-left: 4px solid #4F46E5; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
              <p style="font-size: 16px; color: #4F46E5; margin: 0;">Assessment Details:</p>
              <ul style="color: #4B5563; padding-left: 20px; margin-top: 10px; margin-bottom: 0;">
                <li style="margin-bottom: 5px;">Total questions: <b>${total_questions}</b></li>
                <li style="margin-bottom: 5px;">Covers: Job-specific knowledge, soft skills, and aptitude</li>
                <li style="margin-bottom: 0;">Time limit: 20 minutes</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${assessmentUrl}" style="display: inline-block; background: linear-gradient(to right, #3B82F6, #8B5CF6); color: white; padding: 14px 28px; text-decoration: none; border-radius: 9999px; font-weight: 500; font-size: 16px; transition: all 0.3s; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);">Start Assessment</a>
            </div>
            
            <p style="font-size: 14px; color: #6B7280; margin-top: 25px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size: 14px; color: #4F46E5; word-break: break-all; margin-bottom: 20px;">${assessmentUrl}</p>
          </div>
          
          <div style="background: linear-gradient(to right, #4F46E5, #8B5CF6); border-radius: 12px; padding: 20px; color: white; text-align: center; margin-bottom: 20px;">
            <p style="font-size: 16px; margin-bottom: 0;">Good luck with your assessment!</p>
          </div>
          
          <div style="text-align: center; color: #6B7280; font-size: 14px;">
            <p>Best regards,<br>The ${company_applied} Recruitment Team</p>
            <p>© ${new Date().getFullYear()} AI Interview System. All rights reserved.</p>
          </div>
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

/**
 * Get all MCQ assessments by email
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getAssessmentsByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const assessments = await MCQAssessment.findAll({
      where: { candidate_email: email },
      order: [['created_at', 'DESC']]
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

/**
 * Get the latest MCQ assessment by email
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getLatestAssessmentByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const assessment = await MCQAssessment.findOne({
      where: { candidate_email: email },
      order: [['created_at', 'DESC']]
    });

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'No assessment found for this email' });
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

/**
 * Get MCQ assessments by position applied (job title)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getAssessmentsByPosition = async (req, res) => {
  try {
    const { position } = req.params;
    if (!position) {
      return res.status(400).json({ success: false, message: 'Position is required' });
    }

    const assessments = await MCQAssessment.findAll({
      where: { position_applied: position },
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: assessments
    });
  } catch (error) {
    console.error('Error fetching assessments by position:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get MCQ assessment by both email and position
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getAssessmentByEmailAndPosition = async (req, res) => {
  try {
    const { email, position } = req.params;
    
    if (!email || !position) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both email and position are required' 
      });
    }

    // Find assessment matching both email and position
    const assessment = await MCQAssessment.findOne({
      where: { 
        candidate_email: email,
        position_applied: position 
      },
      order: [['created_at', 'DESC']]
    });

    if (!assessment) {
      return res.status(404).json({ 
        success: false, 
        message: 'No assessment found for this email and position' 
      });
    }

    return res.status(200).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    console.error('Error fetching assessment by email and position:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};