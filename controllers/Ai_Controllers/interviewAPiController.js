const axios = require('axios');
const nodemailer = require('nodemailer');
const { Interview } = require('../../models');

// Flask API URL (update as needed)
const INTERVIEW_API_URL = process.env.INTERVIEW_API_URL || 'http://127.0.0.1:5001';

// Email transporter config
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Start interview and send email
exports.createInterview = async (req, res) => {
  try {
    const { full_name, email, job_role } = req.body;

    if (!full_name || !email || !job_role) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Call Flask API to start interview
    const response = await axios.post(`${INTERVIEW_API_URL}/start_interview`, { job_role });

    if (!response.data || !response.data.questions) {
      throw new Error('Failed to generate interview');
    }
      // Extract the new session ID
    const sessionId = response.data.session_id;
    const questions = response.data.questions;

     // Persist the interview in our DB
     await Interview.create({
      sessionId,
      fullName: full_name,email,
      jobRole: job_role,
      questions
     })

    // You can generate a unique interview link or token here if needed
    // For example, you might want to store the interview session in your DB and generate a link

    // Example interview link (customize as needed)
       const base =  process.env.INTERVIEW_API_URL || 'http://127.0.0.1:5001'; //
      // const interviewLink = `${base}/interview?interview_id=${sessionId}&email=${encodeURIComponent(email)}`;
       const interviewLink = `${base}/?interview_id=${sessionId}&email=${encodeURIComponent(email)}`;

    // Send email to candidate
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Interview Invitation for ${job_role}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(to bottom, #EEF2FF, #ffffff); border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 28px; font-weight: bold; background: linear-gradient(to right, #3B82F6, #8B5CF6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px;">AI Interview Invitation</h1>
            <p style="color: #6B7280; font-size: 16px;">Complete AI-powered interview evaluation</p>
          </div>
          
          <div style="background: white; border-radius: 12px; padding: 25px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
            <p style="font-size: 16px; color: #374151; margin-bottom: 15px;">Hello <span style="font-weight: bold;">${full_name}</span>,</p>
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">You have been invited to take an AI-powered interview for the <b style="color: #4F46E5;">${job_role}</b> position.</p>
            <p style="font-size: 16px; color: #374151; margin-bottom: 25px;">This interview will evaluate your skills, experience, and fit for the role using our advanced AI assessment system.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${interviewLink}" style="display: inline-block; background: linear-gradient(to right, #3B82F6, #8B5CF6); color: white; padding: 14px 28px; text-decoration: none; border-radius: 9999px; font-weight: 500; font-size: 16px; transition: all 0.3s; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);">Start Interview</a>
            </div>
            
            <p style="font-size: 14px; color: #6B7280; margin-top: 25px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size: 14px; color: #4F46E5; word-break: break-all; margin-bottom: 20px;">${interviewLink}</p>
          </div>
          
          <div style="background: linear-gradient(to right, #4F46E5, #8B5CF6); border-radius: 12px; padding: 20px; color: white; text-align: center; margin-bottom: 20px;">
            <p style="font-size: 16px; margin-bottom: 0;">Good luck with your interview!</p>
          </div>
          
          <div style="text-align: center; color: #6B7280; font-size: 14px;">
            <p>© ${new Date().getFullYear()} AI Interview System. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      success: true,
      message: 'Interview created and email sent successfully',
      data: {
        questions: response.data.questions,
        interview_link: interviewLink,
        questions,
        session_id: sessionId,
        interview_link: interviewLink
      }
    });
  } catch (error) {
    console.error('Error creating interview:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create interview',
      error: error.message
    });
  }
  

};


 exports.saveInterview = async (req, res) => {
  const { session_id, responses, report_url, analysis, rawLog } = req.body;

  try {
    await Interview.update(
      {
        responses,
        reportUrl:  report_url,
        status:     'completed',
        scoring: analysis,   // your per-question JSON scores
        interpretation: rawLog      // full console log string
      },
      { where: { sessionId: session_id } }
    );
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getInterviewsByEmail = async (req, res) => {
  const { email } = req.params;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  try {
    const interviews = await Interview.findAll({ where: { email } });
    return res.status(200).json({ success: true, data: interviews });
  } catch (err) {
    console.error('Error fetching interviews by email:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get the latest interview by email
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getLatestInterviewByEmail = async (req, res) => {
  const { email } = req.params;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  try {
    const interview = await Interview.findOne({
      where: { email },
      order: [['createdAt', 'DESC']]
    });
    
    if (!interview) {
      return res.status(404).json({ success: false, message: 'No interview found for this email' });
    }
    
    return res.status(200).json({ success: true, data: interview });
  } catch (err) {
    console.error('Error fetching latest interview by email:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get interviews by job role
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getInterviewsByJobRole = async (req, res) => {
  const { jobRole } = req.params;
  if (!jobRole) {
    return res.status(400).json({ success: false, message: 'Job role is required' });
  }
  try {
    const interviews = await Interview.findAll({
      where: { jobRole },
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json({ success: true, data: interviews });
  } catch (err) {
    console.error('Error fetching interviews by job role:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

